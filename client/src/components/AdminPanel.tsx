import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2, X, RefreshCw, Layers, Users, ClipboardList } from 'lucide-react';
import { api } from '../services/api';
import type { Product, Order, User } from '../services/api';

interface AdminPanelProps {
  onRefreshProducts: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onRefreshProducts }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'users'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Product Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'products') {
        const data = await api.products.getProducts();
        setProducts(data);
      } else if (activeTab === 'orders') {
        const data = await api.orders.getAllOrders();
        setOrders(data);
      } else if (activeTab === 'users') {
        const data = await api.auth.getAllUsers();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const openAddForm = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDesc('');
    setFormPrice('');
    setFormImage('');
    setFormStock('');
    setFormCategory('Audio');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormDesc(prod.description);
    setFormPrice(prod.price.toString());
    setFormImage(prod.image);
    setFormStock(prod.stock.toString());
    setFormCategory(prod.category);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName || !formDesc || !formPrice || !formImage || !formStock) {
      setFormError('All fields are required');
      return;
    }

    const priceNum = parseFloat(formPrice);
    const stockNum = parseInt(formStock, 10);

    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Price must be a positive number');
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      setFormError('Stock must be a non-negative integer');
      return;
    }

    try {
      const payload = {
        name: formName,
        description: formDesc,
        price: priceNum,
        image: formImage,
        stock: stockNum,
        category: formCategory || 'General',
      };

      if (editingProduct) {
        await api.products.updateProduct(editingProduct.id, payload);
      } else {
        await api.products.createProduct(payload);
      }

      setIsFormOpen(false);
      fetchData();
      onRefreshProducts(); // Updates main catalog view too
    } catch (err: any) {
      setFormError(err.message || 'Saving product failed');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.products.deleteProduct(id);
        fetchData();
        onRefreshProducts();
      } catch (err) {
        console.error('Delete product failed:', err);
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: Order['status']) => {
    try {
      await api.orders.updateOrderStatus(id, newStatus);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield className="icon" style={{ color: 'var(--primary)' }} />
          <span>Admin Dashboard</span>
        </h2>
        <div className="flex gap-2">
          {activeTab === 'products' && (
            <button className="btn btn-primary" onClick={openAddForm}>
              <Plus size={16} />
              <span>Add Product</span>
            </button>
          )}
          <button className="btn btn-secondary btn-icon" onClick={fetchData} disabled={loading} title="Refresh data">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Layers size={16} />
          <span>Manage Catalog</span>
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ClipboardList size={16} />
          <span>Order Logs</span>
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Users size={16} />
          <span>User Database</span>
        </button>
      </div>

      {loading && (products.length === 0 && orders.length === 0 && users.length === 0) ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          Loading admin data...
        </div>
      ) : (
        <div className="admin-table-card">
          {activeTab === 'products' && (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Product ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod) => (
                    <tr key={prod.id}>
                      <td>
                        <img className="admin-img-cell" src={prod.image} alt="" />
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {prod.id}
                      </td>
                      <td style={{ fontWeight: 600 }}>{prod.name}</td>
                      <td>
                        <span className="status-badge processing" style={{ fontSize: '0.7rem' }}>
                          {prod.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>${prod.price.toFixed(2)}</td>
                      <td style={{ fontWeight: 500, color: prod.stock <= 5 ? 'var(--status-cancelled)' : 'inherit' }}>
                        {prod.stock}
                      </td>
                      <td>
                        <div className="admin-action-btn-row">
                          <button className="btn-icon" onClick={() => openEditForm(prod)} title="Edit details">
                            <Edit size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDeleteProduct(prod.id)}
                            style={{ color: 'var(--status-cancelled)' }}
                            title="Delete product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>
                        No products in catalog
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>User ID</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{ord.id}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {ord.userId}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          {ord.products.map((item) => (
                            <div key={item.id}>
                              {item.name} (x{item.quantity})
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700 }}>${ord.totalAmount.toFixed(2)}</td>
                      <td>{formatDate(ord.createdAt)}</td>
                      <td>
                        <select
                          className="admin-status-select"
                          value={ord.status}
                          onChange={(e) => handleStatusChange(ord.id, e.target.value as any)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>
                        No orders recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>Access Role</th>
                    <th>Registered Date</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((usr) => (
                    <tr key={usr.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {usr.id}
                      </td>
                      <td style={{ fontWeight: 600 }}>{usr.name}</td>
                      <td>{usr.email}</td>
                      <td>
                        <span className={`status-badge ${usr.role === 'admin' ? 'delivered' : 'pending'}`}>
                          {usr.role}
                        </span>
                      </td>
                      <td>{formatDate(usr.createdAt)}</td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>
                        No users recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Product Form Modal (Add / Edit) */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content-wrapper auth-modal-content" style={{ maxWidth: '550px' }}>
            <button className="modal-close-btn" onClick={() => setIsFormOpen(false)}>
              <X size={18} />
            </button>

            <h2 className="auth-modal-title">{editingProduct ? 'Edit Catalog Product' : 'Add New Product'}</h2>
            <p className="auth-modal-subtitle">Fill in the product specifications below</p>

            <form onSubmit={handleFormSubmit}>
              <div className="auth-form-group">
                <label htmlFor="prodname-input">Product Title</label>
                <input
                  id="prodname-input"
                  type="text"
                  placeholder="e.g. AcousticMax Headphones"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="auth-form-group">
                <label htmlFor="proddesc-input">Description</label>
                <textarea
                  id="proddesc-input"
                  placeholder="Describe the product features..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-app)',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="auth-form-group">
                  <label htmlFor="prodprice-input">Price ($ USD)</label>
                  <input
                    id="prodprice-input"
                    type="number"
                    step="0.01"
                    placeholder="99.99"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="auth-form-group">
                  <label htmlFor="prodstock-input">Stock Inventory</label>
                  <input
                    id="prodstock-input"
                    type="number"
                    placeholder="25"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="auth-form-group">
                  <label htmlFor="prodcat-input">Category</label>
                  <select
                    id="prodcat-input"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-app)',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="Audio">Audio</option>
                    <option value="Wearables">Wearables</option>
                    <option value="Fitness & Apparel">Fitness & Apparel</option>
                    <option value="Tech Accessories">Tech Accessories</option>
                    <option value="Home & Living">Home & Living</option>
                  </select>
                </div>
                <div className="auth-form-group">
                  <label htmlFor="prodimage-input">Unsplash Image URL</label>
                  <input
                    id="prodimage-input"
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    required
                  />
                </div>
              </div>

              {formError && <div className="auth-error-msg text-center mb-4">{formError}</div>}

              <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.8rem' }}>
                {editingProduct ? 'Save Product Changes' : 'Create Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
