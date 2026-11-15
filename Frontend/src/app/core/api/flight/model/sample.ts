import { Airport, FlightDetails } from './types';

export const AIRPORTS: Airport[] = [
  {
    airportCode: 'PNQ',
    city: 'Pune',
    country: 'India',
    name: 'Pune International Airport',
  },
  {
    airportCode: 'DEL',
    city: 'New Delhi',
    country: 'India',
    name: 'Indira Gandhi International Airport',
  },
  {
    airportCode: 'BOM',
    city: 'Mumbai',
    country: 'India',
    name: 'Chhatrapati Shivaji Maharaj International Airport',
  },
  {
    airportCode: 'BLR',
    city: 'Bengaluru',
    country: 'India',
    name: 'Kempegowda International Airport',
  },
];

export const FLIGHTS: FlightDetails[] = [
  {
    flightId: 101,
    flightNum: '6E-204',
    airlineCode: '6E',
    airlineName: 'IndiGo',
    sourceAirport: AIRPORTS[0], // Pune (PNQ)
    destAirport: AIRPORTS[1], // Delhi (DEL)
    departureTime: '06:15 AM',
    arrivalTime: '08:25 AM',
    durationMinutes: 130,
    price: 4850,
  },
  {
    flightId: 102,
    flightNum: 'AI-852',
    airlineCode: 'AI',
    airlineName: 'Air India',
    sourceAirport: AIRPORTS[0], // Pune (PNQ)
    destAirport: AIRPORTS[1], // Delhi (DEL)
    departureTime: '09:45 AM',
    arrivalTime: '12:00 PM',
    durationMinutes: 135,
    price: 5400,
  },
  {
    flightId: 103,
    flightNum: 'QP-1102',
    airlineCode: 'QP',
    airlineName: 'Akasa Air',
    sourceAirport: AIRPORTS[0], // Pune (PNQ)
    destAirport: AIRPORTS[3], // Bengaluru (BLR)
    departureTime: '01:20 PM',
    arrivalTime: '02:40 PM',
    durationMinutes: 80,
    price: 3200,
  },
  {
    flightId: 104,
    flightNum: '6E-5331',
    airlineCode: '6E',
    airlineName: 'IndiGo',
    sourceAirport: AIRPORTS[2], // Mumbai (BOM)
    destAirport: AIRPORTS[3], // Bengaluru (BLR)
    departureTime: '05:30 PM',
    arrivalTime: '07:15 PM',
    durationMinutes: 105,
    price: 3950,
  },
  {
    flightId: 105,
    flightNum: 'AI-615',
    airlineCode: 'AI',
    airlineName: 'Air India',
    sourceAirport: AIRPORTS[1], // Delhi (DEL)
    destAirport: AIRPORTS[2], // Mumbai (BOM)
    departureTime: '08:10 PM',
    arrivalTime: '10:25 PM',
    durationMinutes: 135,
    price: 6100,
  },
];
