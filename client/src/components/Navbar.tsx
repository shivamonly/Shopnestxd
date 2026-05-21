import React from 'react';
import { ShoppingBag, Search, User as UserIcon, LogOut, Package, Shield, Sun, Moon } from 'lucide-react';
import type { User } from '../services/api';

interface NavbarProps {
  user: User | null;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  currentView: 'home' | 'orders' | 'admin';
  setView: (view: 'home' | 'orders' | 'admin') => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  cartCount,
  onOpenCart,
  onOpenAuth,
  onLogout,
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  currentView,
  setView,
  theme,
  toggleTheme,
}) => {
  return (
    <nav className="navbar-header">
      <div className="navbar-container">
        <div className="nav-brand" onClick={() => setView('home')}>
          <ShoppingBag className="icon" size={24} />
          <span>ShopNest</span>
        </div>

        {currentView === 'home' && (
          <div className="search-filter-bar">
            <div className="search-input-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="category-dropdown"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Audio">Audio</option>
              <option value="Wearables">Wearables</option>
              <option value="Fitness & Apparel">Fitness & Apparel</option>
              <option value="Tech Accessories">Tech Accessories</option>
              <option value="Home & Living">Home & Living</option>
            </select>
          </div>
        )}

        {currentView !== 'home' && (
          <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setView('home')}>
              ← Back to Shopping
            </button>
          </div>
        )}

        <div className="nav-actions">
          {/* Theme Toggle */}
          <button className="btn-icon" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* User Specific Controls */}
          {user ? (
            <>
              {user.role === 'admin' && (
                <button
                  className={`btn ${currentView === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setView(currentView === 'admin' ? 'home' : 'admin')}
                  title="Admin Dashboard"
                >
                  <Shield size={18} />
                  <span className="hide-on-mobile">Admin</span>
                </button>
              )}
              
              <button
                className={`btn ${currentView === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setView('orders')}
                title="View Orders"
              >
                <Package size={18} />
                <span className="hide-on-mobile">Orders</span>
              </button>

              <div className="flex align-center gap-2 hide-on-mobile" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                Hi, {user.name.split(' ')[0]}
              </div>

              <button className="btn-icon" onClick={onLogout} title="Log Out">
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={onOpenAuth}>
              <UserIcon size={18} />
              <span>Login</span>
            </button>
          )}

          {/* Cart Button */}
          <div className="cart-btn-wrapper">
            <button className="btn btn-secondary" onClick={onOpenCart}>
              <ShoppingBag size={18} />
              <span className="hide-on-mobile">Cart</span>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
