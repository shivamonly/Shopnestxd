import type { Response } from 'express';
import { db } from '../db.js';
import type { IOrderProduct } from '../db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export const createOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { products, shippingAddress } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      res.status(400).json({ message: 'Cart products are required to place an order' });
      return;
    }

    if (!shippingAddress || !shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
      res.status(400).json({ message: 'Valid shipping address is required' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Verify stock and compute total
    const orderedItems: IOrderProduct[] = [];
    let totalAmount = 0;

    for (const item of products) {
      const { id, quantity } = item;
      if (!id || !quantity || quantity <= 0) {
        res.status(400).json({ message: 'Invalid product or quantity specified' });
        return;
      }

      const dbProduct = await db.products.findById(id);
      if (!dbProduct) {
        res.status(404).json({ message: `Product with ID ${id} not found` });
        return;
      }

      if (dbProduct.stock < quantity) {
        res.status(400).json({ message: `Insufficient stock for product "${dbProduct.name}". Available: ${dbProduct.stock}` });
        return;
      }

      orderedItems.push({
        id: dbProduct.id,
        name: dbProduct.name,
        price: dbProduct.price,
        image: dbProduct.image,
        quantity,
      });

      totalAmount += dbProduct.price * quantity;
    }

    // Deduct stock
    for (const item of products) {
      const dbProduct = await db.products.findById(item.id);
      if (dbProduct) {
        const newStock = dbProduct.stock - item.quantity;
        await db.products.update(item.id, { stock: newStock });
      }
    }

    const order = await db.orders.create({
      userId: req.user.id,
      products: orderedItems,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      shippingAddress,
    });

    res.status(201).json(order);
  } catch (err: any) {
    console.error('Create order error:', err);
    res.status(500).json({ message: 'Server order creation error', error: err.message });
  }
};

export const getUserOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const orders = await db.orders.findByUserId(req.user.id);
    res.json(orders);
  } catch (err: any) {
    console.error('Fetch user orders error:', err);
    res.status(500).json({ message: 'Server order history retrieval error', error: err.message });
  }
};

export const getAllOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orders = await db.orders.findAll();
    res.json(orders);
  } catch (err: any) {
    console.error('Fetch all orders error:', err);
    res.status(500).json({ message: 'Server orders retrieval error', error: err.message });
  }
};

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!id || !status) {
      res.status(400).json({ message: 'Order ID and status are required' });
      return;
    }

    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: 'Invalid status value' });
      return;
    }

    const currentOrder = await db.orders.findAll();
    const targetOrder = currentOrder.find(o => o.id === id);

    if (!targetOrder) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // If order is cancelled from a different state, restore stock
    if (status === 'Cancelled' && targetOrder.status !== 'Cancelled') {
      for (const item of targetOrder.products) {
        const dbProduct = await db.products.findById(item.id);
        if (dbProduct) {
          const restoredStock = dbProduct.stock + item.quantity;
          await db.products.update(item.id, { stock: restoredStock });
        }
      }
    } 
    // If order was cancelled and is now being un-cancelled/restored, re-deduct stock
    else if (targetOrder.status === 'Cancelled' && status !== 'Cancelled') {
      // Check stock first
      for (const item of targetOrder.products) {
        const dbProduct = await db.products.findById(item.id);
        if (!dbProduct || dbProduct.stock < item.quantity) {
          res.status(400).json({ message: `Insufficient stock to restore order for product "${dbProduct?.name || item.name}"` });
          return;
        }
      }
      // Deduct stock
      for (const item of targetOrder.products) {
        const dbProduct = await db.products.findById(item.id);
        if (dbProduct) {
          const deductedStock = dbProduct.stock - item.quantity;
          await db.products.update(item.id, { stock: deductedStock });
        }
      }
    }

    const updated = await db.orders.updateStatus(id, status as any);
    res.json(updated);
  } catch (err: any) {
    console.error('Update order status error:', err);
    res.status(500).json({ message: 'Server order update error', error: err.message });
  }
};
