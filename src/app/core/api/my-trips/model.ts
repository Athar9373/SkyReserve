export interface TicketDto {
  ticketId: number;
  passengerName: string;
  seatNumber: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'FLIGHT_CANCELLED';
}

export interface FlightInfoDto {
  flightNumber: string;
  sourceAirportCode: string;
  destAirportCode: string;
  departureTime: string;
  arrivalTime: string;
}

export interface BookingResponseDto {
  bookingId: number;
  pnr: string;
  bookingDate: string;
  totalFare: number;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  flight: FlightInfoDto;
  tickets: TicketDto[];
}

export interface CancellationQuoteDto {
  bookingId: number;
  tickets: Array<{
    ticketId: number;
    refundAmount: number;
    cancellationFee: number;
  }>;
  refundAmount: number;
  cancellationFee: number;
  policy: string;
}

export interface CancellationResponseDto {
  bookingId: number;
  status: BookingResponseDto['status'];
  cancelledTickets: Array<{
    ticketId: number;
    passengerName: string;
    seatNumber: string;
    status: TicketDto['status'];
    refundAmount: number;
  }>;
  refundAmount: number;
  cancellationFee: number;
  refundStatus: 'PENDING' | 'NOT_APPLICABLE';
  refundNotice: string;
}
