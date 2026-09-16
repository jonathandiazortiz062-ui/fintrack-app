import express from 'express';
import {
  logout,
  getCurrentUser,
  googleLogin
  
} from '../controllers/authController.js';
import { googleAuthLimiter } from "../middleware/authRateLimiter.js";

import { requireAuth } from '../middleware/authMiddleware.js';


const router = express.Router();

router.post('/logout', logout);
router.post("/google", googleLogin, googleAuthLimiter);
router.get('/me', requireAuth, getCurrentUser);

export default router;