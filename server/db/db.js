import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV === "test"
    ? ".env.test"
    : ".env",
});

const { Pool } = pg;
const isProduction = process.env.NODE_ENV === "production";

const pool = isProduction ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
}) : new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

export default pool;