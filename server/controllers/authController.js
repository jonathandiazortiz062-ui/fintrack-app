import pool from "../db/db.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const isProduction = process.env.NODE_ENV === "production";
export const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
};

//google authentication:
export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required",
      });
    }

    // Verify the ID token was issued by Google for our FinTrack client.
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const {
      sub: googleId,
      email,
      email_verified: emailVerified,
      given_name: firstName,
      family_name: lastName,
    } = payload;

    if (!email || !emailVerified) {
      return res.status(401).json({
        message: "Google account email could not be verified",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // First try to find an existing Google-linked FinTrack account.
    let result = await pool.query(
      `SELECT
        id,
        google_id,
        first_name,
        last_name,
        email
       FROM users
       WHERE google_id = $1`,
      [googleId],
    );

    let user;

    if (result.rows.length > 0) {
      user = result.rows[0];
    } else {
      // Check whether this email already belongs to an existing FinTrack user.
      result = await pool.query(
        `SELECT
          id,
          google_id,
          first_name,
          last_name,
          email
         FROM users
         WHERE email = $1`,
        [normalizedEmail],
      );

      if (result.rows.length > 0) {
        // Link the existing account to this verified Google identity.
        const existingUser = result.rows[0];

        const linkedUser = await pool.query(
          `UPDATE users
           SET google_id = $1
           WHERE id = $2
           RETURNING
             id,
             google_id,
             first_name,
             last_name,
             email`,
          [googleId, existingUser.id],
        );

        user = linkedUser.rows[0];
      } else {
        // First Google sign-in: create the FinTrack account.
        const createdUser = await pool.query(
          `INSERT INTO users (
            google_id,
            first_name,
            last_name,
            email
          )
          VALUES ($1, $2, $3, $4)
          RETURNING
            id,
            google_id,
            first_name,
            last_name,
            email`,
          [
            googleId,
            firstName || "Google",
            lastName || "User",
            normalizedEmail,
          ],
        );

        user = createdUser.rows[0];
      }
    }

    // Create the same FinTrack JWT our existing middleware already understands.
    const token = jwt.sign(
      {
        userId: user.id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.cookie("token", token, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
    });
  } catch (error) {
    console.error("Google login error:", error);

    res.status(401).json({
      message: "Unable to authenticate with Google",
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT
        id,
        first_name,
        last_name,
        email
       FROM users
       WHERE id = $1`,
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
    });
  } catch (error) {
    console.error("Error fetching current user:", error);

    res.status(500).json({
      message: "Unable to retrieve current user",
    });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", cookieOptions);

  res.json({
    message: "Logged out successfully",
  });
};
