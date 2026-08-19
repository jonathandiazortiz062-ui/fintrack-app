import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';

import {
  getTransactions, createTransaction, updateTransaction, deleteTransaction
} from '../controllers/transactionController.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', getTransactions);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;