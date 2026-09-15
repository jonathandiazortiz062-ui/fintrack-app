import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getMonthlyObligations,
  createMonthlyObligation,
  updateMonthlyObligation,
  updateMonthlyObligationCompletion,
  deleteMonthlyObligation,
  copyMonthlyObligationsToNextMonth,
} from "../controllers/monthlyObligationController.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", getMonthlyObligations);
router.post("/", createMonthlyObligation);
router.put("/:id", updateMonthlyObligation);
router.patch("/:id/completion", updateMonthlyObligationCompletion);
router.delete("/:id", deleteMonthlyObligation);
router.post("/copy-next-month", copyMonthlyObligationsToNextMonth);

export default router;