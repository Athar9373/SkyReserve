import { Router } from "express";
import {
  getSavedPassengers,
  savePassengers,
} from "../controllers/passengerController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.use(authMiddleware);
router.get("/", getSavedPassengers);
router.post("/", savePassengers);

export = router;
