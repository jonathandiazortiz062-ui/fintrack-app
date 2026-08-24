import express from 'express';
import {requireAuth} from '../middleware/authMiddleware.js';

import {
  getDashboardSummary
} from '../controllers/dashboardController.js';

const router = express.Router();
router.use(requireAuth);

router.get('/summary', getDashboardSummary);

export default router;