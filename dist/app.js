"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const flightRoutes_1 = __importDefault(require("./routes/flightRoutes"));
const passengerRoutes_1 = __importDefault(require("./routes/passengerRoutes"));
const bookingRoutes_1 = __importDefault(require("./routes/bookingRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const flightController_1 = require("./controllers/flightController");
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Public Auth Routes
app.use("/public/auth", authRoutes_1.default);
// Public Airport Route
app.get("/airports", flightController_1.getAirports);
// Public Flight Search Routes
app.use("/flights", flightRoutes_1.default);
// Admin routes use signed bearer tokens and a database-backed role check.
app.use("/admin", adminRoutes_1.default);
// Protected Routes (User-scoped via authMiddleware)
app.use("/passengers", passengerRoutes_1.default);
app.use("/bookings", bookingRoutes_1.default);
// Global Error Handler
app.use(errorHandler_1.errorHandler);
exports.default = app;
