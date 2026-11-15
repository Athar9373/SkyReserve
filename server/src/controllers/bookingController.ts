import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db";
import {
  cancelBookingTickets,
  getCancellationQuote,
  serializeCancellationError,
} from "../services/cancellationService";

const generatePNR = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

export const getMyTrips = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId!;
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        flight: true,
        tickets: {
          include: { passenger: true, seat: true },
        },
      },
      orderBy: { bookingDate: "desc" },
    });

    const response = bookings.map((b) => ({
      bookingId: b.bookingId,
      pnr: b.pnr,
      bookingDate: b.bookingDate.toISOString(),
      totalFare: b.totalAmount,
      status: b.status,
      flight: {
        flightNumber: b.flight.flightNum,
        sourceAirportCode: b.flight.sourceCode,
        destAirportCode: b.flight.destCode,
        departureTime: b.flight.departureTime.toISOString(),
        arrivalTime: b.flight.arrivalTime.toISOString(),
      },
      tickets: b.tickets.map((t) => ({
        ticketId: t.ticketId,
        passengerName: `${t.passenger.firstName} ${t.passenger.lastName}`,
        seatNumber: t.seat.seatNumber,
        status: t.status,
      })),
    }));

    return res.json(response);
  } catch (err) {
    next(err);
  }
};

export const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId!;
    const { flightId, passengerSeatMap } = req.body;

    if (!flightId || !passengerSeatMap || !Array.isArray(passengerSeatMap)) {
      return res
        .status(400)
        .json({ error: "Flight ID and passenger seat mappings are required." });
    }

    const flight = await prisma.flight.findUnique({ where: { flightId } });
    if (!flight) {
      return res.status(404).json({ error: "Flight not found" });
    }
    if (flight.status === "CANCELLED") {
      return res.status(409).json({ error: "This flight has been cancelled" });
    }

    const totalAmount = flight.price * passengerSeatMap.length;
    const pnr = generatePNR();

    const booking = await prisma.booking.create({
      data: {
        pnr,
        userId,
        flightId,
        totalAmount,
        status: "PENDING",
        tickets: {
          create: passengerSeatMap.map(
            (map: { passengerId: number; seatId: number }) => ({
              passengerId: map.passengerId,
              seatId: map.seatId,
              status: "PENDING",
            }),
          ),
        },
      },
    });

    return res.status(201).json({
      bookingId: booking.bookingId,
      status: booking.status,
      totalAmount: booking.totalAmount,
    });
  } catch (err) {
    next(err);
  }
};

export const processPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);
    const { cardNumber } = req.body;

    if (!bookingId || !cardNumber) {
      return res
        .status(400)
        .json({ error: "Booking ID and payment details are required." });
    }

    const booking = await prisma.booking.findUnique({ where: { bookingId } });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const transactionId =
      "TXN_" + Math.random().toString(36).substring(2, 10).toUpperCase();

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          bookingId,
          pnr: booking.pnr,
          amountPaid: booking.totalAmount,
          transactionStatus: "SUCCESS",
          gatewayTransactionId: transactionId,
          message: "Payment processed successfully",
        },
      }),
      prisma.booking.update({
        where: { bookingId },
        data: { status: "CONFIRMED" },
      }),
      prisma.ticket.updateMany({
        where: { bookingId },
        data: { status: "CONFIRMED" },
      }),
    ]);

    return res.json({
      paymentId: payment.paymentId,
      bookingId: payment.bookingId,
      pnr: payment.pnr,
      amountPaid: payment.amountPaid,
      transactionStatus: payment.transactionStatus,
      gatewayTransactionId: payment.gatewayTransactionId,
      transactionDate: payment.transactionDate.toISOString(),
      message: payment.message,
    });
  } catch (err) {
    next(err);
  }
};

export const cancelBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const bookingId = Number(req.params.bookingId);
    if (!Number.isSafeInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({ error: "A valid booking ID is required" });
    }
    const booking = await prisma.booking.findFirst({
      where: { bookingId, userId: req.userId! },
    });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const result = await cancelBookingTickets({
      bookingId,
      reason: "Customer requested",
      userInitiated: true,
    });
    return res.json(result);
  } catch (err) {
    const cancellationError = serializeCancellationError(err);
    if (cancellationError) {
      return res.status(cancellationError.statusCode).json({ error: cancellationError.message });
    }
    next(err);
  }
};

export const quoteMyTripCancellation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const bookingId = Number(req.params.bookingId);
    const ticketIds = req.body?.ticketIds;
    if (!Array.isArray(ticketIds)) {
      return res.status(400).json({ error: "A list of ticket IDs is required" });
    }
    const quote = await getCancellationQuote(bookingId, ticketIds, req.userId!);
    return res.json(quote);
  } catch (err) {
    const cancellationError = serializeCancellationError(err);
    if (cancellationError) {
      return res.status(cancellationError.statusCode).json({ error: cancellationError.message });
    }
    return next(err);
  }
};

export const cancelMyTripTickets = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const bookingId = Number(req.params.bookingId);
    if (!Number.isSafeInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({ error: "A valid booking ID is required" });
    }
    const cancelEntireTrip = req.body?.cancelEntireTrip === true;
    const ticketIds = cancelEntireTrip ? undefined : req.body?.ticketIds;
    if (!cancelEntireTrip && (!Array.isArray(ticketIds) || !ticketIds.length)) {
      return res.status(400).json({
        error: "Select one or more tickets or explicitly request cancellation of the entire trip",
      });
    }
    if (ticketIds !== undefined &&
        (!Array.isArray(ticketIds) || ticketIds.some((id: unknown) => !Number.isSafeInteger(id)))) {
      return res.status(400).json({ error: "Ticket IDs must be an array of valid integers" });
    }
    const booking = await prisma.booking.findFirst({
      where: { bookingId, userId: req.userId! },
      select: { bookingId: true },
    });
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const result = await cancelBookingTickets({
      bookingId,
      ticketIds,
      reason: "Customer requested",
      userInitiated: true,
    });
    return res.json(result);
  } catch (err) {
    const cancellationError = serializeCancellationError(err);
    if (cancellationError) {
      return res.status(cancellationError.statusCode).json({ error: cancellationError.message });
    }
    return next(err);
  }
};
