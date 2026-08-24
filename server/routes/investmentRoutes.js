import express from 'express';
import {requireAuth} from '../middleware/authMiddleware.js';
import {
  getInvestments,
  createInvestment,
  updateInvestment,
  deleteInvestment
} from '../controllers/investmentController.js';


const router = express.Router();
router.use(requireAuth);

router.get('/', getInvestments);
router.post('/', createInvestment);
router.put('/:id', updateInvestment);
router.delete('/:id', deleteInvestment);

export default router;