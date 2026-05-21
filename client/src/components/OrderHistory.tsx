import React from 'react';
import { ShoppingBag, RefreshCw, Calendar, DollarSign } from 'lucide-react';
import type { Order, OrderProduct } from '../services/api';

interface OrderHistoryProps {
  orders: Order[];
  onRefresh: () => void;
  loading: boolean;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ orders, onRefresh, loading }) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="orders-history-container">
      <div className="flex justify-between align-center mb-4">
        <h2 className="orders-history-title">Your Order History</h2>
        <button className="btn btn-secondary btn-icon" onClick={onRefresh} disabled={loading} title="Refresh orders">
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
          Loading order history...
        </div>
      ) : orders.length === 0 ? (
        <div
          className="text-center py-12"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <ShoppingBag size={48} style={{ strokeWidth: 1.2, color: 'var(--text-light)' }} />
          <div>
            <p style={{ fontWeight: 600 }}>No orders found</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
              You haven't placed any orders yet.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map((order) => (
            <div className="order-card" key={order.id}>
              <div className="order-card-header">
                <div className="order-meta-info">
                  <div className="order-meta-item">
                    <span className="order-meta-label">Order ID</span>
                    <span className="order-meta-value" style={{ fontFamily: 'monospace' }}>
                      {order.id}
                    </span>
                  </div>
                  <div className="order-meta-item">
                    <span className="order-meta-label">Date Placed</span>
                    <span className="order-meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <div className="order-meta-item">
                    <span className="order-meta-label">Total Amount</span>
                    <span className="order-meta-value" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.1rem' }}>
                      <DollarSign size={14} style={{ color: 'var(--text-muted)' }} />
                      {order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
                <span className={`status-badge ${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
              </div>

              <div className="order-card-body">
                <div className="order-items-list">
                  {order.products.map((item: OrderProduct) => (
                    <div className="order-item-row" key={item.id}>
                      <img className="order-item-img" src={item.image} alt={item.name} />
                      <div className="order-item-name">{item.name}</div>
                      <div className="order-item-qty-price">
                        {item.quantity} x ${item.price.toFixed(2)}
                        <strong style={{ display: 'block', color: 'var(--text-main)', marginTop: '0.1rem' }}>
                          ${(item.quantity * item.price).toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-shipping-summary">
                  <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                    Shipping Address:
                  </strong>
                  {order.shippingAddress.address}, {order.shippingAddress.city},{' '}
                  {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
