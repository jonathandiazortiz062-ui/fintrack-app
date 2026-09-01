import pool from "../db/db.js";

export const getBudgets = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT
        budgets.id,
        budgets.user_id,
        budgets.category_id,
        categories.name AS category_name,
        budgets.monthly_limit,
        budgets.created_at,

        COALESCE(
          SUM(
            CASE
              WHEN transactions.transaction_type = 'expense'
              AND accounts.id IS NOT NULL
              AND DATE_TRUNC('month', transactions.transaction_date)
                  = DATE_TRUNC('month', CURRENT_DATE)
              THEN transactions.amount
              ELSE 0
            END
          ),
          0
        ) AS amount_spent

      FROM budgets

      JOIN categories
        ON budgets.category_id = categories.id

      LEFT JOIN transactions
        ON transactions.category_id = budgets.category_id

      LEFT JOIN accounts
        ON transactions.account_id = accounts.id
        AND accounts.user_id = budgets.user_id

      WHERE budgets.user_id = $1

      GROUP BY
        budgets.id,
        budgets.user_id,
        budgets.category_id,
        categories.name,
        budgets.monthly_limit,
        budgets.created_at

      ORDER BY categories.name`,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching budgets:", error);

    res.status(500).json({
      message: "Unable to retrieve budgets",
    });
  }
};

//CRUD:
export const createBudget = async (req, res) => {
  try {
    const userId = req.user.id;

    const { categoryId, monthlyLimit } = req.body;

    if (!categoryId || !monthlyLimit) {
      return res.status(400).json({
        message: "Category and monthly limit are required",
      });
    }

    const categoryCheck = await pool.query(
      `SELECT id
       FROM categories
       WHERE id = $1`,
      [categoryId],
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    const numericMonthlyLimit = Number(monthlyLimit);

    if (Number.isNaN(numericMonthlyLimit) || numericMonthlyLimit <= 0) {
      return res.status(400).json({
        message: "Monthly limit must be a valid number greater than zero",
      });
    }

    const result = await pool.query(
      `INSERT INTO budgets (
        user_id,
        category_id,
        monthly_limit
      )
      VALUES ($1, $2, $3)
      RETURNING *`,
      [userId, categoryId, numericMonthlyLimit],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating budget:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "A budget already exists for this category",
      });
    }

    res.status(500).json({
      message: "Unable to create budget",
    });
  }
};

export const updateBudget = async (req, res) => {
  try {
    const userId = req.user.id;
    const budgetId = req.params.id;

    const { categoryId, monthlyLimit } = req.body;

    if (!categoryId || !monthlyLimit) {
      return res.status(400).json({
        message: "Category and monthly limit are required",
      });
    }

    const categoryCheck = await pool.query(
      `SELECT id
       FROM categories
       WHERE id = $1`,
      [categoryId],
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    const numericMonthlyLimit = Number(monthlyLimit);

    if (Number.isNaN(numericMonthlyLimit) || numericMonthlyLimit <= 0) {
      return res.status(400).json({
        message: "Monthly limit must be a valid number greater than zero",
      });
    }

    const result = await pool.query(
      `UPDATE budgets
       SET
         category_id = $1,
         monthly_limit = $2
       WHERE id = $3
       AND user_id = $4
       RETURNING *`,
      [categoryId, numericMonthlyLimit, budgetId, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Budget not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating budget:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "A budget already exists for this category",
      });
    }

    res.status(500).json({
      message: "Unable to update budget",
    });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const userId = req.user.id;
    const budgetId = req.params.id;

    const result = await pool.query(
      `DELETE FROM budgets
       WHERE id = $1
       AND user_id = $2
       RETURNING *`,
      [budgetId, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Budget not found",
      });
    }

    res.json({
      message: "Budget deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting budget:", error);

    res.status(500).json({
      message: "Unable to delete budget",
    });
  }
};
