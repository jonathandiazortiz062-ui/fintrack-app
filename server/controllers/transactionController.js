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
  const client = await pool.connect();

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

    const allowedTransactionTypes = ["income", "expense"];

    if (!allowedTransactionTypes.includes(transactionType)) {
      return res.status(400).json({
        message: "Transaction type must be either income or expense",
      });
    }

    const dateCheck = await client.query(
      `SELECT $1::date <= CURRENT_DATE AS is_valid`,
      [transactionDate],
    );

    if (!dateCheck.rows[0].is_valid) {
      return res.status(400).json({
        message: "Transaction date cannot be in the future",
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        message: "Transaction amount must be greater than zero",
      });
    }

    await client.query("BEGIN");

    const accountCheck = await client.query(
      `SELECT id
       FROM accounts
       WHERE id = $1
       AND user_id = $2
       AND deleted_at IS NULL
       FOR UPDATE`,
      [accountId, userId],
    );

    if (accountCheck.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Account not found",
      });
    }

    const result = await client.query(
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

    const balanceChange =
      transactionType === "income"
        ? Number(amount)
        : -Number(amount);

    await client.query(
      `UPDATE accounts
       SET balance = balance + $1
       WHERE id = $2
       AND user_id = $3`,
      [balanceChange, accountId, userId],
    );

    await client.query("COMMIT");

    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error creating transaction:", error);

    res.status(500).json({
      message: "Unable to create transaction",
    });
  } finally {
    client.release();
  }
};

export const updateTransaction = async (req, res) => {
  const client = await pool.connect();

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

    const allowedTransactionTypes = ["income", "expense"];

    if (!allowedTransactionTypes.includes(transactionType)) {
      return res.status(400).json({
        message: "Transaction type must be either income or expense",
      });
    }

    const dateCheck = await client.query(
      `SELECT $1::date <= CURRENT_DATE AS is_valid`,
      [transactionDate],
    );

    if (!dateCheck.rows[0].is_valid) {
      return res.status(400).json({
        message: "Transaction date cannot be in the future",
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        message: "Transaction amount must be greater than zero",
      });
    }

    await client.query("BEGIN");

    // Get the existing transaction and verify ownership.
    const oldTransactionResult = await client.query(
      `SELECT
         transactions.id,
         transactions.account_id,
         transactions.amount,
         transactions.transaction_type
       FROM transactions
       JOIN accounts
         ON transactions.account_id = accounts.id
       WHERE transactions.id = $1
       AND accounts.user_id = $2
       FOR UPDATE`,
      [transactionId, userId],
    );

    if (oldTransactionResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    const oldTransaction = oldTransactionResult.rows[0];

    // Verify that the new account belongs to the user
    // and has not been archived.
    const accountCheck = await client.query(
      `SELECT id
       FROM accounts
       WHERE id = $1
       AND user_id = $2
       AND deleted_at IS NULL
       FOR UPDATE`,
      [accountId, userId],
    );

    if (accountCheck.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Account not found",
      });
    }

    // Reverse the OLD transaction's effect.
    const oldBalanceChange =
      oldTransaction.transaction_type === "expense"
        ? Number(oldTransaction.amount)
        : -Number(oldTransaction.amount);

    await client.query(
      `UPDATE accounts
       SET balance = balance + $1
       WHERE id = $2
       AND user_id = $3`,
      [oldBalanceChange, oldTransaction.account_id, userId],
    );

    // Update the transaction.
    const result = await client.query(
      `UPDATE transactions
       SET
         account_id = $1,
         category_id = $2,
         description = $3,
         amount = $4,
         transaction_type = $5,
         transaction_date = $6
       WHERE id = $7
       RETURNING *`,
      [
        accountId,
        categoryId || null,
        description,
        amount,
        transactionType,
        transactionDate,
        transactionId,
      ],
    );

    // Apply the NEW transaction's effect.
    const newBalanceChange =
      transactionType === "income"
        ? Number(amount)
        : -Number(amount);

    await client.query(
      `UPDATE accounts
       SET balance = balance + $1
       WHERE id = $2
       AND user_id = $3`,
      [newBalanceChange, accountId, userId],
    );

    await client.query("COMMIT");

    res.json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error updating transaction:", error);

    res.status(500).json({
      message: "Unable to update transaction",
    });
  } finally {
    client.release();
  }
};

export const deleteTransaction = async (req, res) => {
  const client = await pool.connect();

  try {
    const transactionId = req.params.id;
    const userId = req.user.id;

    await client.query("BEGIN");

    const transactionResult = await client.query(
      `SELECT
         transactions.id,
         transactions.account_id,
         transactions.amount,
         transactions.transaction_type
       FROM transactions
       JOIN accounts
         ON transactions.account_id = accounts.id
       WHERE transactions.id = $1
       AND accounts.user_id = $2
       FOR UPDATE`,
      [transactionId, userId],
    );

    if (transactionResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    const transaction = transactionResult.rows[0];

    const balanceChange =
      transaction.transaction_type === "expense"
        ? Number(transaction.amount)
        : -Number(transaction.amount);

    await client.query(
      `UPDATE accounts
       SET balance = balance + $1
       WHERE id = $2
       AND user_id = $3`,
      [balanceChange, transaction.account_id, userId],
    );

    await client.query(
      `DELETE FROM transactions
       WHERE id = $1`,
      [transactionId],
    );

    await client.query("COMMIT");

    res.json({
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error deleting transaction:", error);

    res.status(500).json({
      message: "Unable to delete transaction",
    });
  } finally {
    client.release();
  }
};
