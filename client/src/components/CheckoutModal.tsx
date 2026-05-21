import React, { useState } from 'react';
import { X, CheckCircle, CreditCard, MapPin } from 'lucide-react';
import { api } from '../services/api';
import type { Product } from '../services/api';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onOrderCreated: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onOrderCreated,
}) => {
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  
  // Dummy Card Details
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const totalAmount = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const orderProducts = cartItems.map((item) => ({
        id: item.product.id,
        quantity: item.quantity,
      }));

      const shippingAddress = {
        address,
        city,
        postalCode,
        country,
      };

      await api.orders.createOrder(orderProducts, shippingAddress);
      
      setSuccess(true);
      setTimeout(() => {
        onOrderCreated(); // Clears cart and navigates/updates
        onClose();
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-wrapper checkout-modal-content" style={{ maxWidth: '600px' }}>
        <button className="modal-close-btn" onClick={onClose} disabled={loading || success}>
          <X size={18} />
        </button>

        {success ? (
          <div className="checkout-success-view">
            <CheckCircle className="checkout-success-icon" size={64} />
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>Order Placed Successfully!</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Thank you for your purchase. We are processing your order.
            </p>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '1rem' }}>
              Redirecting you to order history in a moment...
            </div>
          </div>
        ) : (
          <>
            <h2 className="auth-modal-title" style={{ marginBottom: '0.25rem' }}>Checkout</h2>
            <p className="auth-modal-subtitle" style={{ marginBottom: '1.5rem' }}>
              Complete your shipping address and dummy payment details
            </p>

            <form onSubmit={handleSubmit}>
              <div className="checkout-grid">
                {/* Shipping Details */}
                <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                  <MapPin size={16} />
                  <span>Shipping Address</span>
                </h3>

                <div className="auth-form-group" style={{ marginBottom: '0.75rem' }}>
                  <label htmlFor="address-input">Street Address</label>
                  <input
                    id="address-input"
                    type="text"
                    placeholder="123 Main St"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div className="auth-form-group">
                    <label htmlFor="city-input">City</label>
                    <input
                      id="city-input"
                      type="text"
                      placeholder="Chicago"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>
                  <div className="auth-form-group">
                    <label htmlFor="postal-input">Postal Code</label>
                    <input
                      id="postal-input"
                      type="text"
                      placeholder="60601"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                    />
                  </div>
                  <div className="auth-form-group">
                    <label htmlFor="country-input">Country</label>
                    <input
                      id="country-input"
                      type="text"
                      placeholder="USA"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />

                {/* Payment Details */}
                <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                  <CreditCard size={16} />
                  <span>Dummy Payment Card</span>
                </h3>

                <div className="auth-form-group" style={{ marginBottom: '0.75rem' }}>
                  <label htmlFor="cardname-input">Cardholder Name</label>
                  <input
                    id="cardname-input"
                    type="text"
                    placeholder="John Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-form-group" style={{ marginBottom: '0.75rem' }}>
                  <label htmlFor="cardnumber-input">Card Number</label>
                  <input
                    id="cardnumber-input"
                    type="text"
                    placeholder="4000 1234 5678 9010"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="auth-form-group">
                    <label htmlFor="cardexpiry-input">Expiration Date</label>
                    <input
                      id="cardexpiry-input"
                      type="text"
                      placeholder="MM/YY"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      required
                    />
                  </div>
                  <div className="auth-form-group">
                    <label htmlFor="cardcvv-input">CVV</label>
                    <input
                      id="cardcvv-input"
                      type="password"
                      placeholder="•••"
                      maxLength={3}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {error && <div className="auth-error-msg text-center mb-4">{error}</div>}

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
                style={{ padding: '0.8rem', fontSize: '1rem', fontWeight: 600 }}
              >
                {loading ? 'Processing Order...' : `Pay & Place Order ($${totalAmount.toFixed(2)})`}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
