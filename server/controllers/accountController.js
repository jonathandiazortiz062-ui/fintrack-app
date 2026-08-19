import pool from '../db/db.js';

export const getAccounts = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM accounts WHERE user_id = $1 ORDER BY id',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching accounts:', error);

    res.status(500).json({
      message: 'Unable to retrieve accounts'
    });
  }
};

export const getAccountById = async (req, res) => {
  try {
    const accountId = req.params.id;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT *
       FROM accounts
       WHERE id = $1
       AND user_id = $2`,
      [accountId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Account not found'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching account:', error);

    res.status(500).json({
      message: 'Unable to retrieve account'
    });
  }
};

export const createAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, accountType, balance } = req.body;

    if (!name || !accountType) {
      return res.status(400).json({
        message: 'Name and account type are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO accounts (
        user_id,
        name,
        account_type,
        balance
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [
        userId,
        name,
        accountType,
        balance ?? 0
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating account:', error);

    res.status(500).json({
      message: 'Unable to create account'
    });
  }
};

export const updateAccount = async (req, res) => {
  try {
    const accountId = req.params.id;
    const userId = req.user.id;

    const {
      name,
      accountType,
      balance
    } = req.body;

    if (!name || !accountType) {
      return res.status(400).json({
        message: 'Name and account type are required'
      });
    }

    const result = await pool.query(
      `UPDATE accounts
       SET
         name = $1,
         account_type = $2,
         balance = $3
       WHERE id = $4
       AND user_id = $5
       RETURNING *`,
      [
        name,
        accountType,
        balance ?? 0,
        accountId,
        userId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Account not found'
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error updating account:', error);

    res.status(500).json({
      message: 'Unable to update account'
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const accountId = req.params.id;
    const userId = req.user.id;

    const result = await pool.query(
      `DELETE FROM accounts
       WHERE id = $1
       AND user_id = $2
       RETURNING *`,
      [
        accountId,
        userId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Account not found'
      });
    }

    res.json({
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting account:', error);

    res.status(500).json({
      message: 'Unable to delete account'
    });
  }
};