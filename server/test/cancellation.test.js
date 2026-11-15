const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { prisma } = require("../../dist/config/db");
const app = require("../../dist/app").default;
const { createAuthToken } = require("../../dist/middleware/authMiddleware");

process.env.AUTH_TOKEN_SECRET = "cancellation-tests-use-a-long-random-secret";

const activeStatuses = new Set(["PENDING", "CONFIRMED"]);
const tokenFor = (userId) => createAuthToken(userId);
const authHeaders = (userId) => ({ authorization: `Bearer ${tokenFor(userId)}` });
const fixture = () => ({
  bookingId: 100,
  pnr: "TESTPNR",
  userId: 2,
  status: "CONFIRMED",
  flightId: 50,
  flight: {
    flightNum: "FX-102",
    status: "SCHEDULED",
    price: 5400,
    departureTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
  payment: { paymentId: 5, transactionStatus: "SUCCESS" },
  tickets: [
    {
      ticketId: 501,
      status: "CONFIRMED",
      passenger: { firstName: "Ari", lastName: "Patel" },
      seat: { seatNumber: "1A" },
    },
    {
      ticketId: 502,
      status: "CONFIRMED",
      passenger: { firstName: "Sam", lastName: "Lee" },
      seat: { seatNumber: "1B" },
    },
  ],
});

let server;
let baseUrl;
let booking;
let flight;
let statuses;
let refunds;
let notifications;
let flightUpdated;

const request = (path, options = {}) =>
  fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...options.headers,
    },
  });

before(async () => {
  booking = fixture();
  statuses = new Map(booking.tickets.map((ticket) => [ticket.ticketId, ticket.status]));
  refunds = [];
  notifications = [];
  flight = {
    flightId: 50,
    flightNum: "FX-102",
    status: "SCHEDULED",
    price: 5400,
    departureTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
    bookings: [{ ...booking, tickets: booking.tickets }],
  };
  prisma.user.findUnique = async ({ where }) => ({
    id: where.id,
    role: where.id === 1 ? "ADMIN" : "USER",
  });
  prisma.booking.findFirst = async () => booking;
  prisma.booking.findUnique = async () => booking;
  prisma.flight.findUnique = async () => flight;
  prisma.ticket.count = async ({ where }) =>
    [...statuses.values()].filter(
      (status) => activeStatuses.has(status) && where.bookingId === booking.bookingId,
    ).length;
  prisma.$transaction = async (callback) => callback({
    booking: {
      findUnique: async () => booking,
      update: async ({ data }) => {
        booking.status = data.status;
        return booking;
      },
    },
    ticket: {
      updateMany: async ({ where, data }) => {
        for (const ticketId of where.ticketId.in) statuses.set(ticketId, data.status);
        return { count: where.ticketId.in.length };
      },
      count: async () =>
        [...statuses.values()].filter((status) => activeStatuses.has(status)).length,
    },
    refund: {
      createMany: async ({ data }) => {
        refunds.push(...data);
        return { count: data.length };
      },
    },
    notification: {
      create: async ({ data }) => {
        notifications.push(data);
        return data;
      },
      createMany: async ({ data }) => {
        notifications.push(...data);
        return { count: data.length };
      },
    },
    flight: {
      findUnique: async () => flight,
      update: async ({ data }) => {
        flightUpdated = data;
        return flight;
      },
    },
  });

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await prisma.$disconnect();
});

test("cancellation quote includes selected passengers, full refund, and no fee", async () => {
  const response = await request("/bookings/100/cancellation-quote", {
    method: "POST",
    headers: authHeaders(2),
    body: JSON.stringify({ ticketIds: [501] }),
  });
  assert.equal(response.status, 200);
  const quote = await response.json();
  assert.equal(quote.refundAmount, 5400);
  assert.equal(quote.cancellationFee, 0);
  assert.deepEqual(quote.tickets.map((ticket) => ticket.ticketId), [501]);
});

