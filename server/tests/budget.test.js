import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import app from "../app.js";
import pool from "../db/db.js";

describe("Budgets API", () => {
  beforeEach(async () => {
    // Delete transactions belonging to budget test users
    await pool.query(`
      DELETE FROM transactions
      WHERE account_id IN (
        SELECT id
        FROM accounts
        WHERE user_id IN (
          SELECT id
          FROM users
          WHERE email LIKE '%@budgets.test'
        )
      )
    `);

    // Delete budgets
    await pool.query(`
      DELETE FROM budgets
      WHERE user_id IN (
        SELECT id
        FROM users
        WHERE email LIKE '%@budgets.test'
      )
    `);

    // Delete accounts
    await pool.query(`
      DELETE FROM accounts
      WHERE user_id IN (
        SELECT id
        FROM users
        WHERE email LIKE '%@budgets.test'
      )
    `);

    // Delete users
    await pool.query(`
      DELETE FROM users
      WHERE email LIKE '%@budgets.test'
    `);

    // Delete temporary categories
    await pool.query(`
      DELETE FROM categories
      WHERE name LIKE 'Budget Test %'
    `);
  });

  const createAuthenticatedUser = async (
    email = "user@budgets.test",
  ) => {
    const agent = request.agent(app);

    await agent
      .post("/api/auth/register")
      .send({
        firstName: "Budget",
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

  const createCategory = async (
    name = "Budget Test Groceries",
  ) => {
    const result = await pool.query(
      `INSERT INTO categories (name)
       VALUES ($1)
       RETURNING *`,
      [name],
    );

    return result.rows[0];
  };

  const createAccount = async (
    agent,
    name = "Budget Test Checking",
  ) => {
    const response = await agent
      .post("/api/accounts")
      .send({
        name,
        accountType: "checking",
        balance: 1000,
      });

    expect(response.status).toBe(201);

    return response.body;
  };

  const createBudget = async (
    agent,
    categoryId,
    monthlyLimit = 500,
  ) => {
    return agent
      .post("/api/budgets")
      .send({
        categoryId,
        monthlyLimit,
      });
  };

  const getCurrentDatabaseDate = async () => {
    const result = await pool.query(
      `SELECT CURRENT_DATE::text AS current_date`,
    );

    return result.rows[0].current_date;
  };

    it("should reject unauthenticated access to budgets", async () => {
    const response = await request(app)
      .get("/api/budgets");

    expect(response.status).toBe(401);
  });

    it("should create a budget for an authenticated user", async () => {
    const agent = await createAuthenticatedUser();
    const category = await createCategory();

    const response = await createBudget(
      agent,
      category.id,
      600,
    );

    expect(response.status).toBe(201);

    expect(response.body.category_id).toBe(category.id);
    expect(Number(response.body.monthly_limit)).toBe(600);
  });

    it("should reject an invalid monthly limit", async () => {
    const agent = await createAuthenticatedUser();
    const category = await createCategory();

    const response = await createBudget(
      agent,
      category.id,
      "not-a-number",
    );

    expect(response.status).toBe(400);

    expect(response.body.message).toBe(
      "Monthly limit must be a valid number greater than zero",
    );
  });

    it("should reject a budget for a nonexistent category", async () => {
    const agent = await createAuthenticatedUser();

    const response = await createBudget(
      agent,
      999999,
      500,
    );

    expect(response.status).toBe(404);

    expect(response.body.message).toBe(
      "Category not found",
    );
  });

    it("should reject a duplicate budget for the same category", async () => {
    const agent = await createAuthenticatedUser();
    const category = await createCategory();

    const firstResponse = await createBudget(
      agent,
      category.id,
      500,
    );

    expect(firstResponse.status).toBe(201);

    const secondResponse = await createBudget(
      agent,
      category.id,
      750,
    );

    expect(secondResponse.status).toBe(409);

    expect(secondResponse.body.message).toBe(
      "A budget already exists for this category",
    );
  });

    it("should return only the authenticated user's budgets", async () => {
    const userOne = await createAuthenticatedUser(
      "user1@budgets.test",
    );

    const userTwo = await createAuthenticatedUser(
      "user2@budgets.test",
    );

    const categoryOne = await createCategory(
      "Budget Test Groceries",
    );

    const categoryTwo = await createCategory(
      "Budget Test Travel",
    );

    await createBudget(
      userOne,
      categoryOne.id,
      500,
    );

    await createBudget(
      userTwo,
      categoryTwo.id,
      1000,
    );

    const response = await userOne.get("/api/budgets");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);

    expect(response.body[0].category_name).toBe(
      "Budget Test Groceries",
    );

    expect(Number(response.body[0].monthly_limit)).toBe(
      500,
    );
  });

    it("should prevent a user from updating another user's budget", async () => {
    const userOne = await createAuthenticatedUser(
      "owner@budgets.test",
    );

    const userTwo = await createAuthenticatedUser(
      "other@budgets.test",
    );

    const category = await createCategory();

    const createResponse = await createBudget(
      userOne,
      category.id,
      500,
    );

    const budgetId = createResponse.body.id;

    const response = await userTwo
      .put(`/api/budgets/${budgetId}`)
      .send({
        categoryId: category.id,
        monthlyLimit: 1000,
      });

    expect(response.status).toBe(404);

    expect(response.body.message).toBe(
      "Budget not found",
    );
  });

    it("should prevent a user from deleting another user's budget", async () => {
    const userOne = await createAuthenticatedUser(
      "deleteowner@budgets.test",
    );

    const userTwo = await createAuthenticatedUser(
      "deleteother@budgets.test",
    );

    const category = await createCategory();

    const createResponse = await createBudget(
      userOne,
      category.id,
      500,
    );

    const budgetId = createResponse.body.id;

    const response = await userTwo.delete(
      `/api/budgets/${budgetId}`,
    );

    expect(response.status).toBe(404);

    expect(response.body.message).toBe(
      "Budget not found",
    );
  });

    it("should calculate only the authenticated user's current-month spending", async () => {
    const userOne = await createAuthenticatedUser(
      "spending1@budgets.test",
    );

    const userTwo = await createAuthenticatedUser(
      "spending2@budgets.test",
    );

    const category = await createCategory(
      "Budget Test Shared Groceries",
    );

    const accountOne = await createAccount(
      userOne,
      "User One Checking",
    );

    const accountTwo = await createAccount(
      userTwo,
      "User Two Checking",
    );

    await createBudget(
      userOne,
      category.id,
      1000,
    );

    const currentDate =
      await getCurrentDatabaseDate();

    const userOneTransaction = await userOne
      .post("/api/transactions")
      .send({
        accountId: accountOne.id,
        categoryId: category.id,
        description: "User One Groceries",
        amount: 125,
        transactionType: "expense",
        transactionDate: currentDate,
      });

    expect(userOneTransaction.status).toBe(201);

    const userTwoTransaction = await userTwo
      .post("/api/transactions")
      .send({
        accountId: accountTwo.id,
        categoryId: category.id,
        description: "User Two Groceries",
        amount: 300,
        transactionType: "expense",
        transactionDate: currentDate,
      });

    expect(userTwoTransaction.status).toBe(201);

    const response = await userOne.get(
      "/api/budgets",
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);

    expect(Number(response.body[0].amount_spent)).toBe(
      125,
    );
  });

  
});