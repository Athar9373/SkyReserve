import { Router } from "express";
import {
  cancelBooking,
  cancelMyTripTickets,
  createBooking,
  getMyTrips,
  processPayment,
  quoteMyTripCancellation,
} from "../controllers/bookingController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.use(authMiddleware);
router.get("/", getMyTrips);
router.post("/", createBooking);
router.post("/payment/:bookingId", processPayment);
router.post("/:bookingId/cancellation-quote", quoteMyTripCancellation);
router.post("/:bookingId/cancel", cancelMyTripTickets);
router.delete("/:bookingId", cancelBooking);

export = router;
