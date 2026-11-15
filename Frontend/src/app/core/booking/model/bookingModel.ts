import { Airport } from '../../api/flight/model/types';

export interface Airline {
  airlineCode: string;
  name: string;
}

export interface Aircraft {
  aircraftId: number;
  model: string;
  manufacturer: string;
}

export type SeatLocation = 'WINDOW' | 'MIDDLE' | 'AISLE';
export interface RowSeats {
  rowNumber: string;
  left: (Seat | null)[];
  middle: (Seat | null)[];
  right: (Seat | null)[];
}

export interface Seat {
  seatId: number;
  seatNumber: string;
  location: SeatLocation;
  isAvailable: boolean;
}

export type FlightStatus = 'SCHEDULED' | 'DELAYED' | 'CANCELLED' | 'COMPLETED';

export interface SelectedFlightDetails {
  flightId: number;
  flightNum: string;
  status: FlightStatus;
  price: number;
  availableSeats: number;
  departureTime: string; // ISO 8601 Date String
  arrivalTime: string; // ISO 8601 Date String
  airline: Airline;
  sourceAirport: Airport;
  destAirport: Airport;
  aircraft: Aircraft;
  seats: Seat[];

  // Computed or flattened properties (Optional helper properties if needed in template)
  durationMinutes?: number;
  airlineCode?: string;
  airlineName?: string;
}

export interface CountryData {
  name: string;
  cca2: string;
  callingCode: string;
}

export interface PassengerReqDto {
  firstName: string;
  lastName: string;
  gender: string;
  nationality: string;
  passportNumber?: string;
  email?: string;
  phoneNumber?: string;
}

export interface PassengerResponseDto {
  passengerId: number;
  firstName: string;
  lastName: string;
  gender?: string;
  nationality?: string;
  passportNumber?: string;
  email?: string;
  phoneNumber?: string;
}
export interface PassengerSeatMapping {
  passengerId: number;
  seatId: number;
}

export interface CreateBookingPayload {
  flightId: number;
  passengerSeatMap: PassengerSeatMapping[];
}

export interface BookingResponse {
  bookingId: number;
  status: string;
}

export interface PaymentReqDto {
  cardNumber: string;
  cardHolderName: string;
  cvv: string;
  paymentMethod: string;
}

export interface PaymentResponseDto {
  paymentId: number;
  bookingId: number;
  pnr: string;
  amountPaid: number;
  transactionStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
  gatewayTransactionId: string;
  transactionDate: string;
  message: string;
}
