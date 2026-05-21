import dotenv from 'dotenv';
import { connectDB, db } from './db.js';
import type { IProduct } from './db.js';

dotenv.config();

const INITIAL_PRODUCTS: Omit<IProduct, 'id' | 'createdAt'>[] = [
  {
    name: 'AcousticMax Wireless Headphones',
    description: 'Experience studio-quality sound with active noise cancellation, 40-hour battery life, and ultra-comfortable memory foam earcups.',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60',
    stock: 15,
    category: 'Audio',
  },
  {
    name: 'AeroSync Smart Watch Pro',
    description: 'Stay connected with a vibrant AMOLED display, blood oxygen tracking, built-in GPS, and up to 10 days of battery life.',
    price: 249.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
    stock: 25,
    category: 'Wearables',
  },
  {
    name: 'Velocity-X Running Sneakers',
    description: 'Designed for peak performance, featuring a responsive foam midsole, breathable mesh upper, and high-traction rubber outsole.',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60',
    stock: 30,
    category: 'Fitness & Apparel',
  },
  {
    name: 'KeyForge Mechanical Keyboard',
    description: 'Tactile mechanical switch keyboard with customizable RGB backlighting, durable double-shot PBT keycaps, and a solid aluminum top plate.',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60',
    stock: 10,
    category: 'Tech Accessories',
  },
  {
    name: 'Nomad Canvas Backpack',
    description: 'Water-resistant travel companion featuring a padded 16-inch laptop compartment, hidden security pockets, and ergonomic shoulder straps.',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=60',
    stock: 19,
    category: 'Fitness & Apparel',
  },
  {
    name: 'Lumina Minimalist Desk Lamp',
    description: 'Sleek brushed-metal LED lamp offering adjustable color temperatures, step-less brightness touch slider, and a built-in USB charging port.',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=60',
    stock: 18,
    category: 'Home & Living',
  },
  {
    name: 'Apex Smart Home Assistant',
    description: 'Voice-controlled smart speaker with rich 360-degree audio, integrated smart home controller hub, and absolute privacy controls.',
    price: 119.99,
    image: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=500&auto=format&fit=crop&q=60',
    stock: 12,
    category: 'Tech Accessories',
  },
  {
    name: 'PureHydrate Insulated Flask',
    description: 'Double-walled stainless steel water bottle keeping drinks ice cold for 24 hours or piping hot for 12. Leakproof straw lid included.',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=60',
    stock: 50,
    category: 'Home & Living',
  },
];

const seed = async () => {
  console.log('Starting product database seeding...');
  await connectDB();

  try {
    const formattedProducts: IProduct[] = INITIAL_PRODUCTS.map((prod, idx) => ({
      ...prod,
      id: Math.random().toString(36).substring(2, 15) + idx,
      createdAt: new Date().toISOString(),
    }));

    await db.products.saveAll(formattedProducts);
    console.log(`Successfully seeded ${formattedProducts.length} products!`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding products failed:', err);
    process.exit(1);
  }
};

seed();
