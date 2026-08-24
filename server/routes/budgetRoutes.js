import express from 'express';
import {requireAuth} from '../middleware/authMiddleware.js';

import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget
} from '../controllers/budgetController.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', getBudgets);
router.post('/', createBudget);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;