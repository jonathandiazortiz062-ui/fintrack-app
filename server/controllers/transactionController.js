import pool from "../db/db.js";

export const getTransactions = async (req, res) => {
  try {
    const { accountId, categoryId, type, startDate, endDate } = req.query;
    const userId = req.user.id;
    const values = [userId];

    let query = `
      SELECT
        transactions.id,
        transactions.account_id,
        transactions.category_id,
        transactions.description,
        transactions.amount,
        transactions.transaction_type,
        transactions.transaction_date,
        transactions.created_at,
        accounts.name AS account_name,
        accounts.deleted_at AS account_deleted_at,
        categories.name AS category_name
      FROM transactions
      JOIN accounts
        ON transactions.account_id = accounts.id
      LEFT JOIN categories
        ON transactions.category_id = categories.id
      WHERE accounts.user_id = $1
    `;

    if (accountId) {
      values.push(accountId);

      query += `
        AND transactions.account_id = $${values.length}
      `;
    }

    if (categoryId) {
      values.push(categoryId);

      query += `
        AND transactions.category_id = $${values.length}
      `;
    }

    if (type) {
      values.push(type);

      query += `
        AND transactions.transaction_type = $${values.length}
      `;
    }

    if (startDate) {
      values.push(startDate);

      query += `
        AND transactions.transaction_date >= $${values.length}
      `;
    }

    if (endDate) {
      values.push(endDate);

      query += `
        AND transactions.transaction_date <= $${values.length}
      `;
    }

    query += `
      ORDER BY transactions.transaction_date DESC,
               transactions.id DESC
    `;

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching transactions:", error);

    res.status(500).json({
      message: "Unable to retrieve transactions",
    });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      accountId,
      categoryId,
      description,
      amount,
      transactionType,
      transactionDate,
    } = req.body;

    if (
      !accountId ||
      !description ||
      !amount ||
      !transactionType ||
      !transactionDate
    ) {
      return res.status(400).json({
        message: "Required transaction fields are missing",
      });
    }

    const accountCheck = await pool.query(
      `SELECT id
        FROM accounts
        WHERE id = $1
        AND user_id = $2
        AND deleted_at IS NULL`,
        [accountId, userId]
    );

    if (accountCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    const result = await pool.query(
      `INSERT INTO transactions (
         account_id,
         category_id,
         description,
         amount,
         transaction_type,
         transaction_date
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        accountId,
        categoryId || null,
        description,
        amount,
        transactionType,
        transactionDate,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating transaction:", error);

    res.status(500).json({
      message: "Unable to create transaction",
    });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const transactionId = req.params.id;
    const userId = req.user.id;

    const {
      accountId,
      categoryId,
      description,
      amount,
      transactionType,
      transactionDate,
    } = req.body;

    if (
      !accountId ||
      !description ||
      !amount ||
      !transactionType ||
      !transactionDate
    ) {
      return res.status(400).json({
        message: "Required transaction fields are missing",
      });
    }

    const accountCheck = await pool.query(
      `SELECT id
        FROM accounts
        WHERE id = $1
        AND user_id = $2
        AND deleted_at IS NULL`,
      [accountId, userId],
    );

    if (accountCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    const result = await pool.query(
      `UPDATE transactions
       SET
         account_id = $1,
         category_id = $2,
         description = $3,
         amount = $4,
         transaction_type = $5,
         transaction_date = $6
       WHERE id = $7
       AND account_id IN (
         SELECT id
         FROM accounts
         WHERE user_id = $8
       )
       RETURNING *`,
      [
        accountId,
        categoryId || null,
        description,
        amount,
        transactionType,
        transactionDate,
        transactionId,
        userId,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating transaction:", error);

    res.status(500).json({
      message: "Unable to update transaction",
    });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const transactionId = req.params.id;
    const userId = req.user.id;
    const result = await pool.query(
      `DELETE FROM transactions
       WHERE id = $1
       AND account_id IN (
         SELECT id
         FROM accounts
         WHERE user_id = $2
       )
       RETURNING *`,
      [transactionId, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.json({
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting transaction:", error);

    res.status(500).json({
      message: "Unable to delete transaction",
    });
  }
};
