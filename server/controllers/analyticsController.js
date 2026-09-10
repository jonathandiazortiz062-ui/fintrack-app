import pool from "../db/db.js";

export const getMonthlyIncomeExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const values = [userId];

    let query = `
      SELECT
        TO_CHAR(
          DATE_TRUNC('month', transactions.transaction_date),
          'YYYY-MM'
        ) AS month,

        COALESCE(
          SUM(
            CASE
              WHEN transactions.transaction_type = 'income'
              THEN transactions.amount
              ELSE 0
            END
          ),
          0
        ) AS income,

        COALESCE(
          SUM(
            CASE
              WHEN transactions.transaction_type = 'expense'
              THEN transactions.amount
              ELSE 0
            END
          ),
          0
        ) AS expenses

      FROM transactions

      JOIN accounts
        ON transactions.account_id = accounts.id

      WHERE accounts.user_id = $1
    `;

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
      GROUP BY DATE_TRUNC('month', transactions.transaction_date)
      ORDER BY DATE_TRUNC('month', transactions.transaction_date) ASC
    `;

    const result = await pool.query(query, values);

    const analytics = result.rows.map((row) => ({
      month: row.month,
      income: Number(row.income),
      expenses: Number(row.expenses),
    }));

    res.json(analytics);
  } catch (error) {
    console.error("Error fetching monthly income and expenses:", error);

    res.status(500).json({
      message: "Unable to retrieve monthly income and expenses",
    });
  }
};

export const getExpensesByCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const values = [userId];

    let query = `
      SELECT
        categories.id AS category_id,
        COALESCE(categories.name, 'Uncategorized') AS category,
        SUM(transactions.amount) AS expenses

      FROM transactions

      JOIN accounts
        ON transactions.account_id = accounts.id

      LEFT JOIN categories
        ON transactions.category_id = categories.id

      WHERE accounts.user_id = $1
        AND transactions.transaction_type = 'expense'
    `;

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
      GROUP BY categories.id, categories.name
      ORDER BY expenses DESC
    `;

    const result = await pool.query(query, values);

    const analytics = result.rows.map((row) => ({
      categoryId: row.category_id,
      category: row.category,
      expenses: Number(row.expenses),
    }));

    res.json(analytics);
  } catch (error) {
    console.error("Error fetching expenses by category:", error);

    res.status(500).json({
      message: "Unable to retrieve expenses by category",
    });
  }
};