test("customer cancellation changes only the selected ticket and preserves booking", async () => {
  booking = fixture();
  statuses = new Map(booking.tickets.map((ticket) => [ticket.ticketId, ticket.status]));
  refunds = [];
  const response = await request("/bookings/100/cancel", {
    method: "POST",
    headers: authHeaders(2),
    body: JSON.stringify({ ticketIds: [501] }),
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.status, "CONFIRMED");
  assert.equal(result.refundAmount, 5400);
  assert.equal(statuses.get(501), "CANCELLED");
  assert.equal(statuses.get(502), "CONFIRMED");
  assert.equal(booking.status, "CONFIRMED");
  assert.equal(refunds.length, 1);
  assert.equal(refunds[0].ticketId, 501);
});

test("customer cancellation is blocked within two hours of departure", async () => {
  const priorDeparture = booking.flight.departureTime;
  booking.flight.departureTime = new Date(Date.now() + 60 * 60 * 1000);
  const response = await request("/bookings/100/cancel", {
    method: "POST",
    headers: authHeaders(2),
    body: JSON.stringify({ ticketIds: [502] }),
  });
  assert.equal(response.status, 409);
  booking.flight.departureTime = priorDeparture;
});

test("admin ticket cancellation requires a reason and queues refund notification", async () => {
  booking = fixture();
  statuses = new Map(booking.tickets.map((ticket) => [ticket.ticketId, ticket.status]));
  refunds = [];
  notifications = [];
  const response = await request("/admin/bookings/100/cancel", {
    method: "POST",
    headers: authHeaders(1),
    body: JSON.stringify({ ticketIds: [501], reason: "Customer requested" }),
  });
  assert.equal(response.status, 200);
  assert.equal(statuses.get(501), "CANCELLED");
  assert.equal(statuses.get(502), "CONFIRMED");
  assert.equal(refunds.length, 1);
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].status, undefined);
});

test("admin flight cancellation reports impact and marks every active ticket flight-cancelled", async () => {
  booking = fixture();
  statuses = new Map(booking.tickets.map((ticket) => [ticket.ticketId, ticket.status]));
  refunds = [];
  notifications = [];
  flight = {
    flightId: 50,
    flightNum: "FX-102",
    status: "SCHEDULED",
    price: 5400,
    departureTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
    bookings: [{ ...booking, tickets: booking.tickets }],
  };
  flightUpdated = null;
  const response = await request("/admin/flights/50/cancel", {
    method: "POST",
    headers: authHeaders(1),
    body: JSON.stringify({ reason: "Schedule change" }),
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.impactedPassengers, 2);
  assert.equal(result.impactedBookings, 1);
  assert.equal(result.refundAmount, 10800);
  assert.equal(flightUpdated.status, "CANCELLED");
  assert.equal(statuses.get(501), "FLIGHT_CANCELLED");
  assert.equal(statuses.get(502), "FLIGHT_CANCELLED");
  assert.equal(notifications.length, 1);
});

test("admin cannot cancel a ticket or flight after departure", async () => {
  booking = fixture();
  statuses = new Map(booking.tickets.map((ticket) => [ticket.ticketId, ticket.status]));
  booking.flight.departureTime = new Date(Date.now() - 1000);

  const ticketResponse = await request("/admin/bookings/100/cancel", {
    method: "POST",
    headers: authHeaders(1),
    body: JSON.stringify({ ticketIds: [501], reason: "Customer requested" }),
  });
  assert.equal(ticketResponse.status, 409);

  flight = {
    flightId: 50,
    flightNum: "FX-102",
    status: "SCHEDULED",
    price: 5400,
    departureTime: new Date(Date.now() - 1000),
    bookings: [],
  };
  const flightResponse = await request("/admin/flights/50/cancel", {
    method: "POST",
    headers: authHeaders(1),
    body: JSON.stringify({ reason: "Schedule change" }),
  });
  assert.equal(flightResponse.status, 409);
});

test("users cannot cancel an entire trip after departure", async () => {
  booking = fixture();
  booking.flight.departureTime = new Date(Date.now() - 1000);
  statuses = new Map(booking.tickets.map((ticket) => [ticket.ticketId, ticket.status]));

  const response = await request("/bookings/100/cancel", {
    method: "POST",
    headers: authHeaders(2),
    body: JSON.stringify({ cancelEntireTrip: true }),
  });
  assert.equal(response.status, 409);
  assert.equal(statuses.get(501), "CONFIRMED");
  assert.equal(statuses.get(502), "CONFIRMED");
});
