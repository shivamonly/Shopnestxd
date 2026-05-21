import type { Response } from 'express';
import { db } from '../db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export const getProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;

    const filters: { search?: string; category?: string } = {};
    if (search) filters.search = search;
    if (category) filters.category = category;

    const list = await db.products.findAll(filters);
    res.json(list);
  } catch (err: any) {
    console.error('Fetch products error:', err);
    res.status(500).json({ message: 'Server product retrieval error', error: err.message });
  }
};

export const getProductById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!id) {
      res.status(400).json({ message: 'Product ID is required' });
      return;
    }

    const product = await db.products.findById(id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.json(product);
  } catch (err: any) {
    console.error('Fetch product by ID error:', err);
    res.status(500).json({ message: 'Server product retrieval error', error: err.message });
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, description, price, image, stock, category } = req.body;

    if (!name || !description || price === undefined || !image || stock === undefined) {
      res.status(400).json({ message: 'Name, description, price, image, and stock are required' });
      return;
    }

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      res.status(400).json({ message: 'Price must be a valid non-negative number' });
      return;
    }

    if (isNaN(parsedStock) || parsedStock < 0) {
      res.status(400).json({ message: 'Stock must be a valid non-negative integer' });
      return;
    }

    const newProduct = await db.products.create({
      name,
      description,
      price: parsedPrice,
      image,
      stock: parsedStock,
      category: category || 'General',
    });

    res.status(201).json(newProduct);
  } catch (err: any) {
    console.error('Create product error:', err);
    res.status(500).json({ message: 'Server product creation error', error: err.message });
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!id) {
      res.status(400).json({ message: 'Product ID is required' });
      return;
    }

    const { name, description, price, image, stock, category } = req.body;
    const updates: any = {};

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (image !== undefined) updates.image = image;

    if (price !== undefined) {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        res.status(400).json({ message: 'Price must be a valid non-negative number' });
        return;
      }
      updates.price = parsedPrice;
    }

    if (stock !== undefined) {
      const parsedStock = parseInt(stock, 10);
      if (isNaN(parsedStock) || parsedStock < 0) {
        res.status(400).json({ message: 'Stock must be a valid non-negative integer' });
        return;
      }
      updates.stock = parsedStock;
    }

    const updated = await db.products.update(id, updates);
    if (!updated) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.json(updated);
  } catch (err: any) {
    console.error('Update product error:', err);
    res.status(500).json({ message: 'Server product update error', error: err.message });
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!id) {
      res.status(400).json({ message: 'Product ID is required' });
      return;
    }

    const deleted = await db.products.delete(id);
    if (!deleted) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.json({ message: 'Product successfully deleted' });
  } catch (err: any) {
    console.error('Delete product error:', err);
    res.status(500).json({ message: 'Server product deletion error', error: err.message });
  }
};
