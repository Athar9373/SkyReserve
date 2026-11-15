const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const bcrypt = require("bcryptjs");
const { prisma } = require("../../dist/config/db");
const app = require("../../dist/app").default;
const { createAuthToken } = require("../../dist/middleware/authMiddleware");

process.env.AUTH_TOKEN_SECRET = "admin-endpoint-tests-use-a-long-random-secret";

const airports = [
  {
    airportCode: "PNQ",
    city: "Pune",
    country: "India",
    name: "Canonical Pune Airport",
  },
  {
    airportCode: "DEL",
    city: "New Delhi",
    country: "India",
    name: "Canonical Delhi Airport",
  },
];
const flightPayload = {
  flightNum: "AI-852",
  airlineCode: "AI",
  airlineName: "Air India",
  sourceAirport: {
    airportCode: "PNQ",
    city: "Not trusted",
    country: "Not trusted",
    name: "Not trusted",
  },
  destAirport: { airportCode: "DEL" },
  departureTime: "2030-03-10T10:00:00.000Z",
  arrivalTime: "2030-03-10T12:15:00.000Z",
  durationMinutes: 1,
  price: 5400,
};

let server;
let baseUrl;
let authRole = "ADMIN";
let createdFlight;
let userToDeleteExists = true;
let relatedBookings = 0;
let relatedPassengers = 0;
const deletedUserIds = [];

const adminHeaders = () => ({
  authorization: `Bearer ${createAuthToken(1)}`,
});
const userHeaders = () => ({
  authorization: `Bearer ${createAuthToken(2)}`,
});
const request = (path, options = {}) =>
  fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...options.headers,
    },
  });

before(async () => {
  const passwordHash = await bcrypt.hash("password", 4);
  prisma.user.findUnique = async ({ where }) => {
    if (where.email) {
      if (where.email === "new-user@example.test") return null;
      return {
        id: 1,
        firstName: "Admin",
        lastName: "User",
        email: where.email,
        phoneNumber: "123",
        password: passwordHash,
        role: "ADMIN",
      };
    }
    if (where.id === 1) return { id: 1, role: "ADMIN" };
    if (where.id === 2) return { id: 2, role: authRole };
    if (where.id === 5 && userToDeleteExists) return { id: 5 };
    return null;
  };
  prisma.user.create = async ({ data }) => ({
    id: 3,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phoneNumber: data.phoneNumber,
    role: "USER",
  });
  prisma.user.findMany = async () => [
    {
      id: 2,
      firstName: "Casey",
      lastName: "User",
      email: "casey@example.test",
      phoneNumber: "555",
      role: "USER",
    },
  ];
  prisma.user.delete = async ({ where }) => {
    deletedUserIds.push(where.id);
  };
  prisma.booking.count = async () => relatedBookings;
  prisma.passenger.count = async () => relatedPassengers;
  prisma.airport.findMany = async ({ where }) =>
    airports.filter((airport) =>
      where.airportCode.in.includes(airport.airportCode),
    );
  prisma.aircraft.findFirst = async () => ({ aircraftId: 7 });
  prisma.$transaction = async (callback) =>
    callback({
      airline: {
        upsert: async ({ where, create }) => ({
          airlineCode: where.airlineCode,
          name: create.name,
        }),
      },
      flight: {
        create: async ({ data }) => {
          createdFlight = {
            ...data,
            flightId: 31,
            airline: { airlineCode: "AI", name: "Air India" },
            sourceAirport: airports[0],
            destAirport: airports[1],
          };
          return createdFlight;
        },
      },
    });
  prisma.flight.findMany = async () => (createdFlight ? [createdFlight] : []);

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

test("login returns identity, role, and a signed token", async () => {
  const response = await request("/public/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@example.test", password: "password" }),
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.userId, 1);
  assert.equal(body.role, "ADMIN");
  assert.equal(typeof body.token, "string");
});

test("registration returns the default user role and a signed token", async () => {
  const response = await request("/public/auth/register", {
    method: "POST",
    body: JSON.stringify({
      firstName: "New",
      lastName: "User",
      email: "new-user@example.test",
      phoneNumber: "555",
      password: "password",
    }),
  });
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.userId, 3);
  assert.equal(body.role, "USER");
  assert.equal(typeof body.token, "string");
});

