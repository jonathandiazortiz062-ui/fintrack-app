import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import app from "../app.js";
import pool from "../db/db.js";

describe("Transactions API", () => {
  beforeEach(async () => {
    await pool.query(`
      DELETE FROM transactions
      WHERE account_id IN (
        SELECT id
        FROM accounts
        WHERE user_id IN (
          SELECT id
          FROM users
          WHERE email LIKE '%@transactions.test'
        )
      )
    `);

    await pool.query(`
      DELETE FROM accounts
      WHERE user_id IN (
        SELECT id
        FROM users
        WHERE email LIKE '%@transactions.test'
      )
    `);

    await pool.query(`
      DELETE FROM users
      WHERE email LIKE '%@transactions.test'
    `);
  });

  const createAuthenticatedUser = async (email = "user@transactions.test") => {
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send({
      firstName: "Transaction",
      lastName: "Tester",
      email,
      password: "Password123!",
    });

    const loginResponse = await agent.post("/api/auth/login").send({
      email,
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    return agent;
  };

  const createAccount = async (agent, name = "Test Checking") => {
    const response = await agent.post("/api/accounts").send({
      name,
      accountType: "checking",
      balance: 1000,
    });

    expect(response.status).toBe(201);

    return response.body;
  };

  const createTransaction = async (agent, accountId, overrides = {}) => {
    const response = await agent.post("/api/transactions").send({
      accountId,
      categoryId: null,
      description: "Test transaction",
      amount: 100,
      transactionType: "expense",
      transactionDate: "2026-08-20",
      ...overrides,
    });

    return response;
  };

  it("should reject unauthenticated access to transactions", async () => {
    const response = await request(app).get("/api/transactions");

    expect(response.status).toBe(401);
  });

  it("should create a transaction for the authenticated user's account", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);

    const response = await createTransaction(agent, account.id);

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      account_id: account.id,
      description: "Test transaction",
      transaction_type: "expense",
    });

    expect(Number(response.body.amount)).toBe(100);
  });

  it("should reject a transaction with an amount of zero", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);

    const response = await createTransaction(agent, account.id, {
      amount: 0,
    });

    expect(response.status).toBe(400);
  });

  it("should reject a negative transaction amount", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);

    const response = await createTransaction(agent, account.id, {
      amount: -50,
    });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe(
      "Transaction amount must be greater than zero",
    );
  });

  it("should reject an invalid transaction type", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);

    const response = await createTransaction(agent, account.id, {
      transactionType: "transfer",
    });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe(
      "Transaction type must be either income or expense",
    );
  });

  it("should reject a transaction with a future date", async () => {
    const agent = await createAuthenticatedUser();
    const account = await createAccount(agent);

    const response = await createTransaction(agent, account.id, {
      transactionDate: "2099-01-01",
    });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe(
      "Transaction date cannot be in the future",
    );
  });

  it("should prevent a user from creating a transaction for another user's account", async () => {
    const userOne = await createAuthenticatedUser("owner@transactions.test");

    const userTwo = await createAuthenticatedUser("other@transactions.test");

    const userOneAccount = await createAccount(userOne, "Owner Checking");

    const response = await createTransaction(userTwo, userOneAccount.id);

    expect(response.status).toBe(404);

    expect(response.body.message).toBe("Account not found");
  });

  it("should return only the authenticated user's transactions", async () => {
    const userOne = await createAuthenticatedUser("user1@transactions.test");

    const userTwo = await createAuthenticatedUser("user2@transactions.test");

    const accountOne = await createAccount(userOne, "User One Checking");

    const accountTwo = await createAccount(userTwo, "User Two Checking");

    await createTransaction(userOne, accountOne.id, {
      description: "User One Expense",
    });

    await createTransaction(userTwo, accountTwo.id, {
      description: "User Two Expense",
    });

    const response = await userOne.get("/api/transactions");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);

    expect(response.body[0].description).toBe("User One Expense");
  });

  it("should prevent a user from updating another user's transaction", async () => {
    const userOne = await createAuthenticatedUser(
      "updateowner@transactions.test",
    );

    const userTwo = await createAuthenticatedUser(
      "updateother@transactions.test",
    );

    const accountOne = await createAccount(userOne);
    const accountTwo = await createAccount(userTwo);

    const transactionResponse = await createTransaction(userOne, accountOne.id);

    const transactionId = transactionResponse.body.id;

    const response = await userTwo
      .put(`/api/transactions/${transactionId}`)
      .send({
        accountId: accountTwo.id,
        categoryId: null,
        description: "Unauthorized Update",
        amount: 500,
        transactionType: "expense",
        transactionDate: "2026-08-20",
      });

    expect(response.status).toBe(404);

    expect(response.body.message).toBe("Transaction not found");
  });

  it("should prevent a user from deleting another user's transaction", async () => {
    const userOne = await createAuthenticatedUser(
      "deleteowner@transactions.test",
    );

    const userTwo = await createAuthenticatedUser(
      "deleteother@transactions.test",
    );

    const account = await createAccount(userOne);

    const transactionResponse = await createTransaction(userOne, account.id);

    const transactionId = transactionResponse.body.id;

    const response = await userTwo.delete(`/api/transactions/${transactionId}`);

    expect(response.status).toBe(404);

    expect(response.body.message).toBe("Transaction not found");
  });

  it("should preserve transactions from archived accounts in transaction history", async () => {
    const agent = await createAuthenticatedUser();

    const account = await createAccount(agent, "Account To Archive");

    const transactionResponse = await createTransaction(agent, account.id, {
      description: "Historical Expense",
    });

    expect(transactionResponse.status).toBe(201);

    const deleteResponse = await agent.delete(`/api/accounts/${account.id}`);

    expect(deleteResponse.status).toBe(200);

    const response = await agent.get("/api/transactions");

    expect(response.status).toBe(200);

    const historicalTransaction = response.body.find(
      (transaction) => transaction.id === transactionResponse.body.id,
    );

    expect(historicalTransaction).toBeDefined();

    expect(historicalTransaction.description).toBe("Historical Expense");

    expect(historicalTransaction.account_deleted_at).not.toBeNull();
  });
});
