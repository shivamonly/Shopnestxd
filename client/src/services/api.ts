export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  category: string;
  createdAt: string;
}

export interface OrderProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  products: OrderProduct[];
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const api = {
  auth: {
    async register(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, email, password }),
      });
      return handleResponse(res);
    },

    async login(email: string, password: string): Promise<{ token: string; user: User }> {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(res);
    },

    async getMe(): Promise<User> {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },

    async getAllUsers(): Promise<User[]> {
      const res = await fetch(`${API_BASE_URL}/auth/users`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  products: {
    async getProducts(filters?: { search?: string; category?: string }): Promise<Product[]> {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.category && filters.category !== 'All') params.append('category', filters.category);

      const res = await fetch(`${API_BASE_URL}/products?${params.toString()}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },

    async getProduct(id: string): Promise<Product> {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },

    async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(product),
      });
      return handleResponse(res);
    },

    async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product> {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates),
      });
      return handleResponse(res);
    },

    async deleteProduct(id: string): Promise<{ message: string }> {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  orders: {
    async createOrder(
      products: { id: string; quantity: number }[],
      shippingAddress: Order['shippingAddress']
    ): Promise<Order> {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ products, shippingAddress }),
      });
      return handleResponse(res);
    },

    async getUserOrders(): Promise<Order[]> {
      const res = await fetch(`${API_BASE_URL}/orders/user`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },

    async getAllOrders(): Promise<Order[]> {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },

    async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
      const res = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      return handleResponse(res);
    },
  },
};
