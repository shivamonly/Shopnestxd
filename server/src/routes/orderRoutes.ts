import { Router } from 'express';
import {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Protected user routes
router.post('/', authenticateToken as any, createOrder as any);
router.get('/user', authenticateToken as any, getUserOrders as any);

// Admin-only routes
router.get('/', authenticateToken as any, requireAdmin as any, getAllOrders as any);
router.put('/:id/status', authenticateToken as any, requireAdmin as any, updateOrderStatus as any);

export default router;
