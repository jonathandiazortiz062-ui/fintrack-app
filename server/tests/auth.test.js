import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import app from "../app.js";
import pool from "../db/db.js";

describe("Authentication API", () => {
  beforeEach(async () => {
    await pool.query(
      `DELETE FROM users
       WHERE email LIKE '%@test.com'`,
    );
  });
  //Registration tests:
  it("should register a new user", async () => {
    const response = await request(app).post("/api/auth/register").send({
      firstName: "John",
      lastName: "Tester",
      email: "john@test.com",
      password: "Password123!",
    });

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      first_name: "John",
      last_name: "Tester",
      email: "john@test.com",
    });

    expect(response.body.password_hash).toBeUndefined();
  });

  it("should reject an invalid email during registration", async () => {
    const response = await request(app).post("/api/auth/register").send({
      firstName: "John",
      lastName: "Tester",
      email: "invalid-email",
      password: "Password123!",
    });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe("Please provide a valid email address");
  });

  it("should reject a password shorter than 8 characters", async () => {
    const response = await request(app).post("/api/auth/register").send({
      firstName: "John",
      lastName: "Tester",
      email: "shortpassword@test.com",
      password: "Pass123",
    });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe(
      "Password must be at least 8 characters long",
    );
  });

  it("should reject duplicate email registration", async () => {
    await request(app).post("/api/auth/register").send({
      firstName: "John",
      lastName: "Tester",
      email: "duplicate@test.com",
      password: "Password123!",
    });

    const response = await request(app).post("/api/auth/register").send({
      firstName: "Jane",
      lastName: "Tester",
      email: "DUPLICATE@test.com",
      password: "Password456!",
    });

    expect(response.status).toBe(409);

    expect(response.body.message).toBe(
      "An account with this email already exists",
    );
  });
  //Login tests:
  it("should log in a registered user", async () => {
    await request(app).post("/api/auth/register").send({
      firstName: "John",
      lastName: "Tester",
      email: "login@test.com",
      password: "Password123!",
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "login@test.com",
      password: "Password123!",
    });

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      firstName: "John",
      lastName: "Tester",
      email: "login@test.com",
    });

    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it("should reject login with an invalid password", async () => {
    await request(app).post("/api/auth/register").send({
      firstName: "John",
      lastName: "Tester",
      email: "wrongpassword@test.com",
      password: "Password123!",
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "wrongpassword@test.com",
      password: "WrongPassword123!",
    });

    expect(response.status).toBe(401);

    expect(response.body.message).toBe("Invalid email or password");
  });

  it("should reject login for a nonexistent user", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "doesnotexist@test.com",
      password: "Password123!",
    });

    expect(response.status).toBe(401);

    expect(response.body.message).toBe("Invalid email or password");
  });

  it("should reject access to current user when unauthenticated", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
  });

  //Agent:

  it("should allow an authenticated user to access current user", async () => {
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send({
      firstName: "Jane",
      lastName: "Tester",
      email: "authenticated@test.com",
      password: "Password123!",
    });

    const loginResponse = await agent.post("/api/auth/login").send({
      email: "authenticated@test.com",
      password: "Password123!",
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
});
