import request from "supertest";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import app from "../app.js";
import pool from "../db/db.js";

describe("Investments API", () => {
  beforeEach(async () => {
    await pool.query(`
      DELETE FROM investments
      WHERE user_id IN (
        SELECT id
        FROM users
        WHERE email LIKE '%@investments.test'
      )
    `);

    await pool.query(`
      DELETE FROM users
      WHERE email LIKE '%@investments.test'
    `);

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        "Global Quote": {
          "01. symbol": "AAPL",
          "02. open": "230.00",
          "03. high": "235.00",
          "04. low": "228.00",
          "05. price": "232.50",
          "06. volume": "50000000",
          "07. latest trading day": "2026-08-31",
          "08. previous close": "231.00",
          "09. change": "1.50",
          "10. change percent": "0.6494%",
        },
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createAuthenticatedUser = async (
    email = "user@investments.test",
  ) => {
    const agent = request.agent(app);

    await agent
      .post("/api/auth/register")
      .send({
        firstName: "Investment",
        lastName: "Tester",
        email,
        password: "Password123!",
      });

    const loginResponse = await agent
      .post("/api/auth/login")
      .send({
        email,
        password: "Password123!",
      });

    expect(loginResponse.status).toBe(200);

    return agent;
  };

  const createInvestment = async (
    agent,
    overrides = {},
  ) => {
    return agent
      .post("/api/investments")
      .send({
        symbol: "AAPL",
        quantity: 10,
        purchasePrice: 200,
        ...overrides,
      });
  };

    it("should reject unauthenticated access to investments", async () => {
    const response = await request(app)
      .get("/api/investments");

    expect(response.status).toBe(401);
  });

    it("should create a valid investment", async () => {
    const agent = await createAuthenticatedUser();

    const response = await createInvestment(agent, {
      symbol: " aapl ",
    });

    expect(response.status).toBe(201);

    expect(response.body.symbol).toBe("AAPL");
    expect(Number(response.body.quantity)).toBe(10);
    expect(Number(response.body.purchase_price)).toBe(200);
  });

    it("should reject a negative quantity", async () => {
    const agent = await createAuthenticatedUser();

    const response = await createInvestment(agent, {
      quantity: -5,
    });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe(
      "Quantity and purchase price must be greater than zero",
    );
  });

    it("should reject a non-numeric quantity", async () => {
    const agent = await createAuthenticatedUser();

    const response = await createInvestment(agent, {
      quantity: "hello",
    });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe(
      "Quantity and purchase price must be greater than zero",
    );
  });

    it("should reject an invalid stock symbol", async () => {
    const agent = await createAuthenticatedUser();

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        "Global Quote": {},
      }),
    });

    const response = await createInvestment(agent, {
      symbol: "NOTREALXYZ",
    });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe(
      "Invalid stock symbol",
    );
  });

    it("should return only the authenticated user's investments", async () => {
    const userOne = await createAuthenticatedUser(
      "user1@investments.test",
    );

    const userTwo = await createAuthenticatedUser(
      "user2@investments.test",
    );

    const firstInvestment =
      await createInvestment(userOne);

    expect(firstInvestment.status).toBe(201);

    const secondInvestment =
      await createInvestment(userTwo);

    expect(secondInvestment.status).toBe(201);

    const response = await userOne.get(
      "/api/investments",
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);

    expect(response.body[0].symbol).toBe("AAPL");
  });

    it("should prevent a user from updating another user's investment", async () => {
    const userOne = await createAuthenticatedUser(
      "updateowner@investments.test",
    );

    const userTwo = await createAuthenticatedUser(
      "updateother@investments.test",
    );

    const createResponse =
      await createInvestment(userOne);

    expect(createResponse.status).toBe(201);

    const investmentId = createResponse.body.id;

    const response = await userTwo
      .put(`/api/investments/${investmentId}`)
      .send({
        symbol: "AAPL",
        quantity: 20,
        purchasePrice: 210,
      });

    expect(response.status).toBe(404);

    expect(response.body.message).toBe(
      "Investment not found",
    );
  });

    it("should prevent a user from deleting another user's investment", async () => {
    const userOne = await createAuthenticatedUser(
      "deleteowner@investments.test",
    );

    const userTwo = await createAuthenticatedUser(
      "deleteother@investments.test",
    );

    const createResponse =
      await createInvestment(userOne);

    expect(createResponse.status).toBe(201);

    const investmentId = createResponse.body.id;

    const response = await userTwo.delete(
      `/api/investments/${investmentId}`,
    );

    expect(response.status).toBe(404);

    expect(response.body.message).toBe(
      "Investment not found",
    );
  });

    it("should return 503 when Alpha Vantage cannot validate the symbol", async () => {
    const agent = await createAuthenticatedUser();

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        Note: "API call frequency limit reached",
      }),
    });

    const response = await createInvestment(agent);

    expect(response.status).toBe(503);

    expect(response.body.message).toBe(
      "Unable to validate stock symbol. Please try again later.",
    );
  });

    it("should return 503 when the market data service request fails", async () => {
    const agent = await createAuthenticatedUser();

    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
    });

    const response = await createInvestment(agent);

    expect(response.status).toBe(503);

    expect(response.body.message).toBe(
      "Unable to validate stock symbol. Please try again later.",
    );
  });

});