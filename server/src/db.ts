import fs from 'fs';
import path from 'path';
import mongoose, { Schema, Document } from 'mongoose';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- TS Interfaces ---
export interface IUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface IProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  category: string;
  createdAt: string;
}

export interface IOrderProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface IOrder {
  id: string;
  userId: string;
  products: IOrderProduct[];
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingAddress: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
}

// --- MongoDB Schemas (for Mongoose fallback) ---
const MongoUserSchema = new Schema<IUser & Document>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

const MongoProductSchema = new Schema<IProduct & Document>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  category: { type: String, required: true, default: 'General' },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

const MongoOrderSchema = new Schema<IOrder & Document>({
  userId: { type: String, required: true },
  products: [
    {
      id: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      image: { type: String, required: true },
      quantity: { type: Number, required: true },
    },
  ],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  shippingAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

// Configure Mongoose to serialize _id as id
const cleanIdOption = {
  toJSON: {
    transform: (doc: any, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
};
MongoUserSchema.set('toJSON', cleanIdOption.toJSON);
MongoProductSchema.set('toJSON', cleanIdOption.toJSON);
MongoOrderSchema.set('toJSON', cleanIdOption.toJSON);

let UserModel: mongoose.Model<IUser & Document>;
let ProductModel: mongoose.Model<IProduct & Document>;
let OrderModel: mongoose.Model<IOrder & Document>;

// --- Local File DB Implementation ---
const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const readJSONFile = <T>(filePath: string, defaultVal: T): T => {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2));
      return defaultVal;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return defaultVal;
  }
};

const writeJSONFile = <T>(filePath: string, data: T): void => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing file ${filePath}:`, err);
  }
};

// Generate random ID for JSON file DB
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// DB State
export let isConnectedToMongo = false;

export const connectDB = async (): Promise<boolean> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('No MONGODB_URI found. Initializing Local File-based JSON Database.');
    isConnectedToMongo = false;
    return false;
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB successfully via Mongoose.');
    UserModel = mongoose.model<IUser & Document>('User', MongoUserSchema);
    ProductModel = mongoose.model<IProduct & Document>('Product', MongoProductSchema);
    OrderModel = mongoose.model<IOrder & Document>('Order', MongoOrderSchema);
    isConnectedToMongo = true;
    return true;
  } catch (err) {
    console.error('Failed to connect to MongoDB. Falling back to Local JSON database.', err);
    isConnectedToMongo = false;
    return false;
  }
};

// --- Unified Database Interface ---
export const db = {
  users: {
    async findByEmail(email: string): Promise<IUser | null> {
      if (isConnectedToMongo) {
        const user = await UserModel.findOne({ email });
        return user ? (user.toJSON() as IUser) : null;
      } else {
        const users = readJSONFile<IUser[]>(USERS_FILE, []);
        const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        return found || null;
      }
    },

    async findById(id: string): Promise<IUser | null> {
      if (isConnectedToMongo) {
        const user = await UserModel.findById(id);
        return user ? (user.toJSON() as IUser) : null;
      } else {
        const users = readJSONFile<IUser[]>(USERS_FILE, []);
        const found = users.find((u) => u.id === id);
        return found || null;
      }
    },

    async create(user: Omit<IUser, 'id' | 'createdAt'>): Promise<IUser> {
      if (isConnectedToMongo) {
        const created = await UserModel.create({
          ...user,
        });
        return created.toJSON() as IUser;
      } else {
        const users = readJSONFile<IUser[]>(USERS_FILE, []);
        const newUser: IUser = {
          ...user,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        users.push(newUser);
        writeJSONFile(USERS_FILE, users);
        return newUser;
      }
    },

    async findAll(): Promise<IUser[]> {
      if (isConnectedToMongo) {
        const users = await UserModel.find({});
        return users.map((u) => u.toJSON() as IUser);
      } else {
        return readJSONFile<IUser[]>(USERS_FILE, []);
      }
    },
  },

  products: {
    async findAll(filters?: { search?: string; category?: string }): Promise<IProduct[]> {
      if (isConnectedToMongo) {
        const query: any = {};
        if (filters?.search) {
          query.$or = [
            { name: { $regex: filters.search, $options: 'i' } },
            { description: { $regex: filters.search, $options: 'i' } },
          ];
        }
        if (filters?.category && filters.category !== 'All') {
          query.category = filters.category;
        }
        const list = await ProductModel.find(query);
        return list.map((p) => p.toJSON() as IProduct);
      } else {
        let products = readJSONFile<IProduct[]>(PRODUCTS_FILE, []);
        if (filters?.search) {
          const searchLower = filters.search.toLowerCase();
          products = products.filter(
            (p) => p.name.toLowerCase().includes(searchLower) || p.description.toLowerCase().includes(searchLower)
          );
        }
        if (filters?.category && filters.category !== 'All') {
          products = products.filter((p) => p.category === filters.category);
        }
        return products;
      }
    },

    async findById(id: string): Promise<IProduct | null> {
      if (isConnectedToMongo) {
        try {
          const product = await ProductModel.findById(id);
          return product ? (product.toJSON() as IProduct) : null;
        } catch {
          return null; // Handle invalid ObjectId cast error
        }
      } else {
        const products = readJSONFile<IProduct[]>(PRODUCTS_FILE, []);
        return products.find((p) => p.id === id) || null;
      }
    },

    async create(product: Omit<IProduct, 'id' | 'createdAt'>): Promise<IProduct> {
      if (isConnectedToMongo) {
        const created = await ProductModel.create(product);
        return created.toJSON() as IProduct;
      } else {
        const products = readJSONFile<IProduct[]>(PRODUCTS_FILE, []);
        const newProduct: IProduct = {
          ...product,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        products.push(newProduct);
        writeJSONFile(PRODUCTS_FILE, products);
        return newProduct;
      }
    },

    async update(id: string, updates: Partial<Omit<IProduct, 'id' | 'createdAt'>>): Promise<IProduct | null> {
      if (isConnectedToMongo) {
        const updated = await ProductModel.findByIdAndUpdate(id, updates, { new: true });
        return updated ? (updated.toJSON() as IProduct) : null;
      } else {
        const products = readJSONFile<IProduct[]>(PRODUCTS_FILE, []);
        const idx = products.findIndex((p) => p.id === id);
        if (idx === -1) return null;
        products[idx] = { ...products[idx]!, ...updates };
        writeJSONFile(PRODUCTS_FILE, products);
        return products[idx]!;
      }
    },

    async delete(id: string): Promise<boolean> {
      if (isConnectedToMongo) {
        const deleted = await ProductModel.findByIdAndDelete(id);
        return !!deleted;
      } else {
        const products = readJSONFile<IProduct[]>(PRODUCTS_FILE, []);
        const filtered = products.filter((p) => p.id !== id);
        if (products.length === filtered.length) return false;
        writeJSONFile(PRODUCTS_FILE, filtered);
        return true;
      }
    },
    
    async saveAll(items: IProduct[]): Promise<void> {
      if (isConnectedToMongo) {
        await ProductModel.deleteMany({});
        await ProductModel.insertMany(items);
      } else {
        writeJSONFile(PRODUCTS_FILE, items);
      }
    }
  },

  orders: {
    async create(order: Omit<IOrder, 'id' | 'createdAt' | 'status'>): Promise<IOrder> {
      if (isConnectedToMongo) {
        const created = await OrderModel.create({
          ...order,
          status: 'Pending',
        });
        return created.toJSON() as IOrder;
      } else {
        const orders = readJSONFile<IOrder[]>(ORDERS_FILE, []);
        const newOrder: IOrder = {
          ...order,
          id: generateId(),
          status: 'Pending',
          createdAt: new Date().toISOString(),
        };
        orders.push(newOrder);
        writeJSONFile(ORDERS_FILE, orders);
        return newOrder;
      }
    },

    async findByUserId(userId: string): Promise<IOrder[]> {
      if (isConnectedToMongo) {
        const list = await OrderModel.find({ userId }).sort({ createdAt: -1 });
        return list.map((o) => o.toJSON() as IOrder);
      } else {
        const orders = readJSONFile<IOrder[]>(ORDERS_FILE, []);
        return orders
          .filter((o) => o.userId === userId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    },

    async findAll(): Promise<IOrder[]> {
      if (isConnectedToMongo) {
        const list = await OrderModel.find({}).sort({ createdAt: -1 });
        return list.map((o) => o.toJSON() as IOrder);
      } else {
        const orders = readJSONFile<IOrder[]>(ORDERS_FILE, []);
        return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    },

    async updateStatus(id: string, status: IOrder['status']): Promise<IOrder | null> {
      if (isConnectedToMongo) {
        const updated = await OrderModel.findByIdAndUpdate(id, { status }, { new: true });
        return updated ? (updated.toJSON() as IOrder) : null;
      } else {
        const orders = readJSONFile<IOrder[]>(ORDERS_FILE, []);
        const idx = orders.findIndex((o) => o.id === id);
        if (idx === -1) return null;
        orders[idx]!.status = status;
        writeJSONFile(ORDERS_FILE, orders);
        return orders[idx]!;
      }
    },
  },
};
