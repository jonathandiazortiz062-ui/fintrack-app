import pool from "../db/db.js";
import { fetchStockQuote } from "../services/marketService.js";

export const getDashboardSummary = async (req, res) => {
  try {
    const userId = 1;

    const balanceResult = await pool.query(
      `SELECT COALESCE(SUM(balance), 0) AS total_balance
       FROM accounts
       WHERE user_id = $1`,
      [userId],
    );

    const incomeResult = await pool.query(
      `SELECT COALESCE(SUM(transactions.amount), 0) AS monthly_income
       FROM transactions
       JOIN accounts
         ON transactions.account_id = accounts.id
       WHERE accounts.user_id = $1
       AND transactions.transaction_type = 'income'
       AND DATE_TRUNC('month', transactions.transaction_date)
           = DATE_TRUNC('month', CURRENT_DATE)`,
      [userId],
    );

    const expenseResult = await pool.query(
      `SELECT COALESCE(SUM(transactions.amount), 0) AS monthly_expenses
       FROM transactions
       JOIN accounts
         ON transactions.account_id = accounts.id
       WHERE accounts.user_id = $1
       AND transactions.transaction_type = 'expense'
       AND DATE_TRUNC('month', transactions.transaction_date)
           = DATE_TRUNC('month', CURRENT_DATE)`,
      [userId],
    );

    const investmentResult = await pool.query(
      `SELECT
        symbol,
        quantity
      FROM investments
      WHERE user_id = $1`,
      [userId],
    );

    const investmentValues = await Promise.all(
      investmentResult.rows.map(async (investment) => {
        try {
          const quote = await fetchStockQuote(investment.symbol);

          return Number(investment.quantity) * Number(quote.price);
        } catch (error) {
          console.error(
            `Unable to retrieve dashboard market data for ${investment.symbol}:`,
            error,
          );

          return 0;
        }
      }),
    );

    const totalInvestmentValue = investmentValues.reduce(
      (total, value) => total + value,
      0,
    );

    res.json({
      totalBalance: balanceResult.rows[0].total_balance,
      monthlyIncome: incomeResult.rows[0].monthly_income,
      monthlyExpenses: expenseResult.rows[0].monthly_expenses,
      totalInvestmentValue
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);

    res.status(500).json({
      message: "Unable to retrieve dashboard summary",
    });
  }
};
