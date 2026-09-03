import express from "express";
import cors from "cors";
import pool from "./db/db.js";

import accountRoutes from "./routes/accountRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import investmentRoutes from "./routes/investmentRoutes.js";
import marketRoutes from "./routes/marketRoutes.js";
import authRoutes from "./routes/authRoutes.js";

import cookieParser from "cookie-parser";

const app = express();
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.use(express.json());

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  }),
);

app.use(cookieParser());

app.use("/api/accounts", accountRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("FinTrack API is running");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "FinTrack API is running",
  });
});

if (process.env.NODE_ENV !== "production") {
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "ok",
      databaseTime: result.rows[0].now,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      message: "Database connection failed",
    });
  }
});
}

export default app;