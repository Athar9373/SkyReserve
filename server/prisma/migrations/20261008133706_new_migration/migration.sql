/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `availableSeats` on the `Flight` table. All the data in the column will be lost.
  - You are about to drop the `PassengerSeatMapping` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[pnr]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bookingId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[aircraftId,seatNumber]` on the table `Seat` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pnr` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `Passenger` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Passenger" DROP CONSTRAINT "Passenger_userId_fkey";

-- DropForeignKey
ALTER TABLE "PassengerSeatMapping" DROP CONSTRAINT "PassengerSeatMapping_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "PassengerSeatMapping" DROP CONSTRAINT "PassengerSeatMapping_passengerId_fkey";

-- DropForeignKey
ALTER TABLE "PassengerSeatMapping" DROP CONSTRAINT "PassengerSeatMapping_seatId_fkey";

-- DropIndex
DROP INDEX "Payment_pnr_key";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "createdAt",
ADD COLUMN     "bookingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "pnr" TEXT NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Flight" DROP COLUMN "availableSeats";

-- AlterTable
ALTER TABLE "Passenger" ALTER COLUMN "userId" SET NOT NULL;

-- DropTable
DROP TABLE "PassengerSeatMapping";

-- CreateTable
CREATE TABLE "Ticket" (
    "ticketId" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "passengerId" INTEGER NOT NULL,
    "seatId" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("ticketId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_pnr_key" ON "Booking"("pnr");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_bookingId_key" ON "Payment"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Seat_aircraftId_seatNumber_key" ON "Seat"("aircraftId", "seatNumber");

-- AddForeignKey
ALTER TABLE "Passenger" ADD CONSTRAINT "Passenger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("bookingId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "Passenger"("passengerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("seatId") ON DELETE RESTRICT ON UPDATE CASCADE;
