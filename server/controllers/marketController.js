import { fetchStockQuote } from '../services/marketService.js';

export const getStockQuote = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();

    const quote = await fetchStockQuote(symbol);

    res.json(quote);
    
  } catch (error) {
    console.error("Error fetching market quote:", error);

    res.status(500).json({
      message: "Unable to retrieve market quote",
    });
  }
};
