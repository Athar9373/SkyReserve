"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFlightById = exports.createFlight = exports.searchFlights = exports.getAirports = void 0;
const db_1 = require("../config/db");
const getAirports = async (req, res, next) => {
    try {
        const airports = await db_1.prisma.airport.findMany();
        return res.json(airports);
    }
    catch (err) {
        next(err);
    }
};
exports.getAirports = getAirports;
const searchFlights = async (req, res, next) => {
    try {
        const { source, destination, date } = req.query;
        if (!source || !destination || !date) {
            return res
                .status(400)
                .json({
                error: "Source, destination, and date are required parameters.",
            });
        }
        const searchDate = new Date(date);
        const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));
        const flights = await db_1.prisma.flight.findMany({
            where: {
                sourceCode: source,
                destCode: destination,
                status: { not: "CANCELLED" },
                departureTime: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                sourceAirport: true,
                destAirport: true,
                airline: true,
            },
        });
        const formattedFlights = flights.map((f) => ({
            flightId: f.flightId,
            flightNum: f.flightNum,
            airlineCode: f.airlineCode,
            airlineName: f.airline.name,
            sourceAirport: f.sourceAirport,
            destAirport: f.destAirport,
            departureTime: f.departureTime.toISOString(),
            arrivalTime: f.arrivalTime.toISOString(),
            durationMinutes: f.durationMinutes,
            price: f.price,
        }));
        return res.json(formattedFlights);
    }
    catch (err) {
        next(err);
    }
};
exports.searchFlights = searchFlights;
const createFlight = async (req, res, next) => {
    try {
        const { flightNum, airlineCode, airlineName, sourceAirport, destAirport, departureTime, arrivalTime, price, } = req.body ?? {};
        if (typeof flightNum !== "string" ||
            !flightNum.trim() ||
            typeof airlineCode !== "string" ||
            !airlineCode.trim() ||
            typeof airlineName !== "string" ||
            !airlineName.trim() ||
            !sourceAirport ||
            typeof sourceAirport.airportCode !== "string" ||
            !destAirport ||
            typeof destAirport.airportCode !== "string" ||
            typeof departureTime !== "string" ||
            typeof arrivalTime !== "string" ||
            typeof price !== "number" ||
            !Number.isFinite(price) ||
            price <= 0) {
            return res.status(400).json({ error: "Invalid or missing flight details" });
        }
        const originCode = sourceAirport.airportCode.trim().toUpperCase();
        const destinationCode = destAirport.airportCode.trim().toUpperCase();
        if (originCode === destinationCode) {
            return res
                .status(400)
                .json({ error: "Origin and destination airports must be different" });
        }
        const isoDateTime = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/i;
        const validIsoDateTime = (value) => {
            const match = isoDateTime.exec(value);
            if (!match)
                return false;
            const [, year, month, day] = match;
            const calendarDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
            const parsedDate = new Date(value);
            return (Number.isFinite(parsedDate.getTime()) &&
                calendarDate.getUTCFullYear() === Number(year) &&
                calendarDate.getUTCMonth() + 1 === Number(month) &&
                calendarDate.getUTCDate() === Number(day));
        };
        if (!validIsoDateTime(departureTime) || !validIsoDateTime(arrivalTime)) {
            return res
                .status(400)
                .json({ error: "Departure and arrival times must be ISO-8601 datetimes" });
        }
        const departure = new Date(departureTime);
        const arrival = new Date(arrivalTime);
        const durationMinutes = Math.ceil((arrival.getTime() - departure.getTime()) / 60000);
        if (!Number.isFinite(departure.getTime()) ||
            !Number.isFinite(arrival.getTime()) ||
            durationMinutes <= 0) {
            return res
                .status(400)
                .json({ error: "Arrival time must be after departure time" });
        }
        const airports = await db_1.prisma.airport.findMany({
            where: { airportCode: { in: [originCode, destinationCode] } },
        });
        if (airports.length !== 2) {
            return res.status(400).json({ error: "One or more airport codes do not exist" });
        }
        const aircraft = await db_1.prisma.aircraft.findFirst({
            orderBy: { aircraftId: "asc" },
            select: { aircraftId: true },
        });
        if (!aircraft) {
            return res.status(409).json({ error: "No aircraft is configured for flights" });
        }
        const flight = await db_1.prisma.$transaction(async (transaction) => {
            const airline = await transaction.airline.upsert({
                where: { airlineCode: airlineCode.trim().toUpperCase() },
                update: {},
                create: {
                    airlineCode: airlineCode.trim().toUpperCase(),
                    name: airlineName.trim(),
                },
            });
            return transaction.flight.create({
                data: {
                    flightNum: flightNum.trim(),
                    airlineCode: airline.airlineCode,
                    sourceCode: originCode,
                    destCode: destinationCode,
                    aircraftId: aircraft.aircraftId,
                    departureTime: departure,
                    arrivalTime: arrival,
                    durationMinutes,
                    price,
                },
                include: {
                    sourceAirport: true,
                    destAirport: true,
                    airline: true,
                },
            });
        });
        return res.status(201).json({
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
        });
    }
    catch (err) {
        return next(err);
    }
};
exports.createFlight = createFlight;
const getFlightById = async (req, res, next) => {
    try {
        const flightId = parseInt(req.params.id, 10);
        const flight = await db_1.prisma.flight.findUnique({
            where: { flightId },
            include: {
                airline: true,
                sourceAirport: true,
                destAirport: true,
                aircraft: {
                    include: { seats: true },
                },
                bookings: {
                    where: { status: { in: ["CONFIRMED", "PENDING"] } },
                    include: {
                        tickets: { where: { status: { in: ["CONFIRMED", "PENDING"] } } },
                    },
                },
            },
        });
        if (!flight) {
            return res.status(404).json({ error: "Flight or resource not found." });
        }
        const bookedSeatIds = new Set(flight.bookings.flatMap((b) => b.tickets.map((t) => t.seatId)));
        const seatsWithAvailability = flight.aircraft.seats.map((seat) => ({
            seatId: seat.seatId,
            seatNumber: seat.seatNumber,
            location: seat.location,
            isAvailable: !bookedSeatIds.has(seat.seatId),
        }));
        const availableSeatsCount = seatsWithAvailability.filter((s) => s.isAvailable).length;
        const response = {
            flightId: flight.flightId,
            flightNum: flight.flightNum,
            status: flight.status,
            price: flight.price,
            availableSeats: availableSeatsCount,
            departureTime: flight.departureTime.toISOString(),
            arrivalTime: flight.arrivalTime.toISOString(),
            airline: flight.airline,
            sourceAirport: flight.sourceAirport,
            destAirport: flight.destAirport,
            aircraft: {
                aircraftId: flight.aircraft.aircraftId,
                model: flight.aircraft.model,
                manufacturer: flight.aircraft.manufacturer,
            },
            seats: seatsWithAvailability,
            durationMinutes: flight.durationMinutes,
            airlineCode: flight.airlineCode,
            airlineName: flight.airline.name,
        };
        return res.json(response);
    }
    catch (err) {
        next(err);
    }
};
exports.getFlightById = getFlightById;
