import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { googleClient } from "../controllers/authController.js";
import app from "../app.js";
import pool from "../db/db.js";

describe("Monthly Obligations API", () => {
  let googleVerifySpy;

  beforeEach(async () => {
    vi.restoreAllMocks();

    googleVerifySpy = vi.spyOn(googleClient, "verifyIdToken");

    // Delete monthly obligations belonging to test users
    await pool.query(`
      DELETE FROM monthly_obligations
      WHERE user_id IN (
        SELECT id
        FROM users
        WHERE email LIKE '%@monthly-obligations.test'
      )
    `);

    // Delete accounts belonging to test users
    await pool.query(`
      DELETE FROM accounts
      WHERE user_id IN (
        SELECT id
        FROM users
        WHERE email LIKE '%@monthly-obligations.test'
      )
    `);

    // Delete test users
    await pool.query(`
      DELETE FROM users
      WHERE email LIKE '%@monthly-obligations.test'
    `);

    // Delete temporary categories
    await pool.query(`
      DELETE FROM categories
      WHERE name LIKE 'Monthly Obligation Test %'
    `);
  });

  const createAuthenticatedUser = async (
    email = "user@monthly-obligations.test",
  ) => {
    const agent = request.agent(app);
    const googleId = `google-${email}`;

    googleVerifySpy.mockResolvedValueOnce({
      getPayload: () => ({
        sub: googleId,
        email,
        email_verified: true,
        given_name: "Monthly",
        family_name: "Tester",
      }),
    });

    const loginResponse = await agent.post("/api/auth/google").send({
      credential: `fake-token-${email}`,
    });

    expect(loginResponse.status).toBe(200);

    return agent;
  };

  const createAccount = async (
    agent,
    name = "Monthly Obligation Test Checking",
  ) => {
    const response = await agent.post("/api/accounts").send({
      name,
      accountType: "checking",
      balance: 1000,
    });

    expect(response.status).toBe(201);

    return response.body;
  };

  const createCategory = async (name = "Monthly Obligation Test Housing") => {
    const result = await pool.query(
      `INSERT INTO categories (name)
       VALUES ($1)
       RETURNING *`,
      [name],
    );

    return result.rows[0];
  };

  const getCurrentDatabaseDate = async () => {
    const result = await pool.query(`
      SELECT CURRENT_DATE::text AS current_date
    `);

    return result.rows[0].current_date;
  };

  const getNextMonthDate = async () => {
    const result = await pool.query(`
      SELECT (
        DATE_TRUNC('month', CURRENT_DATE)
        + INTERVAL '1 month'
        + INTERVAL '5 days'
      )::date::text AS next_month_date
    `);

    return result.rows[0].next_month_date;
  };

  const getTwoMonthsAheadDate = async () => {
    const result = await pool.query(`
      SELECT (
        DATE_TRUNC('month', CURRENT_DATE)
        + INTERVAL '2 months'
      )::date::text AS future_date
    `);

    return result.rows[0].future_date;
  };

  const createObligation = async (
    agent,
    accountId,
    categoryId,
    dueDate,
    overrides = {},
  ) => {
    return agent.post("/api/monthly-obligations").send({
      accountId,
      categoryId,
      name: "Rent",
      amount: 1200,
      transactionType: "expense",
      dueDate,
      ...overrides,
    });
  };

  it("should reject unauthenticated access to monthly obligations", async () => {
    const response = await request(app).get("/api/monthly-obligations");

    expect(response.status).toBe(401);
  });

  it("should create a monthly obligation for the current month", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);
    const category = await createCategory();
    const currentDate = await getCurrentDatabaseDate();

    const response = await createObligation(
      agent,
      account.id,
      category.id,
      currentDate,
    );

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Rent");
    expect(Number(response.body.amount)).toBe(1200);
    expect(response.body.transaction_type).toBe("expense");
    expect(response.body.is_completed).toBe(false);
    expect(response.body.completed_at).toBeNull();
  });

  it("should create a monthly obligation for next month", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);
    const category = await createCategory();
    const nextMonthDate = await getNextMonthDate();

    const response = await createObligation(
      agent,
      account.id,
      category.id,
      nextMonthDate,
    );

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Rent");
  });

  it("should reject an obligation outside the two-month window", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);
    const category = await createCategory();
    const futureDate = await getTwoMonthsAheadDate();

    const response = await createObligation(
      agent,
      account.id,
      category.id,
      futureDate,
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Due date must be within the current month or next month",
    );
  });

  it("should reject an invalid amount", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);
    const category = await createCategory();
    const currentDate = await getCurrentDatabaseDate();

    const response = await createObligation(
      agent,
      account.id,
      category.id,
      currentDate,
      {
        amount: -100,
      },
    );

    expect(response.status).toBe(400);
  });

  it("should reject an invalid transaction type", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);
    const category = await createCategory();
    const currentDate = await getCurrentDatabaseDate();

    const response = await createObligation(
      agent,
      account.id,
      category.id,
      currentDate,
      {
        transactionType: "transfer",
      },
    );

    expect(response.status).toBe(400);
  });

  it("should prevent a user from using another user's account", async () => {
    const userOne = await createAuthenticatedUser(
      "owner@monthly-obligations.test",
    );

    const userTwo = await createAuthenticatedUser(
      "other@monthly-obligations.test",
    );

    const userOneAccount = await createAccount(
      userOne,
      "Monthly Obligation Test Owner Checking",
    );

    const category = await createCategory();
    const currentDate = await getCurrentDatabaseDate();

    const response = await createObligation(
      userTwo,
      userOneAccount.id,
      category.id,
      currentDate,
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid account");
  });

  it("should return only the authenticated user's obligations", async () => {
    const userOne = await createAuthenticatedUser(
      "user1@monthly-obligations.test",
    );

    const userTwo = await createAuthenticatedUser(
      "user2@monthly-obligations.test",
    );

    const accountOne = await createAccount(
      userOne,
      "Monthly Obligation Test User One Checking",
    );

    const accountTwo = await createAccount(
      userTwo,
      "Monthly Obligation Test User Two Checking",
    );

    const categoryOne = await createCategory("Monthly Obligation Test Housing");

    const categoryTwo = await createCategory(
      "Monthly Obligation Test Utilities",
    );

    const currentDate = await getCurrentDatabaseDate();

    await createObligation(
      userOne,
      accountOne.id,
      categoryOne.id,
      currentDate,
      {
        name: "User One Rent",
      },
    );

    await createObligation(
      userTwo,
      accountTwo.id,
      categoryTwo.id,
      currentDate,
      {
        name: "User Two Electricity",
      },
    );

    const response = await userOne.get("/api/monthly-obligations");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe("User One Rent");
    expect(response.body[0].account_name).toBe(
      "Monthly Obligation Test User One Checking",
    );
    expect(response.body[0].category_name).toBe(
      "Monthly Obligation Test Housing",
    );
  });

  it("should update a monthly obligation", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);
    const category = await createCategory();
    const currentDate = await getCurrentDatabaseDate();

    const createResponse = await createObligation(
      agent,
      account.id,
      category.id,
      currentDate,
    );

    expect(createResponse.status).toBe(201);

    const obligationId = createResponse.body.id;

    const updateResponse = await agent
      .put(`/api/monthly-obligations/${obligationId}`)
      .send({
        accountId: account.id,
        categoryId: category.id,
        name: "Updated Rent",
        amount: 1350,
        transactionType: "expense",
        dueDate: currentDate,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.name).toBe("Updated Rent");
    expect(Number(updateResponse.body.amount)).toBe(1350);
    expect(updateResponse.body.transaction_type).toBe("expense");
  });

  it("should prevent a user from updating another user's obligation", async () => {
    const userOne = await createAuthenticatedUser(
      "update-owner@monthly-obligations.test",
    );

    const userTwo = await createAuthenticatedUser(
      "update-other@monthly-obligations.test",
    );

    const accountOne = await createAccount(
      userOne,
      "Monthly Obligation Test Owner Account",
    );

    const accountTwo = await createAccount(
      userTwo,
      "Monthly Obligation Test Other Account",
    );

    const category = await createCategory(
      "Monthly Obligation Test Update Category",
    );

    const currentDate = await getCurrentDatabaseDate();

    const createResponse = await createObligation(
      userOne,
      accountOne.id,
      category.id,
      currentDate,
    );

    expect(createResponse.status).toBe(201);

    const response = await userTwo
      .put(`/api/monthly-obligations/${createResponse.body.id}`)
      .send({
        accountId: accountTwo.id,
        categoryId: category.id,
        name: "Attempted Change",
        amount: 999,
        transactionType: "expense",
        dueDate: currentDate,
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Monthly obligation not found");
  });

  it("should prevent updating an obligation to another user's account", async () => {
    const userOne = await createAuthenticatedUser(
      "account-owner@monthly-obligations.test",
    );

    const userTwo = await createAuthenticatedUser(
      "account-other@monthly-obligations.test",
    );

    const accountOne = await createAccount(
      userOne,
      "Monthly Obligation Test Original Account",
    );

    const accountTwo = await createAccount(
      userTwo,
      "Monthly Obligation Test Forbidden Account",
    );

    const category = await createCategory(
      "Monthly Obligation Test Account Category",
    );

    const currentDate = await getCurrentDatabaseDate();

    const createResponse = await createObligation(
      userOne,
      accountOne.id,
      category.id,
      currentDate,
    );

    const response = await userOne
      .put(`/api/monthly-obligations/${createResponse.body.id}`)
      .send({
        accountId: accountTwo.id,
        categoryId: category.id,
        name: "Rent",
        amount: 1200,
        transactionType: "expense",
        dueDate: currentDate,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid account");
  });

  it("should reject updating an obligation outside the two-month window", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);
    const category = await createCategory();
    const currentDate = await getCurrentDatabaseDate();
    const futureDate = await getTwoMonthsAheadDate();

    const createResponse = await createObligation(
      agent,
      account.id,
      category.id,
      currentDate,
    );

    const response = await agent
      .put(`/api/monthly-obligations/${createResponse.body.id}`)
      .send({
        accountId: account.id,
        categoryId: category.id,
        name: "Rent",
        amount: 1200,
        transactionType: "expense",
        dueDate: futureDate,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Due date must be within the current month or next month",
    );
  });

  it("should mark a monthly obligation as completed", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);
    const category = await createCategory();
    const currentDate = await getCurrentDatabaseDate();

    const createResponse = await createObligation(
      agent,
      account.id,
      category.id,
      currentDate,
    );

    const response = await agent
      .patch(`/api/monthly-obligations/${createResponse.body.id}/completion`)
      .send({
        isCompleted: true,
      });

    expect(response.status).toBe(200);
    expect(response.body.is_completed).toBe(true);
    expect(response.body.completed_at).not.toBeNull();
  });

  it("should mark a completed monthly obligation as incomplete", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);
    const category = await createCategory();
    const currentDate = await getCurrentDatabaseDate();

    const createResponse = await createObligation(
      agent,
      account.id,
      category.id,
      currentDate,
    );

    const obligationId = createResponse.body.id;

    const completeResponse = await agent
      .patch(`/api/monthly-obligations/${obligationId}/completion`)
      .send({
        isCompleted: true,
      });

    expect(completeResponse.status).toBe(200);
    expect(completeResponse.body.is_completed).toBe(true);

    const incompleteResponse = await agent
      .patch(`/api/monthly-obligations/${obligationId}/completion`)
      .send({
        isCompleted: false,
      });

    expect(incompleteResponse.status).toBe(200);
    expect(incompleteResponse.body.is_completed).toBe(false);
    expect(incompleteResponse.body.completed_at).toBeNull();
  });

  it("should reject an invalid completion value", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);
    const category = await createCategory();
    const currentDate = await getCurrentDatabaseDate();

    const createResponse = await createObligation(
      agent,
      account.id,
      category.id,
      currentDate,
    );

    const response = await agent
      .patch(`/api/monthly-obligations/${createResponse.body.id}/completion`)
      .send({
        isCompleted: "true",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("isCompleted must be a boolean");
  });

  it("should prevent a user from changing another user's obligation completion", async () => {
    const userOne = await createAuthenticatedUser(
      "completion-owner@monthly-obligations.test",
    );

    const userTwo = await createAuthenticatedUser(
      "completion-other@monthly-obligations.test",
    );

    const account = await createAccount(
      userOne,
      "Monthly Obligation Test Completion Account",
    );

    const category = await createCategory(
      "Monthly Obligation Test Completion Category",
    );

    const currentDate = await getCurrentDatabaseDate();

    const createResponse = await createObligation(
      userOne,
      account.id,
      category.id,
      currentDate,
    );

    const response = await userTwo
      .patch(`/api/monthly-obligations/${createResponse.body.id}/completion`)
      .send({
        isCompleted: true,
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Monthly obligation not found");
  });

  it("should delete a monthly obligation", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);
    const category = await createCategory();
    const currentDate = await getCurrentDatabaseDate();

    const createResponse = await createObligation(
      agent,
      account.id,
      category.id,
      currentDate,
    );

    expect(createResponse.status).toBe(201);

    const obligationId = createResponse.body.id;

    const deleteResponse = await agent.delete(
      `/api/monthly-obligations/${obligationId}`,
    );

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.message).toBe(
      "Monthly obligation deleted successfully",
    );

    // Verify it is actually gone
    const getResponse = await agent.get("/api/monthly-obligations");

    expect(getResponse.status).toBe(200);

    const deletedObligation = getResponse.body.find(
      (obligation) => obligation.id === obligationId,
    );

    expect(deletedObligation).toBeUndefined();
  });

  it("should prevent a user from deleting another user's obligation", async () => {
    const userOne = await createAuthenticatedUser(
      "delete-owner@monthly-obligations.test",
    );

    const userTwo = await createAuthenticatedUser(
      "delete-other@monthly-obligations.test",
    );

    const account = await createAccount(
      userOne,
      "Monthly Obligation Test Delete Account",
    );

    const category = await createCategory(
      "Monthly Obligation Test Delete Category",
    );

    const currentDate = await getCurrentDatabaseDate();

    const createResponse = await createObligation(
      userOne,
      account.id,
      category.id,
      currentDate,
    );

    expect(createResponse.status).toBe(201);

    const response = await userTwo.delete(
      `/api/monthly-obligations/${createResponse.body.id}`,
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Monthly obligation not found");

    // Verify the owner's obligation still exists
    const ownerResponse = await userOne.get("/api/monthly-obligations");

    const obligationStillExists = ownerResponse.body.some(
      (obligation) => obligation.id === createResponse.body.id,
    );

    expect(obligationStillExists).toBe(true);
  });

  it("should copy current-month obligations to next month", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);
    const category = await createCategory();

    const currentDateResult = await pool.query(`
    SELECT (
      DATE_TRUNC('month', CURRENT_DATE)
      + INTERVAL '10 days'
    )::date::text AS current_month_date
  `);

    const currentMonthDate = currentDateResult.rows[0].current_month_date;

    const createResponse = await createObligation(
      agent,
      account.id,
      category.id,
      currentMonthDate,
      {
        name: "Rent",
        amount: 1200,
      },
    );

    expect(createResponse.status).toBe(201);

    const copyResponse = await agent.post(
      "/api/monthly-obligations/copy-next-month",
    );

    expect(copyResponse.status).toBe(201);
    expect(copyResponse.body).toHaveLength(1);

    const copiedObligation = copyResponse.body[0];

    expect(copiedObligation.id).not.toBe(createResponse.body.id);
    expect(copiedObligation.name).toBe("Rent");
    expect(Number(copiedObligation.amount)).toBe(1200);
    expect(copiedObligation.account_id).toBe(account.id);
    expect(copiedObligation.category_id).toBe(category.id);
    expect(copiedObligation.is_completed).toBe(false);
    expect(copiedObligation.completed_at).toBeNull();

    const expectedDateResult = await pool.query(`
    SELECT (
      DATE_TRUNC('month', CURRENT_DATE)
      + INTERVAL '1 month'
      + INTERVAL '10 days'
    )::date::text AS expected_date
  `);

    expect(new Date(copiedObligation.due_date).toISOString().slice(0, 10)).toBe(
      expectedDateResult.rows[0].expected_date,
    );
  });

  it("should reset completion when copying obligations to next month", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);
    const category = await createCategory();
    const currentDate = await getCurrentDatabaseDate();

    const createResponse = await createObligation(
      agent,
      account.id,
      category.id,
      currentDate,
    );

    const completionResponse = await agent
      .patch(`/api/monthly-obligations/${createResponse.body.id}/completion`)
      .send({
        isCompleted: true,
      });

    expect(completionResponse.status).toBe(200);
    expect(completionResponse.body.is_completed).toBe(true);

    const copyResponse = await agent.post(
      "/api/monthly-obligations/copy-next-month",
    );

    expect(copyResponse.status).toBe(201);
    expect(copyResponse.body).toHaveLength(1);

    expect(copyResponse.body[0].is_completed).toBe(false);
    expect(copyResponse.body[0].completed_at).toBeNull();
  });

  it("should reject copying when next month already contains obligations", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);
    const category = await createCategory();

    const currentDate = await getCurrentDatabaseDate();
    const nextMonthDate = await getNextMonthDate();

    const currentResponse = await createObligation(
      agent,
      account.id,
      category.id,
      currentDate,
      {
        name: "Current Month Rent",
      },
    );

    expect(currentResponse.status).toBe(201);

    const nextResponse = await createObligation(
      agent,
      account.id,
      category.id,
      nextMonthDate,
      {
        name: "Next Month Rent",
      },
    );

    expect(nextResponse.status).toBe(201);

    const response = await agent.post(
      "/api/monthly-obligations/copy-next-month",
    );

    expect(response.status).toBe(409);
    expect(response.body.message).toBe(
      "Next month already contains obligations",
    );
  });

  it("should reject copying when current month has no obligations", async () => {
    const agent = await createAuthenticatedUser();

    const response = await agent.post(
      "/api/monthly-obligations/copy-next-month",
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Current month has no obligations to copy",
    );
  });

  it("should clamp copied due dates to the last valid day of the next month", async () => {
    const result = await pool.query(`
    SELECT
      (
        DATE_TRUNC('month', DATE '2026-01-31')
        + INTERVAL '1 month'
        + (
            LEAST(
              EXTRACT(DAY FROM DATE '2026-01-31')::int,
              EXTRACT(
                DAY FROM (
                  DATE_TRUNC('month', DATE '2026-01-31')
                  + INTERVAL '2 months'
                  - INTERVAL '1 day'
                )
              )::int
            ) - 1
          ) * INTERVAL '1 day'
      )::date::text AS february_date,

      (
        DATE_TRUNC('month', DATE '2026-03-31')
        + INTERVAL '1 month'
        + (
            LEAST(
              EXTRACT(DAY FROM DATE '2026-03-31')::int,
              EXTRACT(
                DAY FROM (
                  DATE_TRUNC('month', DATE '2026-03-31')
                  + INTERVAL '2 months'
                  - INTERVAL '1 day'
                )
              )::int
            ) - 1
          ) * INTERVAL '1 day'
      )::date::text AS april_date
  `);

    expect(result.rows[0].february_date).toBe("2026-02-28");
    expect(result.rows[0].april_date).toBe("2026-04-30");
  });
});
