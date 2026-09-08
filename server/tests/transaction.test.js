import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { googleClient } from "../controllers/authController.js";

import app from "../app.js";
import pool from "../db/db.js";

describe("Transactions API", () => {
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

    const googleId = `google-${email}`;

    googleVerifySpy.mockResolvedValueOnce({
      getPayload: () => ({
        sub: googleId,
        email,
        email_verified: true,
        given_name: "Transaction",
        family_name: "Tester",
      }),
    });

    const loginResponse = await agent.post("/api/auth/google").send({
      credential: `fake-token-${email}`,
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

    const accountResponse = await agent.get(`/api/accounts/${account.id}`);

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      account_id: account.id,
      description: "Test transaction",
      transaction_type: "expense",
    });

    expect(Number(response.body.amount)).toBe(100);

    expect(accountResponse.status).toBe(200);
    expect(Number(accountResponse.body.starting_balance)).toBe(1000);
    expect(Number(accountResponse.body.balance)).toBe(900);
  });

  it("should increase the account balance when an income transaction is created", async () => {
    const agent = await createAuthenticatedUser();

    const account = await createAccount(agent);

    const response = await createTransaction(agent, account.id, {
      description: "Test Income",
      amount: 250,
      transactionType: "income",
    });

    expect(response.status).toBe(201);

    const accountResponse = await agent.get(`/api/accounts/${account.id}`);

    expect(accountResponse.status).toBe(200);
    expect(Number(accountResponse.body.starting_balance)).toBe(1000);
    expect(Number(accountResponse.body.balance)).toBe(1250);
  });

  it("should restore the account balance when an expense transaction is deleted", async () => {
    const agent = await createAuthenticatedUser();

    const account = await createAccount(agent);

    // $1,000 - $200 expense = $800
    const transactionResponse = await createTransaction(agent, account.id, {
      description: "Expense To Delete",
      amount: 200,
      transactionType: "expense",
    });

    expect(transactionResponse.status).toBe(201);

    const afterCreateResponse = await agent.get(`/api/accounts/${account.id}`);

    expect(Number(afterCreateResponse.body.balance)).toBe(800);

    // Delete the $200 expense
    const deleteResponse = await agent.delete(
      `/api/transactions/${transactionResponse.body.id}`,
    );

    expect(deleteResponse.status).toBe(200);

    // Balance should return to the original $1,000
    const afterDeleteResponse = await agent.get(`/api/accounts/${account.id}`);

    expect(Number(afterDeleteResponse.body.starting_balance)).toBe(1000);
    expect(Number(afterDeleteResponse.body.balance)).toBe(1000);
  });

  it("should reverse the account balance when an income transaction is deleted", async () => {
    const agent = await createAuthenticatedUser();

    const account = await createAccount(agent);

    // $1,000 + $300 income = $1,300
    const transactionResponse = await createTransaction(agent, account.id, {
      description: "Income To Delete",
      amount: 300,
      transactionType: "income",
    });

    expect(transactionResponse.status).toBe(201);

    const afterCreateResponse = await agent.get(`/api/accounts/${account.id}`);

    expect(Number(afterCreateResponse.body.balance)).toBe(1300);

    // Delete the $300 income
    const deleteResponse = await agent.delete(
      `/api/transactions/${transactionResponse.body.id}`,
    );

    expect(deleteResponse.status).toBe(200);

    // Balance should return to $1,000
    const afterDeleteResponse = await agent.get(`/api/accounts/${account.id}`);

    expect(Number(afterDeleteResponse.body.starting_balance)).toBe(1000);
    expect(Number(afterDeleteResponse.body.balance)).toBe(1000);
  });

  it("should adjust the account balance when an expense amount is updated", async () => {
    const agent = await createAuthenticatedUser();

    const account = await createAccount(agent);

    // $1,000 - $100 expense = $900
    const transactionResponse = await createTransaction(agent, account.id, {
      description: "Expense To Update",
      amount: 100,
      transactionType: "expense",
    });

    expect(transactionResponse.status).toBe(201);

    const afterCreateResponse = await agent.get(`/api/accounts/${account.id}`);

    expect(Number(afterCreateResponse.body.balance)).toBe(900);

    // Change the expense from $100 to $250
    const updateResponse = await agent
      .put(`/api/transactions/${transactionResponse.body.id}`)
      .send({
        accountId: account.id,
        categoryId: null,
        description: "Updated Expense",
        amount: 250,
        transactionType: "expense",
        transactionDate: "2026-08-20",
      });

    expect(updateResponse.status).toBe(200);

    const afterUpdateResponse = await agent.get(`/api/accounts/${account.id}`);

    expect(Number(afterUpdateResponse.body.starting_balance)).toBe(1000);
    expect(Number(afterUpdateResponse.body.balance)).toBe(750);
  });

  it("should adjust the account balance when a transaction changes from expense to income", async () => {
    const agent = await createAuthenticatedUser();

    const account = await createAccount(agent);

    // $1,000 - $200 expense = $800
    const transactionResponse = await createTransaction(agent, account.id, {
      description: "Expense To Convert",
      amount: 200,
      transactionType: "expense",
    });

    expect(transactionResponse.status).toBe(201);

    const afterCreateResponse = await agent.get(`/api/accounts/${account.id}`);

    expect(Number(afterCreateResponse.body.balance)).toBe(800);

    // Change the transaction from a $200 expense to a $200 income
    const updateResponse = await agent
      .put(`/api/transactions/${transactionResponse.body.id}`)
      .send({
        accountId: account.id,
        categoryId: null,
        description: "Converted To Income",
        amount: 200,
        transactionType: "income",
        transactionDate: "2026-08-20",
      });

    expect(updateResponse.status).toBe(200);

    const afterUpdateResponse = await agent.get(`/api/accounts/${account.id}`);

    expect(Number(afterUpdateResponse.body.starting_balance)).toBe(1000);
    expect(Number(afterUpdateResponse.body.balance)).toBe(1200);
  });

  it("should adjust both account balances when a transaction is moved to another account", async () => {
    const agent = await createAuthenticatedUser();

    const accountOne = await createAccount(agent, "Checking Account");
    const accountTwo = await createAccount(agent, "Savings Account");

    // Both accounts start at $1,000.
    // Create $250 income in account one.
    const transactionResponse = await createTransaction(agent, accountOne.id, {
      description: "Income To Move",
      amount: 250,
      transactionType: "income",
    });

    expect(transactionResponse.status).toBe(201);

    const accountOneAfterCreate = await agent.get(
      `/api/accounts/${accountOne.id}`,
    );

    const accountTwoAfterCreate = await agent.get(
      `/api/accounts/${accountTwo.id}`,
    );

    expect(Number(accountOneAfterCreate.body.balance)).toBe(1250);
    expect(Number(accountTwoAfterCreate.body.balance)).toBe(1000);

    // Move the $250 income from account one to account two.
    const updateResponse = await agent
      .put(`/api/transactions/${transactionResponse.body.id}`)
      .send({
        accountId: accountTwo.id,
        categoryId: null,
        description: "Moved Income",
        amount: 250,
        transactionType: "income",
        transactionDate: "2026-08-20",
      });

    expect(updateResponse.status).toBe(200);

    const accountOneAfterMove = await agent.get(
      `/api/accounts/${accountOne.id}`,
    );

    const accountTwoAfterMove = await agent.get(
      `/api/accounts/${accountTwo.id}`,
    );

    expect(Number(accountOneAfterMove.body.starting_balance)).toBe(1000);
    expect(Number(accountOneAfterMove.body.balance)).toBe(1000);

    expect(Number(accountTwoAfterMove.body.starting_balance)).toBe(1000);
    expect(Number(accountTwoAfterMove.body.balance)).toBe(1250);
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
