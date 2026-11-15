import { Router } from "express";
import { createFlight } from "../controllers/flightController";
import {
  cancelAdminBooking,
  cancelAdminFlight,
  deleteUser,
  getAdminAnalytics,
  getAdminBookings,
  getFlightSchedule,
  getUsers,
} from "../controllers/adminController";
import {
  adminRoleMiddleware,
  authMiddleware,
} from "../middleware/authMiddleware";

const router = Router();

router.use(authMiddleware, adminRoleMiddleware);
router.get("/users", getUsers);
router.delete("/users", (req, res) =>
  res.status(400).json({ error: "A userId is required" }),
);
router.delete("/users/:userId", deleteUser);
router.get("/bookings", getAdminBookings);
router.post("/bookings/:bookingId/cancel", cancelAdminBooking);
router.get("/flights", getFlightSchedule);
router.post("/flights/:flightId/cancel", cancelAdminFlight);
router.get("/analytics", getAdminAnalytics);
router.post("/flights", createFlight);

export = router;
