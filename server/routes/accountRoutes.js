import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';

import {
  getAccounts, getAccountById, createAccount, updateAccount, deleteAccount
} from '../controllers/accountController.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', getAccounts);
router.get('/:id', getAccountById);
router.post('/', createAccount);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);
export default router;