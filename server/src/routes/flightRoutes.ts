import { Router } from "express";
import {
  getAirports,
  getFlightById,
  searchFlights,
} from "../controllers/flightController";

const router = Router();

router.get("/search", searchFlights);
router.get("/:id", getFlightById);

export = router;
