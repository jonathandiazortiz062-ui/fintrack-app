import express from 'express';
import {requireAuth} from '../middleware/authMiddleware.js';

import {
  getCategories
} from '../controllers/categoryController.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', getCategories);
export default router;