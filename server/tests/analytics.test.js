import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { googleClient } from "../controllers/authController.js";

import app from "../app.js";
import pool from "../db/db.js";

describe("Analytics API", () => {
  let googleVerifySpy;

  beforeEach(async () => {
    vi.restoreAllMocks();

    googleVerifySpy = vi.spyOn(googleClient, "verifyIdToken");

    await pool.query(`
      DELETE FROM transactions
      WHERE account_id IN (
        SELECT id
        FROM accounts
        WHERE user_id IN (
          SELECT id
          FROM users
          WHERE email LIKE '%@analytics.test'
        )
      )
    `);

    await pool.query(`
      DELETE FROM accounts
      WHERE user_id IN (
        SELECT id
        FROM users
        WHERE email LIKE '%@analytics.test'
      )
    `);

    await pool.query(`
      DELETE FROM users
      WHERE email LIKE '%@analytics.test'
    `);
  });

  const createAuthenticatedUser = async (email = "user@analytics.test") => {
    const agent = request.agent(app);

    const googleId = `google-${email}`;

    googleVerifySpy.mockResolvedValueOnce({
      getPayload: () => ({
        sub: googleId,
        email,
        email_verified: true,
        given_name: "Analytics",
        family_name: "Tester",
      }),
    });

    const loginResponse = await agent.post("/api/auth/google").send({
      credential: `fake-token-${email}`,
    });

    expect(loginResponse.status).toBe(200);

    return agent;
  };

  const createAccount = async (agent, name = "Analytics Checking") => {
    const response = await agent.post("/api/accounts").send({
      name,
      accountType: "checking",
      balance: 1000,
    });

    expect(response.status).toBe(201);

    return response.body;
  };

  const createTransaction = async (
    agent,
    accountId,
    {
      description = "Analytics transaction",
      amount = 100,
      transactionType = "expense",
      transactionDate = "2026-08-20",
    } = {},
  ) => {
    const response = await agent.post("/api/transactions").send({
      accountId,
      categoryId: null,
      description,
      amount,
      transactionType,
      transactionDate,
    });

    expect(response.status).toBe(201);

    return response.body;
  };

  it("should reject unauthenticated access to analytics", async () => {
    const response = await request(app).get(
      "/api/analytics/monthly-income-expenses",
    );

    expect(response.status).toBe(401);
  });

  it("should aggregate income and expenses by month", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);

    await createTransaction(agent, account.id, {
      description: "July Salary",
      amount: 4000,
      transactionType: "income",
      transactionDate: "2026-07-01",
    });

    await createTransaction(agent, account.id, {
      description: "July Expense",
      amount: 1200,
      transactionType: "expense",
      transactionDate: "2026-07-10",
    });

    await createTransaction(agent, account.id, {
      description: "August Salary",
      amount: 4500,
      transactionType: "income",
      transactionDate: "2026-08-01",
    });

    await createTransaction(agent, account.id, {
      description: "August Rent",
      amount: 1500,
      transactionType: "expense",
      transactionDate: "2026-08-05",
    });

    await createTransaction(agent, account.id, {
      description: "August Groceries",
      amount: 300,
      transactionType: "expense",
      transactionDate: "2026-08-15",
    });

    const response = await agent.get("/api/analytics/monthly-income-expenses");

    expect(response.status).toBe(200);

    expect(response.body).toEqual([
      {
        month: "2026-07",
        income: 4000,
        expenses: 1200,
      },
      {
        month: "2026-08",
        income: 4500,
        expenses: 1800,
      },
    ]);
  });

  it("should filter monthly analytics by date range", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);

    await createTransaction(agent, account.id, {
      amount: 1000,
      transactionType: "income",
      transactionDate: "2026-06-10",
    });

    await createTransaction(agent, account.id, {
      amount: 2000,
      transactionType: "income",
      transactionDate: "2026-07-10",
    });

    await createTransaction(agent, account.id, {
      amount: 500,
      transactionType: "expense",
      transactionDate: "2026-07-15",
    });

    await createTransaction(agent, account.id, {
      amount: 3000,
      transactionType: "income",
      transactionDate: "2026-08-10",
    });

    const response = await agent.get(
      "/api/analytics/monthly-income-expenses" +
        "?startDate=2026-07-01&endDate=2026-07-31",
    );

    expect(response.status).toBe(200);

    expect(response.body).toEqual([
      {
        month: "2026-07",
        income: 2000,
        expenses: 500,
      },
    ]);
  });

  it("should aggregate expenses by category", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);

    const groceriesResult = await pool.query(
      `INSERT INTO categories (name)
     VALUES ($1)
     RETURNING id`,
      ["Groceries"],
    );

    const rentResult = await pool.query(
      `INSERT INTO categories (name)
     VALUES ($1)
     RETURNING id`,
      ["Rent"],
    );

    const groceriesId = groceriesResult.rows[0].id;
    const rentId = rentResult.rows[0].id;

    await agent.post("/api/transactions").send({
      accountId: account.id,
      categoryId: groceriesId,
      description: "Groceries 1",
      amount: 150,
      transactionType: "expense",
      transactionDate: "2026-08-05",
    });

    await agent.post("/api/transactions").send({
      accountId: account.id,
      categoryId: groceriesId,
      description: "Groceries 2",
      amount: 100,
      transactionType: "expense",
      transactionDate: "2026-08-10",
    });

    await agent.post("/api/transactions").send({
      accountId: account.id,
      categoryId: rentId,
      description: "Rent",
      amount: 1200,
      transactionType: "expense",
      transactionDate: "2026-08-01",
    });

    const response = await agent.get("/api/analytics/expenses-by-category");

    expect(response.status).toBe(200);

    expect(response.body).toEqual([
      {
        categoryId: rentId,
        category: "Rent",
        expenses: 1200,
      },
      {
        categoryId: groceriesId,
        category: "Groceries",
        expenses: 250,
      },
    ]);
  });

  it("should filter expenses by category by date range", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);

    const categoryResult = await pool.query(
      `INSERT INTO categories (name)
     VALUES ($1)
     RETURNING id`,
      ["Dining"],
    );

    const categoryId = categoryResult.rows[0].id;

    await agent.post("/api/transactions").send({
      accountId: account.id,
      categoryId,
      description: "July Dining",
      amount: 80,
      transactionType: "expense",
      transactionDate: "2026-07-15",
    });

    await agent.post("/api/transactions").send({
      accountId: account.id,
      categoryId,
      description: "August Dining",
      amount: 120,
      transactionType: "expense",
      transactionDate: "2026-08-15",
    });

    const response = await agent.get(
      "/api/analytics/expenses-by-category" +
        "?startDate=2026-08-01&endDate=2026-08-31",
    );

    expect(response.status).toBe(200);

    expect(response.body).toEqual([
      {
        categoryId,
        category: "Dining",
        expenses: 120,
      },
    ]);
  });

  it("should return only the authenticated user's analytics", async () => {
    const userOne = await createAuthenticatedUser("user1@analytics.test");

    const userTwo = await createAuthenticatedUser("user2@analytics.test");

    const accountOne = await createAccount(userOne, "User One Checking");
    const accountTwo = await createAccount(userTwo, "User Two Checking");

    await createTransaction(userOne, accountOne.id, {
      amount: 5000,
      transactionType: "income",
      transactionDate: "2026-08-01",
    });

    await createTransaction(userOne, accountOne.id, {
      amount: 1000,
      transactionType: "expense",
      transactionDate: "2026-08-10",
    });

    await createTransaction(userTwo, accountTwo.id, {
      amount: 9000,
      transactionType: "income",
      transactionDate: "2026-08-01",
    });

    const response = await userOne.get(
      "/api/analytics/monthly-income-expenses",
    );

    expect(response.status).toBe(200);

    expect(response.body).toEqual([
      {
        month: "2026-08",
        income: 5000,
        expenses: 1000,
      },
    ]);
  });
});
