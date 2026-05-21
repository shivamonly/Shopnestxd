import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB, isConnectedToMongo } from './db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for local development simplicity
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Health Check / API info endpoint
app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    message: 'Simple E-Commerce Store API is running',
    database: isConnectedToMongo ? 'MongoDB Atlas' : 'Local File JSON DB',
    timestamp: new Date().toISOString(),
  });
});

// Serve static assets in production (if applicable)
// Currently, frontend is running on a separate Vite server.

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Connect to database and then boot server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`Backend server running on port: ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}/api`);
      console.log(`Database backend: ${isConnectedToMongo ? 'MongoDB' : 'Local JSON'}`);
      console.log(`=========================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
