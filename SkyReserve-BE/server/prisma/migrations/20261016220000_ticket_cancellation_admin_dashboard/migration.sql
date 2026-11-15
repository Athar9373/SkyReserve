CREATE TYPE "TicketStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'FLIGHT_CANCELLED');
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

ALTER TABLE "Ticket"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "TicketStatus"
    USING ("status"::text::"TicketStatus"),
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

ALTER TABLE "Ticket" ADD COLUMN "cancellationReason" TEXT;
ALTER TABLE "Flight" ADD COLUMN "cancellationReason" TEXT;

CREATE TABLE "Refund" (
  "refundId" SERIAL NOT NULL,
  "bookingId" INTEGER NOT NULL,
  "ticketId" INTEGER NOT NULL,
  "paymentId" INTEGER,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Refund_pkey" PRIMARY KEY ("refundId")
);

CREATE UNIQUE INDEX "Refund_ticketId_key" ON "Refund"("ticketId");
CREATE INDEX "Refund_bookingId_idx" ON "Refund"("bookingId");
CREATE INDEX "Refund_paymentId_idx" ON "Refund"("paymentId");

ALTER TABLE "Refund"
  ADD CONSTRAINT "Refund_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("bookingId") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Refund_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "Ticket"("ticketId") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Refund_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "Payment"("paymentId") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Notification" (
  "notificationId" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("notificationId")
);

CREATE INDEX "Notification_userId_status_idx" ON "Notification"("userId", "status");
ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