test("admin user endpoints enforce bearer authentication and admin role", async () => {
  const noToken = await request("/admin/users", {
    headers: { user_id: "1" },
  });
  assert.equal(noToken.status, 401);

  authRole = "USER";
  const denied = await request("/admin/users", { headers: userHeaders() });
  assert.equal(denied.status, 403);

  authRole = "ADMIN";
  const allowed = await request("/admin/users", { headers: adminHeaders() });
  assert.equal(allowed.status, 200);
  const users = await allowed.json();
  assert.deepEqual(users, [
    {
      userId: 2,
      firstName: "Casey",
      lastName: "User",
      email: "casey@example.test",
      phoneNumber: "555",
      role: "USER",
    },
  ]);
});

test("user deletion validates IDs, prevents self-delete, and protects related data", async () => {
  deletedUserIds.length = 0;
  const noId = await request("/admin/users", {
    method: "DELETE",
    headers: adminHeaders(),
  });
  assert.equal(noId.status, 400);

  const invalidId = await request("/admin/users/not-an-id", {
    method: "DELETE",
    headers: adminHeaders(),
  });
  assert.equal(invalidId.status, 400);

  const selfDelete = await request("/admin/users/1", {
    method: "DELETE",
    headers: adminHeaders(),
  });
  assert.equal(selfDelete.status, 409);

  const missingUser = await request("/admin/users/99", {
    method: "DELETE",
    headers: adminHeaders(),
  });
  assert.equal(missingUser.status, 404);

  relatedBookings = 1;
  const hasBookings = await request("/admin/users/5", {
    method: "DELETE",
    headers: adminHeaders(),
  });
  assert.equal(hasBookings.status, 409);
  relatedBookings = 0;
  relatedPassengers = 1;
  const hasPassengers = await request("/admin/users/5", {
    method: "DELETE",
    headers: adminHeaders(),
  });
  assert.equal(hasPassengers.status, 409);
  relatedPassengers = 0;

  const deleted = await request("/admin/users/5", {
    method: "DELETE",
    headers: adminHeaders(),
  });
  assert.equal(deleted.status, 204);
  assert.deepEqual(deletedUserIds, [5]);
});

test("flight creation validates input and uses canonical server-side data", async () => {
  const invalidPrice = await request("/admin/flights", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ ...flightPayload, price: 0 }),
  });
  assert.equal(invalidPrice.status, 400);

  const sameAirport = await request("/admin/flights", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({
      ...flightPayload,
      destAirport: { airportCode: "PNQ" },
    }),
  });
  assert.equal(sameAirport.status, 400);

  const unknownAirport = await request("/admin/flights", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({
      ...flightPayload,
      sourceAirport: { airportCode: "XXX" },
    }),
  });
  assert.equal(unknownAirport.status, 400);

  const badTimes = await request("/admin/flights", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({
      ...flightPayload,
      arrivalTime: "2030-03-10T09:00:00.000Z",
    }),
  });
  assert.equal(badTimes.status, 400);

  const invalidCalendarDate = await request("/admin/flights", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({
      ...flightPayload,
      departureTime: "2030-02-30T10:00:00.000Z",
    }),
  });
  assert.equal(invalidCalendarDate.status, 400);

  authRole = "USER";
  const denied = await request("/admin/flights", {
    method: "POST",
    headers: userHeaders(),
    body: JSON.stringify(flightPayload),
  });
  assert.equal(denied.status, 403);

  authRole = "ADMIN";
  const response = await request("/admin/flights", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(flightPayload),
  });
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.flightId, 31);
  assert.equal(body.durationMinutes, 135);
  assert.equal(body.sourceAirport.name, "Canonical Pune Airport");
  assert.equal(body.destAirport.name, "Canonical Delhi Airport");
  assert.equal(createdFlight.aircraftId, 7);
});

test("a newly created flight is returned by flight search", async () => {
  const response = await request(
    "/flights/search?source=PNQ&destination=DEL&date=2030-03-10",
  );
  assert.equal(response.status, 200);
  const flights = await response.json();
  assert.equal(flights.length, 1);
  assert.equal(flights[0].flightId, 31);
  assert.equal(flights[0].durationMinutes, 135);
});
