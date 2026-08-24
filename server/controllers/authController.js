import bcrypt from "bcrypt";
import pool from "../db/db.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existingUser = await pool.query(
      `SELECT id
       FROM users
       WHERE email = $1`,
      [email],
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (
        first_name,
        last_name,
        email,
        password_hash
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        first_name,
        last_name,
        email,
        created_at`,
      [firstName, lastName, email.toLowerCase(), passwordHash],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error registering user:", error);

    res.status(500).json({
      message: "Unable to register user",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const result = await pool.query(
      `SELECT
        id,
        first_name,
        last_name,
        email,
        password_hash
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

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
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });
    
    res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
    });
  } catch (error) {
    console.error("Error logging in:", error);

    res.status(500).json({
      message: "Unable to log in",
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
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email
    });

  } catch (error) {
    console.error('Error fetching current user:', error);

    res.status(500).json({
      message: 'Unable to retrieve current user'
    });
  }
};
