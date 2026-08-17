import express from 'express';

import {
  getInvestments,
  createInvestment,
  updateInvestment,
  deleteInvestment
} from '../controllers/investmentController.js';

const router = express.Router();

router.get('/', getInvestments);
router.post('/', createInvestment);
router.put('/:id', updateInvestment);
router.delete('/:id', deleteInvestment);

export default router;