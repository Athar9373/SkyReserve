import { Prisma } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db";
import { cancelBookingTickets } from "../services/cancellationService";

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        role: true,
      },
      orderBy: { id: "asc" },
    });
    return res.json(
      users.map((user) => ({
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      })),
    );
  } catch (err) {
    return next(err);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userIdParam = req.params.userId;
  if (!/^[1-9]\d*$/.test(userIdParam)) {
    return res.status(400).json({ error: "A valid userId is required" });
  }
  const userId = Number(userIdParam);
  if (!Number.isSafeInteger(userId)) {
    return res.status(400).json({ error: "A valid userId is required" });
  }
  if (userId === req.userId) {
    return res.status(409).json({ error: "You cannot delete your own account" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.role === "ADMIN") {
      return res.status(409).json({ error: "Admin accounts cannot be deleted" });
    }

    const [bookingCount, passengerCount] = await Promise.all([
      prisma.booking.count({ where: { userId } }),
      prisma.passenger.count({ where: { userId } }),
    ]);
    if (bookingCount || passengerCount) {
      return res.status(409).json({
        error: "User has bookings or passenger records and cannot be safely deleted",
      });
    }

    try {
      await prisma.user.delete({ where: { id: userId } });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2003"
      ) {
        return res.status(409).json({
          error: "User has related records and cannot be safely deleted",
        });
      }
      throw err;
    }
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

export const getAdminBookings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        flight: { include: { airline: true, sourceAirport: true, destAirport: true } },
        tickets: {
          include: { passenger: true, seat: true },
          orderBy: { ticketId: "asc" },
        },
      },
      orderBy: { bookingDate: "desc" },
    });
    return res.json(bookings.map((booking) => ({
      bookingId: booking.bookingId,
      pnr: booking.pnr,
      status: booking.status,
      bookingDate: booking.bookingDate.toISOString(),
      totalFare: booking.totalAmount,
      user: {
        userId: booking.user.id,
        name: `${booking.user.firstName} ${booking.user.lastName}`,
        email: booking.user.email,
      },
      flight: {
        flightId: booking.flight.flightId,
        flightNumber: booking.flight.flightNum,
        airlineName: booking.flight.airline.name,
        sourceAirportCode: booking.flight.sourceCode,
        destAirportCode: booking.flight.destCode,
        departureTime: booking.flight.departureTime.toISOString(),
        status: booking.flight.status,
      },
      tickets: booking.tickets.map((ticket) => ({
        ticketId: ticket.ticketId,
        passengerName: `${ticket.passenger.firstName} ${ticket.passenger.lastName}`,
        seatNumber: ticket.seat.seatNumber,
        status: ticket.status,
      })),
    })));
  } catch (err) {
    return next(err);
  }
};

export const cancelAdminBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const bookingId = Number(req.params.bookingId);
  const { ticketIds, reason } = req.body ?? {};
  if (!Number.isSafeInteger(bookingId) || bookingId <= 0) {
    return res.status(400).json({ error: "A valid booking ID is required" });
  }
  if (typeof reason !== "string" || reason.trim().length < 3 || reason.trim().length > 300) {
    return res.status(400).json({ error: "An administrative cancellation reason is required (3-300 characters)" });
  }
  if (ticketIds !== undefined &&
      (!Array.isArray(ticketIds) || ticketIds.some((id: unknown) => !Number.isSafeInteger(id)))) {
    return res.status(400).json({ error: "Ticket IDs must be an array of valid integers" });
  }

  try {
    const result = await cancelBookingTickets({
      bookingId,
      ticketIds,
      reason: reason.trim(),
      userInitiated: false,
      notifyUser: true,
    });
    return res.json(result);
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode) return res.status(statusCode).json({ error: (err as Error).message });
    return next(err);
  }
};

export const getFlightSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const flights = await prisma.flight.findMany({
      include: {
        airline: true,
        sourceAirport: true,
        destAirport: true,
        bookings: {
          include: {
            tickets: { where: { status: { in: ["PENDING", "CONFIRMED"] } } },
          },
        },
      },
      orderBy: { flightId: "desc" },
    });
    return res.json(flights.map((flight) => ({
      flightId: flight.flightId,
      flightNum: flight.flightNum,
      airlineCode: flight.airlineCode,
      airlineName: flight.airline.name,
      sourceAirport: flight.sourceAirport,
      destAirport: flight.destAirport,
      departureTime: flight.departureTime.toISOString(),
      arrivalTime: flight.arrivalTime.toISOString(),
      durationMinutes: flight.durationMinutes,
      price: flight.price,
      status: flight.status,
      bookedPassengerCount: flight.bookings.reduce((sum, booking) => sum + booking.tickets.length, 0),
      bookingCount: flight.bookings.filter((booking) => booking.tickets.length > 0).length,
    })));
  } catch (err) {
    return next(err);
  }
};

