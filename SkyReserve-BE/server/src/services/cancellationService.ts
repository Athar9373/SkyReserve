import { Prisma, TicketStatus } from "@prisma/client";
import { prisma } from "../config/db";

export const CANCELLATION_CUTOFF_HOURS = 2;

export class CancellationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "CancellationError";
  }
}

type CancellationOptions = {
  bookingId: number;
  ticketIds?: number[];
  reason: string;
  userInitiated: boolean;
  notifyUser?: boolean;
};

const activeTicketStatuses: TicketStatus[] = ["PENDING", "CONFIRMED"];

const validId = (value: number): boolean =>
  Number.isSafeInteger(value) && value > 0;

export const getCancellationQuote = async (
  bookingId: number,
  ticketIds: number[],
  userId: number,
) => {
  if (!validId(bookingId) || !Array.isArray(ticketIds) || !ticketIds.length ||
      ticketIds.some((id) => !validId(id))) {
    throw new CancellationError("A booking ID and at least one valid ticket ID are required", 400);
  }

  const booking = await prisma.booking.findFirst({
    where: { bookingId, userId },
    include: { flight: true, tickets: true, payment: true },
  });
  if (!booking) throw new CancellationError("Booking not found", 404);

  const activeTickets = booking.tickets.filter(
    (ticket) => ticketIds.includes(ticket.ticketId) && activeTicketStatuses.includes(ticket.status),
  );
  if (activeTickets.length !== new Set(ticketIds).size) {
    throw new CancellationError("One or more selected tickets are unavailable", 409);
  }

  const cutoff = new Date(
    booking.flight.departureTime.getTime() - CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000,
  );
  if (Date.now() >= cutoff.getTime()) {
    throw new CancellationError(
      `Tickets can only be cancelled at least ${CANCELLATION_CUTOFF_HOURS} hours before departure`,
      409,
    );
  }

  const paid = booking.payment?.transactionStatus === "SUCCESS";
  const refundPerTicket = paid ? booking.flight.price : 0;
  return {
    bookingId,
    tickets: activeTickets.map((ticket) => ({
      ticketId: ticket.ticketId,
      refundAmount: refundPerTicket,
      cancellationFee: 0,
    })),
    refundAmount: refundPerTicket * activeTickets.length,
    cancellationFee: 0,
    policy: `Full refund, no cancellation fee; cancellation closes ${CANCELLATION_CUTOFF_HOURS} hours before departure.`,
  };
};

export const cancelBookingTickets = async ({
  bookingId,
  ticketIds,
  reason,
  userInitiated,
  notifyUser = false,
}: CancellationOptions) => {
  if (!validId(bookingId)) throw new CancellationError("A valid booking ID is required", 400);

  return prisma.$transaction(async (transaction) => {
    const booking = await transaction.booking.findUnique({
      where: { bookingId },
      include: {
        flight: true,
        payment: true,
        tickets: {
          where: { status: { in: activeTicketStatuses } },
          include: { passenger: true, seat: true },
        },
      },
    });
    if (!booking) throw new CancellationError("Booking not found", 404);
    if (!userInitiated && Date.now() >= booking.flight.departureTime.getTime()) {
      throw new CancellationError("Tickets cannot be cancelled after the flight has departed", 409);
    }
    if (userInitiated) {
      const cutoff = new Date(
        booking.flight.departureTime.getTime() -
          CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000,
      );
      if (Date.now() >= cutoff.getTime()) {
        throw new CancellationError(
          `Tickets can only be cancelled at least ${CANCELLATION_CUTOFF_HOURS} hours before departure`,
          409,
        );
      }
    }

    const selected = ticketIds
      ? booking.tickets.filter((ticket) => ticketIds.includes(ticket.ticketId))
      : booking.tickets;
    if (ticketIds && (
      !ticketIds.length ||
      ticketIds.some((id) => !validId(id)) ||
      selected.length !== new Set(ticketIds).size
    )) {
      throw new CancellationError("One or more selected tickets are unavailable", 409);
    }
    if (!selected.length) {
      throw new CancellationError("There are no active tickets to cancel", 409);
    }

    const now = new Date();
    const isPaid = booking.payment?.transactionStatus === "SUCCESS";
    const refundAmount = isPaid ? booking.flight.price : 0;
    const status: TicketStatus = booking.flight.status === "CANCELLED"
      ? "FLIGHT_CANCELLED"
      : "CANCELLED";

    await transaction.ticket.updateMany({
      where: { ticketId: { in: selected.map((ticket) => ticket.ticketId) } },
      data: { status, cancellationReason: reason },
    });
    if (isPaid) {
      await transaction.refund.createMany({
        data: selected.map((ticket) => ({
          bookingId,
          ticketId: ticket.ticketId,
          paymentId: booking.payment!.paymentId,
          amount: refundAmount,
          reason,
        })),
      });
    }
    if (notifyUser) {
      await transaction.notification.create({
        data: {
          userId: booking.userId,
          title: "Ticket cancellation",
          message: `${selected.length} ticket(s) for booking ${booking.pnr} were cancelled. ${isPaid ? "A full-refund request is pending payment-provider processing." : "No refund is due."} Reason: ${reason}`,
        },
      });
    }

    const remainingCount = await transaction.ticket.count({
      where: { bookingId, status: { in: activeTicketStatuses } },
    });
    if (!remainingCount) {
      await transaction.booking.update({
        where: { bookingId },
        data: { status: "CANCELLED" },
      });
    }

    return {
      bookingId,
      status: remainingCount ? booking.status : "CANCELLED",
      cancelledTickets: selected.map((ticket) => ({
        ticketId: ticket.ticketId,
        passengerName: `${ticket.passenger.firstName} ${ticket.passenger.lastName}`,
        seatNumber: ticket.seat.seatNumber,
        status,
        refundAmount,
      })),
      refundAmount: refundAmount * selected.length,
      cancellationFee: 0,
      refundStatus: isPaid ? "PENDING" : "NOT_APPLICABLE",
      refundNotice: isPaid
        ? "A full-refund request has been recorded for payment-provider processing."
        : "No successful payment was recorded; no refund is due.",
      cancelledAt: now.toISOString(),
    };
  });
};

export const serializeCancellationError = (
  error: unknown,
): { statusCode: number; message: string } | undefined => {
  if (error instanceof CancellationError) {
    return { statusCode: error.statusCode, message: error.message };
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return { statusCode: 409, message: "A refund has already been recorded for this ticket" };
  }
  return undefined;
};
