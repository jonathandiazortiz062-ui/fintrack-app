import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import app from "../app.js";
import pool from "../db/db.js";
import { googleClient } from "../controllers/authController.js";

describe("Authentication API", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();

    await pool.query(
      `DELETE FROM users
       WHERE email LIKE '%@test.com'`,
    );
  });

  it("should create a new user with Google authentication", async () => {
    vi.spyOn(googleClient, "verifyIdToken").mockResolvedValue({
      getPayload: () => ({
        sub: "google-user-123",
        email: "googleuser@test.com",
        email_verified: true,
        given_name: "John",
        family_name: "Tester",
      }),
    });

    const response = await request(app)
      .post("/api/auth/google")
      .send({
        credential: "fake-google-token",
      });

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      firstName: "John",
      lastName: "Tester",
      email: "googleuser@test.com",
    });

    expect(response.headers["set-cookie"]).toBeDefined();

    const databaseResult = await pool.query(
      `SELECT google_id, first_name, last_name, email
       FROM users
       WHERE email = $1`,
      ["googleuser@test.com"],
    );

    expect(databaseResult.rows.length).toBe(1);

    expect(databaseResult.rows[0]).toMatchObject({
      google_id: "google-user-123",
      first_name: "John",
      last_name: "Tester",
      email: "googleuser@test.com",
    });
  });

  it("should log in an existing Google user without creating a duplicate", async () => {
    await pool.query(
      `INSERT INTO users (
        google_id,
        first_name,
        last_name,
        email
      )
      VALUES ($1, $2, $3, $4)`,
      [
        "existing-google-user",
        "Jane",
        "Tester",
        "existing@test.com",
      ],
    );

    vi.spyOn(googleClient, "verifyIdToken").mockResolvedValue({
      getPayload: () => ({
        sub: "existing-google-user",
        email: "existing@test.com",
        email_verified: true,
        given_name: "Jane",
        family_name: "Tester",
      }),
    });

    const response = await request(app)
      .post("/api/auth/google")
      .send({
        credential: "fake-google-token",
      });

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      firstName: "Jane",
      lastName: "Tester",
      email: "existing@test.com",
    });

    const databaseResult = await pool.query(
      `SELECT COUNT(*)
       FROM users
       WHERE email = $1`,
      ["existing@test.com"],
    );

    expect(Number(databaseResult.rows[0].count)).toBe(1);
  });

  it("should link an existing user by verified Google email", async () => {
    await pool.query(
      `INSERT INTO users (
        first_name,
        last_name,
        email
      )
      VALUES ($1, $2, $3)`,
      [
        "Legacy",
        "Tester",
        "legacy@test.com",
      ],
    );

    vi.spyOn(googleClient, "verifyIdToken").mockResolvedValue({
      getPayload: () => ({
        sub: "linked-google-user",
        email: "legacy@test.com",
        email_verified: true,
        given_name: "Legacy",
        family_name: "Tester",
      }),
    });

    const response = await request(app)
      .post("/api/auth/google")
      .send({
        credential: "fake-google-token",
      });

    expect(response.status).toBe(200);

    const databaseResult = await pool.query(
      `SELECT google_id
       FROM users
       WHERE email = $1`,
      ["legacy@test.com"],
    );

    expect(databaseResult.rows[0].google_id).toBe(
      "linked-google-user",
    );
  });

  it("should reject a request without a Google credential", async () => {
    const response = await request(app)
      .post("/api/auth/google")
      .send({});

    expect(response.status).toBe(400);

    expect(response.body.message).toBe(
      "Google credential is required",
    );
  });

  it("should reject a Google account with an unverified email", async () => {
    vi.spyOn(googleClient, "verifyIdToken").mockResolvedValue({
      getPayload: () => ({
        sub: "unverified-google-user",
        email: "unverified@test.com",
        email_verified: false,
        given_name: "John",
        family_name: "Tester",
      }),
    });

    const response = await request(app)
      .post("/api/auth/google")
      .send({
        credential: "fake-google-token",
      });

    expect(response.status).toBe(401);

    expect(response.body.message).toBe(
      "Google account email could not be verified",
    );
  });

  it("should reject access to current user when unauthenticated", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
  });

  it("should allow an authenticated Google user to access current user", async () => {
    vi.spyOn(googleClient, "verifyIdToken").mockResolvedValue({
      getPayload: () => ({
        sub: "authenticated-google-user",
        email: "authenticated@test.com",
        email_verified: true,
        given_name: "Jane",
        family_name: "Tester",
      }),
    });

    const agent = request.agent(app);

    const loginResponse = await agent
      .post("/api/auth/google")
      .send({
        credential: "fake-google-token",
      });

    expect(loginResponse.status).toBe(200);

    const meResponse = await agent.get("/api/auth/me");

    expect(meResponse.status).toBe(200);

    expect(meResponse.body).toMatchObject({
      firstName: "Jane",
      lastName: "Tester",
      email: "authenticated@test.com",
    });
  });

  it("should log out an authenticated user", async () => {
    vi.spyOn(googleClient, "verifyIdToken").mockResolvedValue({
      getPayload: () => ({
        sub: "logout-google-user",
        email: "logout@test.com",
        email_verified: true,
        given_name: "John",
        family_name: "Tester",
      }),
    });

    const agent = request.agent(app);

    await agent
      .post("/api/auth/google")
      .send({
        credential: "fake-google-token",
      });

    const logoutResponse = await agent.post("/api/auth/logout");

    expect(logoutResponse.status).toBe(200);

    const meResponse = await agent.get("/api/auth/me");

    expect(meResponse.status).toBe(401);
  });
});