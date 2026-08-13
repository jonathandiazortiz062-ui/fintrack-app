import pool from '../db/db.js';

export const getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM categories
       WHERE user_id = $1
       ORDER BY name`,
      [1]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);

    res.status(500).json({
      message: 'Unable to retrieve categories'
    });
  }
};