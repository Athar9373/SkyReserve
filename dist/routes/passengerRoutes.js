"use strict";
const express_1 = require("express");
const passengerController_1 = require("../controllers/passengerController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get("/", passengerController_1.getSavedPassengers);
router.post("/", passengerController_1.savePassengers);
module.exports = router;
