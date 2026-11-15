import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import flightRoutes from "./routes/flightRoutes";
import passengerRoutes from "./routes/passengerRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import adminRoutes from "./routes/adminRoutes";
import { getAirports } from "./controllers/flightController";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());

// Public Auth Routes
app.use("/public/auth", authRoutes);

// Public Airport Route
app.get("/airports", getAirports);

// Public Flight Search Routes
app.use("/flights", flightRoutes);

// Admin routes use signed bearer tokens and a database-backed role check.
app.use("/admin", adminRoutes);

// Protected Routes (User-scoped via authMiddleware)
app.use("/passengers", passengerRoutes);
app.use("/bookings", bookingRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
