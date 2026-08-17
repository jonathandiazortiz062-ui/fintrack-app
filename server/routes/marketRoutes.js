import express from 'express';

import {
  getStockQuote
} from '../controllers/marketController.js';

const router = express.Router();

router.get('/:symbol', getStockQuote);

export default router;