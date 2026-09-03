import pool from "../db/db.js";
import { fetchStockQuote } from "../services/marketService.js";

//Validation:
const validateTickerSymbol = async (symbol) => {
  const normalizedSymbol = symbol.trim().toUpperCase();

  const url =
    `https://www.alphavantage.co/query` +
    `?function=GLOBAL_QUOTE` +
    `&symbol=${encodeURIComponent(normalizedSymbol)}` +
    `&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("MARKET_DATA_UNAVAILABLE");
  }

  const data = await response.json();

  // Alpha Vantage may return these when the request
  // cannot be processed normally.
  if (data.Note || data.Information || data["Error Message"]) {
    throw new Error("MARKET_DATA_UNAVAILABLE");
  }

  const quote = data["Global Quote"];

  const isValid = quote && Object.keys(quote).length > 0 && quote["01. symbol"];

  return {
    isValid: Boolean(isValid),
    symbol: normalizedSymbol,
  };
};

export const getInvestments = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT
        id,
        user_id,
        symbol,
        quantity,
        purchase_price,
        created_at
       FROM investments
       WHERE user_id = $1
       ORDER BY symbol`,
      [userId],
    );

    const investmentsWithMarketData = await Promise.all(
      result.rows.map(async (investment) => {
        try {
          const quote = await fetchStockQuote(investment.symbol);

          const quantity = Number(investment.quantity);
          const purchasePrice = Number(investment.purchase_price);
          const currentPrice = quote.price;

          const costBasis = quantity * purchasePrice;
          const currentValue = quantity * currentPrice;
          const gainLoss = currentValue - costBasis;

          const gainLossPercent =
            costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

          return {
            ...investment,
            current_price: currentPrice,
            cost_basis: costBasis,
            current_value: currentValue,
            gain_loss: gainLoss,
            gain_loss_percent: gainLossPercent,
            latest_trading_day: quote.latestTradingDay,
            market_data_available: true,
          };
        } catch (error) {
          console.error(
            `Unable to retrieve market data for ${investment.symbol}:`,
            error,
          );

          const quantity = Number(investment.quantity);
          const purchasePrice = Number(investment.purchase_price);

          return {
            ...investment,
            current_price: null,
            cost_basis: quantity * purchasePrice,
            current_value: null,
            gain_loss: null,
            gain_loss_percent: null,
            latest_trading_day: null,
            market_data_available: false,
          };
        }
      }),
    );

    res.json(investmentsWithMarketData);
  } catch (error) {
    console.error("Error fetching investments:", error);

    res.status(500).json({
      message: "Unable to retrieve investments",
    });
  }
};

//CRUD:
export const createInvestment = async (req, res) => {
  try {
    const { symbol, quantity, purchasePrice } = req.body;
    const userId = req.user.id;

    if (!symbol || !quantity || !purchasePrice) {
      return res.status(400).json({
        message: "Symbol, quantity, and purchase price are required",
      });
    }

    const numericQuantity = Number(quantity);
    const numericPurchasePrice = Number(purchasePrice);

    if (
      Number.isNaN(numericQuantity) ||
      Number.isNaN(numericPurchasePrice) ||
      numericQuantity <= 0 ||
      numericPurchasePrice <= 0
    ) {
      return res.status(400).json({
        message: "Quantity and purchase price must be greater than zero",
      });
    }

    const tickerValidation = await validateTickerSymbol(symbol);

    if (!tickerValidation.isValid) {
      return res.status(400).json({
        message: "Invalid stock symbol",
      });
    }

    const result = await pool.query(
      `INSERT INTO investments (
        user_id,
        symbol,
        quantity,
        purchase_price
       )
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, tickerValidation.symbol, numericQuantity, numericPurchasePrice],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating investment:", error);

    if (error.message === "MARKET_DATA_UNAVAILABLE") {
      return res.status(503).json({
        message: "Unable to validate stock symbol. Please try again later.",
      });
    }

    res.status(500).json({
      message: "Unable to create investment",
    });
  }
};

export const updateInvestment = async (req, res) => {
  try {
    const investmentId = req.params.id;
    const userId = req.user.id;

    const { symbol, quantity, purchasePrice } = req.body;

    if (!symbol || !quantity || !purchasePrice) {
      return res.status(400).json({
        message: "Symbol, quantity, and purchase price are required",
      });
    }

    const numericQuantity = Number(quantity);
    const numericPurchasePrice = Number(purchasePrice);

    if (
      Number.isNaN(numericQuantity) ||
      Number.isNaN(numericPurchasePrice) ||
      numericQuantity <= 0 ||
      numericPurchasePrice <= 0
    ) {
      return res.status(400).json({
        message: "Quantity and purchase price must be greater than zero",
      });
    }
    const tickerValidation = await validateTickerSymbol(symbol);

    if (!tickerValidation.isValid) {
      return res.status(400).json({
        message: "Invalid stock symbol",
      });
    }

    const result = await pool.query(
      `UPDATE investments
       SET
         symbol = $1,
         quantity = $2,
         purchase_price = $3
       WHERE id = $4
       AND user_id = $5
       RETURNING *`,
      [
        tickerValidation.symbol,
        numericQuantity,
        numericPurchasePrice,
        investmentId,
        userId,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Investment not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating investment:", error);

    if (error.message === "MARKET_DATA_UNAVAILABLE") {
      return res.status(503).json({
        message: "Unable to validate stock symbol. Please try again later.",
      });
    }

    res.status(500).json({
      message: "Unable to update investment",
    });
  }
};

export const deleteInvestment = async (req, res) => {
  try {
    const investmentId = req.params.id;
    const userId = req.user.id;

    const result = await pool.query(
      `DELETE FROM investments
       WHERE id = $1
       AND user_id = $2
       RETURNING *`,
      [investmentId, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Investment not found",
      });
    }

    res.json({
      message: "Investment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting investment:", error);

    res.status(500).json({
      message: "Unable to delete investment",
    });
  }
};
