import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";

import {
  getMonthlyIncomeExpenses, getExpensesByCategory
} from "../controllers/analyticsController.js";

const router = express.Router();
router.use(requireAuth);

router.get("/monthly-income-expenses", getMonthlyIncomeExpenses);
router.get("/expenses-by-category", getExpensesByCategory);

export default router;