import { useState, useEffect } from 'react';
import { ShoppingCart, ShieldAlert, Mail, Code } from 'lucide-react';
import { api } from './services/api';
import type { User, Product, Order } from './services/api';

// Components
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderHistory } from './components/OrderHistory';
import { AdminPanel } from './components/AdminPanel';

interface CartItem {
  product: Product;
  quantity: number;
}

function App() {
  // Global States
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState<'home' | 'orders' | 'admin'>('home');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('All');

  // Modals / Overlays Visibility
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Loaders & Errors
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Initialize Theme, User Profile, and Cart from LocalStorage
  useEffect(() => {
    // Theme setup
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);

    // Cart loading
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (err) {
        console.error('Failed to parse saved cart:', err);
      }
    }

    // User authentication recovery
    const verifySession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const profile = await api.auth.getMe();
          setUser(profile);
        } catch (err) {
          console.warn('Session expired or invalid. Logging out.');
          handleLogout();
        }
      }
    };
    verifySession();
  }, []);

  // Fetch product catalog whenever search/category filter updates
  useEffect(() => {
    const fetchCatalog = async () => {
      setLoadingProducts(true);
      try {
        const data = await api.products.getProducts({
          search: searchQuery,
          category: categoryFilter,
        });
        setProducts(data);
      } catch (err: any) {
        setGlobalError(err.message || 'Failed to load product catalog');
      } finally {
        setLoadingProducts(false);
      }
    };

    // Debounce search input changes slightly
    const delayDebounceFn = setTimeout(() => {
      fetchCatalog();
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, categoryFilter]);

  // Sync category filter tab click with dropdown filter
  const handleCategoryTabSelect = (category: string) => {
    setSelectedCategoryTab(category);
    setCategoryFilter(category);
  };

  // Sync category filter dropdown with tab click state
  useEffect(() => {
    setSelectedCategoryTab(categoryFilter);
  }, [categoryFilter]);

  // Fetch user orders when view shifts to orders history tab
  useEffect(() => {
    if (view === 'orders' && user) {
      fetchOrders();
    }
  }, [view, user]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await api.orders.getUserOrders();
      setOrders(data);
    } catch (err: any) {
      console.error('Error loading orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Persist cart modifications to LocalStorage
  const updateCartAndPersist = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  // Cart operations
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('This product is currently out of stock.');
      return;
    }

    const existingIdx = cart.findIndex((item) => item.product.id === product.id);
    if (existingIdx !== -1) {
      const existingItem = cart[existingIdx]!;
      if (existingItem.quantity >= product.stock) {
        alert(`Cannot add more. Only ${product.stock} units are available in stock.`);
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIdx] = {
        ...existingItem,
        quantity: existingItem.quantity + 1,
      };
      updateCartAndPersist(updatedCart);
    } else {
      updateCartAndPersist([...cart, { product, quantity: 1 }]);
    }
    
    // Smooth scroll/trigger cart visual
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const target = cart.find((item) => item.product.id === productId);
    if (!target) return;

    if (quantity > target.product.stock) {
      alert(`Only ${target.product.stock} items available in stock.`);
      return;
    }

    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    const updated = cart.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    updateCartAndPersist(updated);
  };

  const handleRemoveItem = (productId: string) => {
    const filtered = cart.filter((item) => item.product.id !== productId);
    updateCartAndPersist(filtered);
  };

  // Auth Operations
  const handleAuthSuccess = (user: User, token: string) => {
    setUser(user);
    localStorage.setItem('token', token);
    setGlobalError(null);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    setView('home');
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Checkout Completion Callback
  const handleOrderCreated = () => {
    updateCartAndPersist([]); // Clear cart
    setView('orders'); // Jump to orders timeline view
  };

  // Prompt login if clicking checkout while unauthenticated
  const handleCheckoutIntent = () => {
    setIsCartOpen(false);
    if (!user) {
      setIsAuthOpen(true);
    } else {
      setIsCheckoutOpen(true);
    }
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const categories = ['All', 'Audio', 'Wearables', 'Fitness & Apparel', 'Tech Accessories', 'Home & Living'];

  const refreshProductsList = async () => {
    try {
      const data = await api.products.getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Navbar
        user={user}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        currentView={view}
        setView={setView}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="main-content">
        {globalError && (
          <div
            style={{
              backgroundColor: 'var(--status-cancelled-bg)',
              color: 'var(--status-cancelled)',
              border: '1px solid var(--status-cancelled)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <ShieldAlert size={18} />
            <span>{globalError}</span>
          </div>
        )}

        {view === 'home' && (
          <>
            {/* Category horizontal scrolling selector tabs */}
            <div className="category-tabs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-tab ${selectedCategoryTab === cat ? 'active' : ''}`}
                  onClick={() => handleCategoryTabSelect(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <h2 className="products-section-title">
              {categoryFilter === 'All' ? 'Explore Our Collection' : `${categoryFilter} Catalog`}
            </h2>

            {loadingProducts && products.length === 0 ? (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                Loading product catalog...
              </div>
            ) : products.length === 0 ? (
              <div
                className="text-center py-16"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                No products found matching your search.
              </div>
            ) : (
              <div className="products-grid">
                {products.map((prod) => (
                  <div key={prod.id} className="product-card" onClick={() => setSelectedProduct(prod)}>
                    <div className="product-image-container">
                      <img src={prod.image} alt={prod.name} loading="lazy" />
                      <span className="product-badge">{prod.category}</span>
                      <span className={`product-stock-badge ${prod.stock <= 0 ? 'out-of-stock' : ''}`}>
                        {prod.stock <= 0 ? 'Out of stock' : `${prod.stock} in stock`}
                      </span>
                    </div>

                    <div className="product-info">
                      <span className="product-card-category">{prod.category}</span>
                      <h3 className="product-card-title" title={prod.name}>
                        {prod.name}
                      </h3>
                      <p className="product-card-desc">{prod.description}</p>
                      
                      <div className="product-card-footer">
                        <span className="product-card-price">${prod.price.toFixed(2)}</span>
                        <button
                          className="btn-add-cart-shortcut"
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid triggering open detail modal
                            handleAddToCart(prod);
                          }}
                          disabled={prod.stock <= 0}
                          title={prod.stock <= 0 ? 'Out of stock' : 'Add to cart'}
                        >
                          <ShoppingCart size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {view === 'orders' && user && (
          <OrderHistory orders={orders} onRefresh={fetchOrders} loading={loadingOrders} />
        )}

        {view === 'admin' && user?.role === 'admin' && (
          <AdminPanel onRefreshProducts={refreshProductsList} />
        )}
      </main>

      <footer
        style={{
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--bg-surface)',
          padding: '2.5rem 1rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          marginTop: '4rem',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>ShopNest E-Commerce</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
            <a 
              href="mailto:workshivam@yahoo.com"
              style={{ 
                color: 'var(--text-muted)', 
                transition: 'all var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--primary)';
                e.currentTarget.style.backgroundColor = 'var(--bg-surface-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Contact Us: workshivam@yahoo.com"
            >
              <Mail size={22} />
            </a>
            <a 
              href="https://github.com/shivamonly"
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                color: 'var(--text-muted)', 
                transition: 'all var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--primary)';
                e.currentTarget.style.backgroundColor = 'var(--bg-surface-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="GitHub: @shivamonly"
            >
              <Code size={22} />
            </a>
          </div>
          <p style={{ color: 'var(--text-light)', marginTop: '0.5rem' }}>
            &copy; {new Date().getFullYear()} ShopNest. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Auth Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Product Detail Popup Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Sliding Side-Cart Panel */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckoutIntent}
      />

      {/* Checkout Forms Popup */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        onOrderCreated={handleOrderCreated}
      />
    </>
  );
}

export default App;
