import pool from '../db/db.js';

export const getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM categories
       ORDER BY name`
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching categories:', error);

    res.status(500).json({
      message: 'Unable to retrieve categories'
    });
  }
};