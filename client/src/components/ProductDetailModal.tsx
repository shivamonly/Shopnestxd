import React from 'react';
import { X, ShoppingCart } from 'lucide-react';
import type { Product } from '../services/api';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  if (!isOpen || !product) return null;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content-wrapper product-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="product-detail-image">
          <img src={product.image} alt={product.name} />
        </div>

        <div className="product-detail-info">
          <span className="product-badge" style={{ position: 'static', alignSelf: 'flex-start', marginBottom: '1rem' }}>
            {product.category}
          </span>
          <h2 className="product-detail-title">{product.name}</h2>
          
          <div className="product-detail-meta">
            <span className="product-card-category">Product ID: {product.id}</span>
          </div>

          <p className="product-detail-desc">{product.description}</p>

          <div className="product-detail-action">
            <div className="product-detail-price-row">
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Price</span>
                <span className="product-detail-price">${product.price.toFixed(2)}</span>
              </div>
              <div>
                <span className={`product-detail-stock-status ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'in-stock'}`}>
                  {isOutOfStock
                    ? 'Out of Stock'
                    : isLowStock
                    ? `Only ${product.stock} left in stock!`
                    : 'In Stock'}
                </span>
              </div>
            </div>

            <button
              className="btn btn-primary w-full"
              disabled={isOutOfStock}
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              style={{ padding: '0.8rem' }}
            >
              <ShoppingCart size={18} />
              <span>Add to Shopping Cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
