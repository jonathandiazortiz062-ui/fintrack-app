import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../app.js";
import pool from "../db/db.js";

describe("Health API", () => {
  it("should return the API health status", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      status: "ok",
      message: "FinTrack API is running",
    });
  });

  it("should connect to the test database", async () => {
    const result = await pool.query(
      "SELECT current_database() AS database_name",
    );

    expect(result.rows[0].database_name).toBe("fintrack_test");
  });
});