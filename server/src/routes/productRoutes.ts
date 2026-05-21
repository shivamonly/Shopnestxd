import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getProducts as any);
router.get('/:id', getProductById as any);

// Admin routes
router.post('/', authenticateToken as any, requireAdmin as any, createProduct as any);
router.put('/:id', authenticateToken as any, requireAdmin as any, updateProduct as any);
router.delete('/:id', authenticateToken as any, requireAdmin as any, deleteProduct as any);

export default router;
