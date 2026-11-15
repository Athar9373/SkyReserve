"use strict";
const express_1 = require("express");
const flightController_1 = require("../controllers/flightController");
const router = (0, express_1.Router)();
router.get("/search", flightController_1.searchFlights);
router.get("/:id", flightController_1.getFlightById);
module.exports = router;
