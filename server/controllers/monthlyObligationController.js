import pool from "../db/db.js";

export const getMonthlyObligations = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT
        monthly_obligations.id,
        monthly_obligations.user_id,
        monthly_obligations.account_id,
        monthly_obligations.category_id,
        monthly_obligations.name,
        monthly_obligations.amount,
        monthly_obligations.transaction_type,
        monthly_obligations.due_date,
        monthly_obligations.is_completed,
        monthly_obligations.completed_at,
        monthly_obligations.created_at,
        accounts.name AS account_name,
        categories.name AS category_name
      FROM monthly_obligations
      JOIN accounts
        ON monthly_obligations.account_id = accounts.id
      LEFT JOIN categories
        ON monthly_obligations.category_id = categories.id
      WHERE monthly_obligations.user_id = $1
        AND monthly_obligations.due_date >= DATE_TRUNC('month', CURRENT_DATE)
        AND monthly_obligations.due_date <
          DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '2 months'
      ORDER BY
        monthly_obligations.due_date ASC,
        monthly_obligations.id ASC`,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching monthly obligations:", error);

    res.status(500).json({
      message: "Unable to retrieve monthly obligations",
    });
  }
};

//CRUD
export const createMonthlyObligation = async (req, res) => {
  const { accountId, categoryId, name, amount, transactionType, dueDate } =
    req.body;

  try {
    const userId = req.user.id;

    // Basic required-field validation
    if (!accountId || !name || !amount || !transactionType || !dueDate) {
      return res.status(400).json({
        message:
          "Account, name, amount, transaction type, and due date are required",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than zero",
      });
    }

    if (!["income", "expense"].includes(transactionType)) {
      return res.status(400).json({
        message: "Transaction type must be income or expense",
      });
    }

    // Make sure the selected account belongs to this user.
    const accountResult = await pool.query(
      `SELECT id
       FROM accounts
       WHERE id = $1
         AND user_id = $2`,
      [accountId, userId],
    );

    if (accountResult.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid account",
      });
    }

    // If a category was supplied, make sure it exists.
    if (categoryId) {
      const categoryResult = await pool.query(
        `SELECT id
         FROM categories
         WHERE id = $1`,
        [categoryId],
      );

      if (categoryResult.rows.length === 0) {
        return res.status(400).json({
          message: "Invalid category",
        });
      }
    }

    // Obligations may only be created for the current or next month.
    const dateResult = await pool.query(
      `SELECT
        $1::date >= DATE_TRUNC('month', CURRENT_DATE)::date
        AND
        $1::date < (
          DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '2 months'
        )::date
        AS is_valid`,
      [dueDate],
    );

    if (!dateResult.rows[0].is_valid) {
      return res.status(400).json({
        message: "Due date must be within the current month or next month",
      });
    }

    const result = await pool.query(
      `INSERT INTO monthly_obligations (
        user_id,
        account_id,
        category_id,
        name,
        amount,
        transaction_type,
        due_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        userId,
        accountId,
        categoryId || null,
        name.trim(),
        numericAmount,
        transactionType,
        dueDate,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating monthly obligation:", error);

    res.status(500).json({
      message: "Unable to create monthly obligation",
    });
  }
};

export const updateMonthlyObligation = async (req, res) => {
  const { id } = req.params;

  const { accountId, categoryId, name, amount, transactionType, dueDate } =
    req.body;

  try {
    const userId = req.user.id;

    if (!accountId || !name || !amount || !transactionType || !dueDate) {
      return res.status(400).json({
        message:
          "Account, name, amount, transaction type, and due date are required",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than zero",
      });
    }

    if (!["income", "expense"].includes(transactionType)) {
      return res.status(400).json({
        message: "Transaction type must be income or expense",
      });
    }

    // Make sure the obligation belongs to this user.
    const obligationResult = await pool.query(
      `SELECT id
       FROM monthly_obligations
       WHERE id = $1
         AND user_id = $2`,
      [id, userId],
    );

    if (obligationResult.rows.length === 0) {
      return res.status(404).json({
        message: "Monthly obligation not found",
      });
    }

    // Make sure the selected account belongs to this user.
    const accountResult = await pool.query(
      `SELECT id
       FROM accounts
       WHERE id = $1
         AND user_id = $2`,
      [accountId, userId],
    );

    if (accountResult.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid account",
      });
    }

    // Validate category when one is supplied.
    if (categoryId) {
      const categoryResult = await pool.query(
        `SELECT id
         FROM categories
         WHERE id = $1`,
        [categoryId],
      );

      if (categoryResult.rows.length === 0) {
        return res.status(400).json({
          message: "Invalid category",
        });
      }
    }

    // Updated due date must remain within the current/next-month window.
    const dateResult = await pool.query(
      `SELECT
        $1::date >= DATE_TRUNC('month', CURRENT_DATE)::date
        AND
        $1::date < (
          DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '2 months'
        )::date
        AS is_valid`,
      [dueDate],
    );

    if (!dateResult.rows[0].is_valid) {
      return res.status(400).json({
        message: "Due date must be within the current month or next month",
      });
    }

    const result = await pool.query(
      `UPDATE monthly_obligations
       SET
         account_id = $1,
         category_id = $2,
         name = $3,
         amount = $4,
         transaction_type = $5,
         due_date = $6
       WHERE id = $7
         AND user_id = $8
       RETURNING *`,
      [
        accountId,
        categoryId || null,
        name.trim(),
        numericAmount,
        transactionType,
        dueDate,
        id,
        userId,
      ],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating monthly obligation:", error);

    res.status(500).json({
      message: "Unable to update monthly obligation",
    });
  }
};

