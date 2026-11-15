export interface CabinFeature {
  feature: string;
  icon: string;
}

export interface CabinOption {
  id: number;
  name: string;
  features: CabinFeature[];
  icon: string;
}

export interface Airport {
  airportCode: string;
  city: string;
  country: string;
  name: string;
}

export interface FlightDetails {
  flightId: number;
  flightNum: string;
  airlineCode: string;
  airlineName: string;
  sourceAirport: Airport;
  destAirport: Airport;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  price: number;
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
  totalAmount?: number;
  // Add any other properties returned by your backend response
}
