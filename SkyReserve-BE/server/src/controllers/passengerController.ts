import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db";

export const getSavedPassengers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId!;
    const passengers = await prisma.passenger.findMany({
      where: { userId },
    });
    return res.json(passengers);
  } catch (err) {
    next(err);
  }
};

export const savePassengers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId!;
    const passengersData = req.body;

    if (!Array.isArray(passengersData) || passengersData.length === 0) {
      return res.status(400).json({ error: "Passenger details are required." });
    }

    const createdPassengers = await prisma.$transaction(
      passengersData.map((p) =>
        prisma.passenger.create({
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
        }),
      ),
    );

    return res.status(201).json(createdPassengers);
  } catch (err) {
    next(err);
  }
};