export const updateMonthlyObligationCompletion = async (req, res) => {
  const { id } = req.params;
  const { isCompleted } = req.body;

  try {
    const userId = req.user.id;

    if (typeof isCompleted !== "boolean") {
      return res.status(400).json({
        message: "isCompleted must be a boolean",
      });
    }

    const result = await pool.query(
      `UPDATE monthly_obligations
       SET
         is_completed = $1,
         completed_at = CASE
           WHEN $1 = TRUE THEN CURRENT_TIMESTAMP
           ELSE NULL
         END
       WHERE id = $2
         AND user_id = $3
       RETURNING *`,
      [isCompleted, id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Monthly obligation not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating monthly obligation completion:", error);

    res.status(500).json({
      message: "Unable to update monthly obligation completion",
    });
  }
};

export const deleteMonthlyObligation = async (req, res) => {
  const { id } = req.params;

  try {
    const userId = req.user.id;

    const result = await pool.query(
      `DELETE FROM monthly_obligations
       WHERE id = $1
         AND user_id = $2
       RETURNING *`,
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Monthly obligation not found",
      });
    }

    res.json({
      message: "Monthly obligation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting monthly obligation:", error);

    res.status(500).json({
      message: "Unable to delete monthly obligation",
    });
  }
};

//Other functionality related to monthly obligations can be added here:
export const copyMonthlyObligationsToNextMonth = async (req, res) => {
  try {
    const userId = req.user.id;

    // Do not overwrite or duplicate an existing next-month plan.
    const nextMonthResult = await pool.query(
      `SELECT id
       FROM monthly_obligations
       WHERE user_id = $1
         AND due_date >=
           DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
         AND due_date <
           DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '2 months'
       LIMIT 1`,
      [userId],
    );

    if (nextMonthResult.rows.length > 0) {
      return res.status(409).json({
        message: "Next month already contains obligations",
      });
    }

    /*
     * Copy current-month obligations into next month.
     *
     * LEAST(original day, last day of next month)
     * handles dates such as January 31 -> February 28/29.
     */
    const result = await pool.query(
      `INSERT INTO monthly_obligations (
        user_id,
        account_id,
        category_id,
        name,
        amount,
        transaction_type,
        due_date,
        is_completed,
        completed_at
      )
      SELECT
        user_id,
        account_id,
        category_id,
        name,
        amount,
        transaction_type,

        (
          DATE_TRUNC('month', CURRENT_DATE)
          + INTERVAL '1 month'
          + (
              LEAST(
                EXTRACT(DAY FROM due_date)::int,
                EXTRACT(
                  DAY FROM (
                    DATE_TRUNC('month', CURRENT_DATE)
                    + INTERVAL '2 months'
                    - INTERVAL '1 day'
                  )
                )::int
              ) - 1
            ) * INTERVAL '1 day'
        )::date,

        FALSE,
        NULL
      FROM monthly_obligations
      WHERE user_id = $1
        AND due_date >= DATE_TRUNC('month', CURRENT_DATE)
        AND due_date <
          DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
      RETURNING *`,
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Current month has no obligations to copy",
      });
    }

    res.status(201).json(result.rows);
  } catch (error) {
    console.error(
      "Error copying monthly obligations to next month:",
      error,
    );

    res.status(500).json({
      message: "Unable to copy monthly obligations to next month",
    });
  }
};
