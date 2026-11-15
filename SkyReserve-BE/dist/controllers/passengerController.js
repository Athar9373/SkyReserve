"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.savePassengers = exports.getSavedPassengers = void 0;
const db_1 = require("../config/db");
const getSavedPassengers = async (req, res, next) => {
    try {
        const userId = req.userId;
        const passengers = await db_1.prisma.passenger.findMany({
            where: { userId },
        });
        return res.json(passengers);
    }
    catch (err) {
        next(err);
    }
};
exports.getSavedPassengers = getSavedPassengers;
const savePassengers = async (req, res, next) => {
    try {
        const userId = req.userId;
        const passengersData = req.body;
        if (!Array.isArray(passengersData) || passengersData.length === 0) {
            return res.status(400).json({ error: "Passenger details are required." });
        }
        const createdPassengers = await db_1.prisma.$transaction(passengersData.map((p) => db_1.prisma.passenger.create({
            data: {
                userId,
                firstName: p.firstName,
                lastName: p.lastName,
                gender: p.gender,
                nationality: p.nationality,
                passportNumber: p.passportNumber,
                email: p.email,
                phoneNumber: p.phoneNumber,
            },
        })));
        return res.status(201).json(createdPassengers);
    }
    catch (err) {
        next(err);
    }
};
exports.savePassengers = savePassengers;