export const cancelAdminFlight = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const flightId = Number(req.params.flightId);
  const { reason } = req.body ?? {};
  if (!Number.isSafeInteger(flightId) || flightId <= 0) {
    return res.status(400).json({ error: "A valid flight ID is required" });
  }
  if (typeof reason !== "string" || reason.trim().length < 3 || reason.trim().length > 300) {
    return res.status(400).json({ error: "An administrative cancellation reason is required (3-300 characters)" });
  }

  try {
    const flight = await prisma.$transaction(async (transaction) => {
      const currentFlight = await transaction.flight.findUnique({
        where: { flightId },
        include: {
          bookings: {
            include: {
              payment: true,
              tickets: {
                where: { status: { in: ["PENDING", "CONFIRMED"] } },
                include: { passenger: true, seat: true },
              },
            },
          },
        },
      });
      if (!currentFlight) return undefined;
      if (currentFlight.status === "CANCELLED") {
        throw Object.assign(new Error("Flight is already cancelled"), { statusCode: 409 });
      }
      if (Date.now() >= currentFlight.departureTime.getTime()) {
        throw Object.assign(
          new Error("Flights cannot be cancelled after departure"),
          { statusCode: 409 },
        );
      }

      const impacted = currentFlight.bookings.flatMap((booking) =>
        booking.tickets.map((ticket) => ({ booking, ticket })),
      );
      await transaction.flight.update({
        where: { flightId },
        data: { status: "CANCELLED", cancellationReason: reason.trim() },
      });
      for (const booking of currentFlight.bookings) {
        if (!booking.tickets.length) continue;
        await transaction.ticket.updateMany({
          where: { ticketId: { in: booking.tickets.map((ticket) => ticket.ticketId) } },
          data: { status: "FLIGHT_CANCELLED", cancellationReason: reason.trim() },
        });
        await transaction.booking.update({
          where: { bookingId: booking.bookingId },
          data: { status: "CANCELLED" },
        });
        if (booking.payment?.transactionStatus === "SUCCESS") {
          await transaction.refund.createMany({
            data: booking.tickets.map((ticket) => ({
              bookingId: booking.bookingId,
              ticketId: ticket.ticketId,
              paymentId: booking.payment!.paymentId,
              amount: currentFlight.price,
              reason: reason.trim(),
            })),
          });
        }
        await transaction.notification.create({
          data: {
            userId: booking.userId,
            title: "Flight cancelled",
            message: `Flight ${currentFlight.flightNum} was cancelled. ${booking.payment?.transactionStatus === "SUCCESS" ? "A full-refund request is pending payment-provider processing." : "No refund is due."} Reason: ${reason.trim()}`,
          },
        });
      }
      return { currentFlight, impacted };
    });

    if (!flight) return res.status(404).json({ error: "Flight not found" });
    return res.json({
      flightId,
      status: "CANCELLED",
      reason: reason.trim(),
      impactedPassengers: flight.impacted.length,
      impactedBookings: new Set(flight.impacted.map(({ booking }) => booking.bookingId)).size,
      refundAmount: flight.impacted.reduce(
        (sum, { booking }) => sum + (booking.payment?.transactionStatus === "SUCCESS" ? flight.currentFlight.price : 0),
        0,
      ),
      refundStatus: "PENDING",
      notice: "Flight cancelled. Full refund requests were recorded for payment-provider processing and customer notifications should be sent.",
    });
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode) return res.status(statusCode).json({ error: (err as Error).message });
    return next(err);
  }
};

export const getAdminAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const [bookings, flights] = await Promise.all([
      prisma.booking.findMany({
        include: {
          flight: { include: { sourceAirport: true, destAirport: true } },
          payment: true,
          tickets: true,
        },
        orderBy: { bookingDate: "asc" },
      }),
      prisma.flight.findMany({ select: { status: true } }),
    ]);
    const daily = new Map<string, { bookings: number; cancellations: number }>();
    const monthly = new Map<string, { revenue: number; tickets: number }>();
    const routes = new Map<string, { route: string; bookings: number; revenue: number }>();
    for (const booking of bookings) {
      const day = booking.bookingDate.toISOString().slice(0, 10);
      const dayPoint = daily.get(day) ?? { bookings: 0, cancellations: 0 };
      dayPoint.bookings += booking.tickets.length;
      dayPoint.cancellations += booking.tickets.filter(
        (ticket) => ticket.status === "CANCELLED" || ticket.status === "FLIGHT_CANCELLED",
      ).length;
      daily.set(day, dayPoint);

      const route = `${booking.flight.sourceCode}-${booking.flight.destCode}`;
      const routePoint = routes.get(route) ?? { route, bookings: 0, revenue: 0 };
      const activeTickets = booking.tickets.filter(
        (ticket) => ticket.status === "PENDING" || ticket.status === "CONFIRMED",
      ).length;
      routePoint.bookings += activeTickets;
      const paidRevenue = booking.payment?.transactionStatus === "SUCCESS"
        ? activeTickets * booking.flight.price
        : 0;
      routePoint.revenue += paidRevenue;
      routes.set(route, routePoint);

      const month = booking.bookingDate.toISOString().slice(0, 7);
      const monthPoint = monthly.get(month) ?? { revenue: 0, tickets: 0 };
      monthPoint.revenue += paidRevenue;
      monthPoint.tickets += activeTickets;
      monthly.set(month, monthPoint);
    }

    const statusDistribution = flights.reduce<Record<string, number>>((counts, flight) => {
      counts[flight.status] = (counts[flight.status] ?? 0) + 1;
      return counts;
    }, {});
    return res.json({
      ticketSalesTrend: [...daily.entries()].slice(-30).map(([date, counts]) => ({ date, ...counts })),
      revenueByMonth: [...monthly.entries()].map(([month, totals]) => ({ month, ...totals })),
      flightStatusDistribution: statusDistribution,
      topRoutes: [...routes.values()].sort((a, b) => b.bookings - a.bookings).slice(0, 5),
    });
  } catch (err) {
    return next(err);
  }
};
