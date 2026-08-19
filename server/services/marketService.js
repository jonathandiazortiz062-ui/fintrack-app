const quoteCache = new Map();
const CACHE_DURATION = 12 * 60 * 60 * 1000;

export const fetchStockQuote = async (symbol) => {
  const normalizedSymbol = symbol.toUpperCase();

  const cachedQuote = quoteCache.get(normalizedSymbol);

  if (
    cachedQuote &&
    Date.now() - cachedQuote.timestamp < CACHE_DURATION
  ) {
    
    return cachedQuote.data;
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  const url =
    `https://www.alphavantage.co/query` +
    `?function=GLOBAL_QUOTE` +
    `&symbol=${encodeURIComponent(normalizedSymbol)}` +
    `&apikey=${apiKey}`;

  
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Market API request failed');
  }

  const data = await response.json();

  const quote = data['Global Quote'];

  if (!quote || !quote['05. price']) {
    throw new Error(
      `Market data unavailable for ${normalizedSymbol}`
    );
  }

  const normalizedQuote = {
    symbol: quote['01. symbol'],
    open: Number(quote['02. open']),
    high: Number(quote['03. high']),
    low: Number(quote['04. low']),
    price: Number(quote['05. price']),
    volume: Number(quote['06. volume']),
    latestTradingDay: quote['07. latest trading day'],
    previousClose: Number(quote['08. previous close']),
    change: Number(quote['09. change']),
    changePercent: quote['10. change percent']
  };

  quoteCache.set(normalizedSymbol, {
    data: normalizedQuote,
    timestamp: Date.now()
  });

  
  return normalizedQuote;
};