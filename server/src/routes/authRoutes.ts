import { Router } from 'express';
import { register, login, getMe, getAllUsers } from '../controllers/authController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken as any, getMe as any);
router.get('/users', authenticateToken as any, requireAdmin as any, getAllUsers as any);

export default router;
