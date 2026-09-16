import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { googleAuthLimiter } from "../middleware/authRateLimiter.js";

describe("Google Authentication Rate Limiter", () => {
  it("should block requests after the authentication rate limit is exceeded", async () => {
    const testApp = express();

    testApp.post(
      "/google",
      googleAuthLimiter,
      (req, res) => {
        res.status(200).json({
          message: "Authentication request allowed",
        });
      },
    );

    // The first 20 requests should be allowed.
    for (let i = 0; i < 20; i += 1) {
      const response = await request(testApp).post("/google");

      expect(response.status).toBe(200);
    }

    // Request 21 should be rejected by the rate limiter.
    const blockedResponse = await request(testApp).post("/google");

    expect(blockedResponse.status).toBe(429);

    expect(blockedResponse.body).toEqual({
      message: "Too many authentication attempts. Please try again later.",
    });
  });
});