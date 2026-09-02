import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import app from "../app.js";
import pool from "../db/db.js";

describe("Accounts API", () => {
  beforeEach(async () => {
    // Remove accounts belonging to users created by this test file
    await pool.query(`
      DELETE FROM accounts
      WHERE user_id IN (
        SELECT id
        FROM users
        WHERE email LIKE '%@accounts.test'
      )
    `);

    // Remove the test users
    await pool.query(`
      DELETE FROM users
      WHERE email LIKE '%@accounts.test'
    `);
  });

  const createAuthenticatedUser = async (email = "user@accounts.test") => {
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send({
      firstName: "Account",
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

  it("should reject unauthenticated access to accounts", async () => {
    const response = await request(app).get("/api/accounts");

    expect(response.status).toBe(401);
  });

  it("should create an account for an authenticated user", async () => {
    const agent = await createAuthenticatedUser();

    const response = await agent.post("/api/accounts").send({
      name: "Checking Account",
      accountType: "checking",
      balance: 1500,
    });

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      name: "Checking Account",
      account_type: "checking",
    });

    expect(Number(response.body.balance)).toBe(1500);
  });

  it("should reject an invalid account type", async () => {
    const agent = await createAuthenticatedUser();

    const response = await agent.post("/api/accounts").send({
      name: "Invalid Account",
      accountType: "investment",
      balance: 1000,
    });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe("Invalid account type");
  });

  it("should reject a non-numeric balance", async () => {
    const agent = await createAuthenticatedUser();

    const response = await agent.post("/api/accounts").send({
      name: "Checking Account",
      accountType: "checking",
      balance: "not-a-number",
    });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe("Balance must be a valid number");
  });

  it("should return only the authenticated user's accounts", async () => {
    const userOne = await createAuthenticatedUser("user1@accounts.test");

    const userTwo = await createAuthenticatedUser("user2@accounts.test");

    await userOne.post("/api/accounts").send({
      name: "User One Checking",
      accountType: "checking",
      balance: 1000,
    });

    await userTwo.post("/api/accounts").send({
      name: "User Two Savings",
      accountType: "savings",
      balance: 2000,
    });

    const response = await userOne.get("/api/accounts");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);

    expect(response.body[0].name).toBe("User One Checking");
  });

  it("should prevent a user from updating another user's account", async () => {
    const userOne = await createAuthenticatedUser("owner@accounts.test");

    const userTwo = await createAuthenticatedUser("other@accounts.test");

    const createResponse = await userOne.post("/api/accounts").send({
      name: "Owner Checking",
      accountType: "checking",
      balance: 1000,
    });

    const accountId = createResponse.body.id;

    const response = await userTwo.put(`/api/accounts/${accountId}`).send({
      name: "Stolen Account",
      accountType: "checking",
      balance: 9999,
    });

    expect(response.status).toBe(404);

    expect(response.body.message).toBe("Account not found");
  });

  it("should soft delete an account and remove it from the active account list", async () => {
    const agent = await createAuthenticatedUser();

    const createResponse = await agent.post("/api/accounts").send({
      name: "Savings Account",
      accountType: "savings",
      balance: 5000,
    });

    const accountId = createResponse.body.id;

    const deleteResponse = await agent.delete(`/api/accounts/${accountId}`);

    expect(deleteResponse.status).toBe(200);

    expect(deleteResponse.body.message).toBe("Account deleted successfully");

    // It should no longer appear in active accounts
    const accountsResponse = await agent.get("/api/accounts");

    expect(accountsResponse.status).toBe(200);

    const deletedAccount = accountsResponse.body.find(
      (account) => account.id === accountId,
    );

    expect(deletedAccount).toBeUndefined();

    // But the database record should still exist
    const databaseResult = await pool.query(
      `SELECT id, deleted_at
       FROM accounts
       WHERE id = $1`,
      [accountId],
    );

    expect(databaseResult.rows).toHaveLength(1);
    expect(databaseResult.rows[0].deleted_at).not.toBeNull();
  });

  it("should not allow an archived account to be retrieved by ID", async () => {
    const agent = await createAuthenticatedUser();

    const createResponse = await agent.post("/api/accounts").send({
      name: "Archived Checking",
      accountType: "checking",
      balance: 1000,
    });

    const accountId = createResponse.body.id;

    await agent.delete(`/api/accounts/${accountId}`);

    const response = await agent.get(`/api/accounts/${accountId}`);

    expect(response.status).toBe(404);

    expect(response.body.message).toBe("Account not found");
  });

  it("should not allow an archived account to be updated", async () => {
    const agent = await createAuthenticatedUser();

    const createResponse = await agent.post("/api/accounts").send({
      name: "Archived Savings",
      accountType: "savings",
      balance: 2000,
    });

    const accountId = createResponse.body.id;

    await agent.delete(`/api/accounts/${accountId}`);

    const response = await agent.put(`/api/accounts/${accountId}`).send({
      name: "Updated Archived Savings",
      accountType: "savings",
      balance: 5000,
    });

    expect(response.status).toBe(404);

    expect(response.body.message).toBe("Account not found");
  });
});
