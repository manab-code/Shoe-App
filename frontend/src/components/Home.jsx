import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingCart, User, LogOut, X, Trash2, Plus } from "lucide-react";

// ─── Import product lists from other pages ────────────────────────────────
const bestSellingProducts = [
  { id: 1, name: 'Nike Sport Shoe', price: '₹3999.00', oldPrice: '₹4999.00', image: '/nikesport.png' },
  { id: 2, name: 'Sneakers shoe for man', price: '₹2999.00', oldPrice: '₹4999.00', image: '/snekerblue.png' },
  { id: 3, name: 'Trendy Slick Pro', price: '₹3999.00', oldPrice: '₹4999.00', image: '/whiteshoe2.png' },
  { id: 4, name: 'Slick running shoes', price: '₹2999.00', oldPrice: '₹4999.00', image: '/slick.png' },
  { id: 5, name: 'Formal canvas shoe for man', price: '₹2999.00', oldPrice: '₹4999.00', image: '/canvasshoe.png' },
  { id: 6, name: 'Running Shoe', price: '₹2999.00', oldPrice: '₹4999.00', image: '/running.png' },
];

const manProducts = [
  { id: 101, name: 'Red Nike Sneaker', price: '₹2999.00', oldPrice: '₹4999.00', image: '/nikesport.png' },
  { id: 102, name: 'Slick Running Shoe', price: '₹3800.00', oldPrice: '₹5000.00', image: '/slick.png' },
  { id: 103, name: 'Arke Shoe', price: '₹4000.00', oldPrice: '₹5000.00', image: '/arke.png' },
  { id: 104, name: 'Blue Sneaker', price: '₹4000.00', oldPrice: '₹4999.00', image: '/snekerblue.png' },
  { id: 105, name: 'Black Nike Sneaker', price: '₹5999.00', oldPrice: '₹6999.00', image: '/black.png' },
  { id: 106, name: 'Nike Sport Shoe', price: '₹3000.00', oldPrice: '₹4999.00', image: '/red.png' },
];

const womenProducts = [
  { id: 201, name: 'White Shoe', price: '₹2000.00', oldPrice: '₹3999.00', image: '/pink.png' },
  { id: 202, name: 'Grey Shoe', price: '₹3500.00', oldPrice: '₹4999.00', image: '/Grey.png' },
  { id: 203, name: 'Style Shoe', price: '₹4000.00', oldPrice: '₹5999.00', image: '/style.png' },
  { id: 204, name: 'Jogging Shoe', price: '₹3000.00', oldPrice: '₹4999.00', image: '/jogging.png' },
  { id: 205, name: 'Mix Sneker', price: '₹4000.00', oldPrice: '₹5999.00', image: '/mix.png' },
  { id: 206, name: 'Rose Sneker', price: '₹2500.00', oldPrice: '₹4999.00', image: '/rose.png' },
];

const childrenProducts = [
  { id: 301, name: 'Adidas Shoe', price: '₹1500.00', oldPrice: '₹2999.00', image: '/adikid.png' },
  { id: 302, name: 'Grey Shoe', price: '₹1800.00', oldPrice: '₹3499.00', image: '/greykid.png' },
  { id: 303, name: 'Cartoon Shoe', price: '₹2200.00', oldPrice: '₹3999.00', image: '/cartoon.png' },
  { id: 304, name: 'Lightning Shoe', price: '₹2500.00', oldPrice: '₹3999.00', image: '/lightning.png' },
  { id: 305, name: 'Superman Shoe', price: '₹3000.00', oldPrice: '₹3799.00', image: '/superman.png' },
  { id: 306, name: 'Comfort Shoe', price: '₹1500.00', oldPrice: '₹2999.00', image: '/comfort.png' },
];

const allProducts = [...bestSellingProducts, ...manProducts, ...womenProducts, ...childrenProducts];

// ─── Logout Modal ───────────────────────────────────────────────────────────
const LogoutModal = ({ onConfirm, onCancel }) => {
  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.15s ease',
  };
  const cardStyle = {
    background: '#fffbfb',
    borderRadius: '20px',
    padding: '28px 28px 24px',
    width: '100%',
    maxWidth: '340px',
    margin: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    animation: 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
  };
  return (
    <>
      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
      `}</style>
      <div style={overlayStyle} onClick={onCancel}>
        <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: '#fff1f1', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <LogOut size={22} color="#e53e3e" />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#111' }}>Confirm logout</h2>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: '#666', lineHeight: 1.5 }}>
            Are you sure you want to logout from your account?
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onCancel} style={{
              flex: 1, padding: '12px', borderRadius: 12,
              border: '1.5px solid #e0e0e0', background: '#fafafa',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif', color: '#444',
              transition: 'background 0.2s',
            }} onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
               onMouseLeave={(e) => e.currentTarget.style.background = '#fafafa'}>
              Cancel
            </button>
            <button onClick={onConfirm} style={{
              flex: 1, padding: '12px', borderRadius: 12,
              border: 'none', background: '#e53e3e',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif', color: '#ffffff',
              transition: 'background 0.2s, transform 0.15s',
            }} onMouseEnter={(e) => { e.currentTarget.style.background = '#c53030'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
               onMouseLeave={(e) => { e.currentTarget.style.background = '#e53e3e'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              Yes, logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Search Bar Overlay ────────────────────────────────────────────────────
const SearchBar = ({ isOpen, onClose, products, onProductSelect }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handler);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase().trim())
  );

  return (
    <>
      <style>{`
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 998,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '80px',
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose();
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '600px',
            margin: '0 24px',
            animation: 'fadeInDown 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '16px 24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}>
            <Search size={22} color="#374151" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search all shoes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '16px',
                fontFamily: 'Poppins, sans-serif',
                color: '#111',
                background: 'transparent',
              }}
            />
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} color="#9ca3af" />
            </button>
          </div>

          {query.trim() !== '' && (
            <div style={{
              marginTop: '12px',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '8px 0',
            }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '16px 24px', color: '#9ca3af', textAlign: 'center' }}>
                  No shoes found
                </div>
              ) : (
                filtered.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '12px 24px',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    onClick={() => {
                      onProductSelect(product);
                      onClose();
                      setQuery('');
                    }}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px', background: '#fff' }}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/48'; }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#111' }}>{product.name}</div>
                      <div style={{ fontSize: '13px', color: '#666' }}>{product.price}</div>
                    </div>
                    <span style={{ fontSize: '13px', color: '#9ca3af' }}>↗</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ─── Cart Drawer ─────────────────────────────────────────────────────────────
const CartDrawer = ({ isOpen, onClose, cartItems, onRemoveItem }) => {
  const drawerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const onRemoveItemRef = useRef(onRemoveItem);
  const isFirstRender = useRef(true);

  onCloseRef.current = onClose;
  onRemoveItemRef.current = onRemoveItem;

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = 'unset';
      return;
    }
    document.body.style.overflow = 'hidden';
    isFirstRender.current = true;
    const handler = (e) => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        onCloseRef.current();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 999,
        animation: 'fadeInOverlay 0.2s ease',
      }} onClick={onClose} />
      <div
        ref={drawerRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100%',
          maxWidth: '420px',
          height: '100vh',
          background: '#ffffff',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingCart size={22} color="#111" />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111' }}>
              Your Cart ({cartItems.length})
            </h2>
          </div>
          <button onClick={onClose} style={{
            padding: '8px',
            borderRadius: '50%',
            border: 'none',
            background: '#f3f4f6',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }} onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
             onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}>
            <X size={18} color="#374151" />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {cartItems.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: '16px',
              color: '#9ca3af',
            }}>
              <ShoppingCart size={48} strokeWidth={1.5} />
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 500 }}>Your cart is empty</p>
              <p style={{ margin: 0, fontSize: '13px' }}>Add items from Best Selling to see them here</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cartItems.map((item, index) => (
                <div key={item.cartId || index} style={{
                  display: 'flex',
                  gap: '14px',
                  padding: '14px',
                  borderRadius: '14px',
                  background: '#fafafa',
                  border: '1px solid #f0f0f0',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }} onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                }} onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <img
                    src={item.imageUrl || item.image || '/placeholder.png'}
                    alt={item.name}
                    style={{
                      width: '70px',
                      height: '70px',
                      objectFit: 'contain',
                      borderRadius: '10px',
                      background: '#fff',
                    }}
                    onError={(e) => { e.target.src = '/placeholder.png'; }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 600, color: '#111' }}>{item.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>
                        {typeof item.price === 'number' ? `₹${item.price}` : item.price}
                      </span>
                      <span style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'line-through' }}>
                        {typeof item.oldPrice === 'number' ? `₹${item.oldPrice}` : (item.oldPrice || (typeof item.price === 'number' ? `₹${item.price * 1.2}` : ''))}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => onRemoveItemRef.current(index)} style={{
                    padding: '8px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#fee2e2',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: 'center',
                    transition: 'background 0.2s, transform 0.15s',
                  }} onMouseEnter={(e) => { e.currentTarget.style.background = '#fecaca'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.transform = 'scale(1)'; }}>
                    <Trash2 size={16} color="#e53e3e" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {cartItems.length > 0 && (
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid #f0f0f0',
            background: '#fafafa',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <span style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>Total Items</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#111' }}>{cartItems.length}</span>
            </div>
            <button style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: '#111',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif',
              transition: 'background 0.2s, transform 0.15s',
            }} onMouseEnter={(e) => { e.currentTarget.style.background = '#333'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
               onMouseLeave={(e) => { e.currentTarget.style.background = '#111'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// ─── User dropdown ────────────────────────────────────────────────────────────
const UserDropdown = ({ user, onLogoutClick, onClose }) => {
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const style = {
    wrapper: {
      position: 'absolute',
      top: 'calc(100% + 8px)',
      right: 0,
      width: 220,
      background: '#ffffff',
      borderRadius: 16,
      border: '1px solid #e8e8e8',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      overflow: 'hidden',
      zIndex: 100,
      animation: 'dropIn 0.18s cubic-bezier(0.34,1.56,0.64,1)',
    },
    header: {
      padding: '14px 16px',
      borderBottom: '1px solid #f0f0f0',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    },
    avatar: {
      width: 36, height: 36, borderRadius: '50%',
      background: '#f3f4f6',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    name: { margin: 0, fontSize: 13, fontWeight: 700, color: '#111' },
    email: { margin: 0, fontSize: 11, color: '#888', marginTop: 1 },
    logoutBtn: {
      width: '100%', padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'none', border: 'none', cursor: 'pointer',
      fontSize: 13, fontWeight: 600, color: '#e53e3e',
      fontFamily: 'Poppins, sans-serif',
      transition: 'background 0.15s',
      textAlign: 'left',
    },
  };

  return (
    <>
      <style>{`@keyframes dropIn { from { opacity:0; transform:translateY(-8px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
      <div ref={dropdownRef} style={style.wrapper}>
        <div style={style.header}>
          <div style={style.avatar}><User size={16} color="#374151" /></div>
          <div><p style={style.name}>{user?.name || 'My Account'}</p><p style={style.email}>{user?.email || ''}</p></div>
        </div>
        <button style={style.logoutBtn} onMouseEnter={(e) => e.currentTarget.style.background = '#fff5f5'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'} onClick={onLogoutClick}>
          <LogOut size={15} /> Logout
        </button>
      </div>
    </>
  );
};

// ─── Main Home component ──────────────────────────────────────────────────────
const Home = () => {
  const navigate = useNavigate();
  const [ctaHovered, setCtaHovered] = useState(false);
  const [isProductHovered, setIsProductHovered] = useState(false);
  const [showLeftSlide, setShowLeftSlide] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [addedMessage, setAddedMessage] = useState('');

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [popupAddedMessage, setPopupAddedMessage] = useState('');

  const featuredProduct = {
    id: 'featured-1',
    name: 'Trendy Slick Pro',
    price: 3999,
    oldPrice: 4999,
    image: '/shoe.png',
    imageUrl: '/shoe.png',
    isNew: true,
  };

  // ─── User & cart logic ────────────────────────────────────────────────────
  const getUser = () => {
    try {
      const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };
  const isLoggedIn = !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
  const user = getUser();

  const loadCart = useCallback(() => {
    const items = JSON.parse(localStorage.getItem('cartItems')) || [];
    setCartItems(items);
    setCartCount(items.length);
  }, []);

  useEffect(() => {
    loadCart();
    window.addEventListener('cartUpdated', loadCart);
    return () => window.removeEventListener('cartUpdated', loadCart);
  }, [loadCart]);

  useEffect(() => {
    if (cartOpen) loadCart();
  }, [cartOpen, loadCart]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) loadCart();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [loadCart]);

  useEffect(() => {
    const timer = setTimeout(() => setShowLeftSlide(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleUserIconClick = () => {
    if (isLoggedIn) setDropdownOpen((prev) => !prev);
    else navigate('/login');
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setShowLogoutModal(false);
    setDropdownOpen(false);
    navigate('/login');
  };

  const addToCart = useCallback((product) => {
    const existingCart = JSON.parse(localStorage.getItem('cartItems')) || [];
    const cartItem = {
      ...product,
      cartId: Date.now(),
      imageUrl: product.imageUrl || product.image,
      image: product.image || product.imageUrl,
    };
    const updatedCart = [...existingCart, cartItem];
    localStorage.setItem('cartItems', JSON.stringify(updatedCart));
    setCartItems(updatedCart);
    setCartCount(updatedCart.length);
    window.dispatchEvent(new Event('cartUpdated'));
    setAddedMessage('Added to cart!');
    setTimeout(() => setAddedMessage(''), 1500);
  }, []);

  const handlePopupAddToCart = (product) => {
    addToCart(product);
    setPopupAddedMessage('Added to cart!');
    setTimeout(() => {
      setPopupAddedMessage('');
      setSelectedProduct(null);
    }, 1500);
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setPopupAddedMessage('');
  };

  const handleCloseCart = useCallback(() => setCartOpen(false), []);
  const handleCloseSearch = useCallback(() => setSearchOpen(false), []);
  const handleRemoveFromCart = useCallback((indexToRemove) => {
    setCartItems((prev) => {
      const updatedCart = prev.filter((_, index) => index !== indexToRemove);
      setCartCount(updatedCart.length);
      localStorage.setItem('cartItems', JSON.stringify(updatedCart));
      window.dispatchEvent(new Event('cartUpdated'));
      return updatedCart;
    });
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff", fontFamily: "Poppins, sans-serif", position: "relative" }}>

      <SearchBar
        isOpen={searchOpen}
        onClose={handleCloseSearch}
        products={allProducts}
        onProductSelect={handleProductSelect}
      />

      <CartDrawer
        isOpen={cartOpen}
        onClose={handleCloseCart}
        cartItems={cartItems}
        onRemoveItem={handleRemoveFromCart}
      />

      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleLogoutConfirm}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      {addedMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#111',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 600,
          zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          animation: 'fadeInUp 0.3s ease',
        }}>
          {addedMessage}
        </div>
      )}

      {selectedProduct && (
        <div className="search-popup-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="search-popup" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="search-popup-close"
              onClick={() => setSelectedProduct(null)}
            >
              <X size={18} />
            </button>
            <div className="search-popup-image-wrapper">
              <img
                src={selectedProduct.imageUrl || selectedProduct.image}
                alt={selectedProduct.name}
                className="search-popup-image"
                onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
              />
            </div>
            <h3 className="search-popup-name">{selectedProduct.name}</h3>
            <div className="search-popup-pricing">
              <span className="search-popup-price">
                {typeof selectedProduct.price === 'number' ? `₹${selectedProduct.price}` : selectedProduct.price}
              </span>
              <span className="search-popup-old-price">
                {typeof selectedProduct.oldPrice === 'number' ? `₹${selectedProduct.oldPrice}` : selectedProduct.oldPrice}
              </span>
            </div>
            {popupAddedMessage && (
              <div className="search-popup-added-msg">
                <ShoppingCart size={16} /> {popupAddedMessage}
              </div>
            )}
            <div className="search-popup-actions">
              <button type="button" className="search-popup-buy-now">
                Buy Now
              </button>
              <button
                type="button"
                className="search-popup-add-cart"
                onClick={() => handlePopupAddToCart(selectedProduct)}
              >
                Add to cart
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .search-popup-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          display: flex;
          alignItems: center;
          justifyContent: center;
          z-index: 1001;
          padding: 16px;
          animation: fadeIn 0.15s ease;
        }
        .search-popup {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
          width: 100%;
          max-width: 300px;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.15);
          animation: scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .search-popup-close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: #f3f4f6;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #111827;
          line-height: 1;
          transition: background-color 0.2s ease;
        }
        .search-popup-close:hover { background: #e5e7eb; }
        .search-popup-image-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 16px;
        }
        .search-popup-image {
          width: 100%;
          max-width: 220px;
          object-fit: contain;
        }
        .search-popup-name {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }
        .search-popup-pricing {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        .search-popup-price {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
        }
        .search-popup-old-price {
          font-size: 13px;
          color: #6b7280;
          text-decoration: line-through;
        }
        .search-popup-added-msg {
          color: #22c55e;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          justify-content: center;
        }
        .search-popup-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }
        .search-popup-buy-now,
        .search-popup-add-cart {
          width: 100%;
          padding: 12px 0;
          border-radius: 999px;
          border: 1px solid #111827;
          background: #ffffff;
          color: #111827;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        .search-popup-buy-now:hover,
        .search-popup-add-cart:hover {
          background: #111827;
          color: #ffffff;
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 32px", position: "relative", zIndex: 20 }}>
        <div style={{ fontSize: "24px", fontWeight: "700", cursor: "pointer", letterSpacing: "-0.8px" }} onClick={() => navigate("/")}>Slick</div>
        <div style={{ display: "flex", gap: "24px", alignItems: "center", position: "relative", zIndex: 50 }}>

          {/* Search */}
          <button
            type="button"
            aria-label="Search"
            style={{ background: "none", border: "none", cursor: "pointer", borderRadius: "50%", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 0.2s ease, transform 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eff2f8'; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
            onClick={() => setSearchOpen(true)}
          >
            <Search size={20} color="#374151" />
          </button>

          {/* Cart */}
          <button
            type="button"
            aria-label="Cart"
            style={{ background: "none", border: "none", cursor: "pointer", borderRadius: "50%", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", transition: "background-color 0.2s ease, transform 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart size={20} color="#374151" />
            {cartCount > 0 && (
              <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#e53e3e", color: "#fff", fontSize: "11px", fontWeight: 700, width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff", pointerEvents: "none" }}>{cartCount}</span>
            )}
          </button>

          {/* ADMIN BUTTON — only for admin users */}
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: '#111',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'Poppins, sans-serif',
                transition: 'background 0.2s, transform 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#333'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#111'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              ⚙️ Admin
            </button>
          )}

          {/* User */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              aria-label={isLoggedIn ? 'Account menu' : 'Login'}
              style={{ background: "none", border: "none", cursor: "pointer", borderRadius: "50%", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 0.2s ease, transform 0.2s ease", ...(isLoggedIn ? { backgroundColor: '#f3f4f6' } : {}) }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isLoggedIn ? '#f3f4f6' : 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
              onClick={handleUserIconClick}
            >
              <User size={20} color={isLoggedIn ? '#111111' : '#374151'} />
            </button>
            {dropdownOpen && isLoggedIn && (
              <UserDropdown
                user={user}
                onLogoutClick={() => { setShowLogoutModal(true); setDropdownOpen(false); }}
                onClose={() => setDropdownOpen(false)}
              />
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 96px)", position: "relative", backgroundColor: "#f7f3f3", alignItems: "flex-start", paddingTop: "24px", animation: 'fadeInUp 0.8s ease forwards' }}>
        <div style={{ width: "50%", padding: "32px 32px 32px 10px", display: "flex", flexDirection: "column", justifyContent: "flex-start", paddingTop: "48px", opacity: showLeftSlide ? 1 : 0, transform: showLeftSlide ? "translateX(0)" : "translateX(-40px)", transition: "all 0.8s ease", zIndex: 10 }}>
          <h1 style={{ fontSize: "60px", fontWeight: "700", color: "#090909", lineHeight: "1.1", marginBottom: "24px", marginTop: 0 }}>Find Your Sole Mate With Us</h1>
          <p style={{ fontSize: "18px", marginBottom: "32px", maxWidth: "320px", lineHeight: "1.5", alignSelf: "center", textAlign: "center", color: "#000000" }}>"Step Into Comfort, Walk With Confidence."</p>
          <button
            style={{ backgroundColor: ctaHovered ? "#333333" : "#010000", color: "#fafafa", padding: "16px 40px", fontSize: "14px", fontWeight: "500", border: "none", cursor: "pointer", width: "fit-content", transition: "all 0.3s ease", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", alignSelf: "center", marginTop: "4px" }}
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
            onClick={() => navigate("/best-selling")}
          >
            Shop Now
          </button>
        </div>

        <div style={{ width: "50%", position: "relative", backgroundColor: "#f5f5f5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "24px", overflow: "hidden", transform: "translateY(-24px)" }}>
          <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%) rotate(180deg)", pointerEvents: "none", userSelect: "none", fontSize: "120px", fontWeight: "900", color: "rgba(0, 0, 0, 0.12)", letterSpacing: "4px", whiteSpace: "nowrap", writingMode: "vertical-rl", textOrientation: "mixed", zIndex: 1 }}>Slick</div>
          <div
            role="button"
            tabIndex={0}
            style={{ background: "transparent", border: "none", outline: "none", padding: 0, margin: 0, cursor: "pointer", textAlign: "center", transition: "transform 0.3s ease, box-shadow 0.3s ease", width: "100%" }}
            onMouseEnter={() => setIsProductHovered(true)}
            onMouseLeave={() => setIsProductHovered(false)}
            onClick={() => console.log('Product clicked')}
            onKeyDown={(e) => e.key === 'Enter' && console.log('Product clicked')}
            aria-label="View trendy slick pro details"
          >
            <div style={{ position: 'relative', zIndex: 2, border: 'none', backgroundColor: 'transparent' }}>
              <img src="/shoe.png" alt="Shoe" style={{ width: "360px", height: "auto", objectFit: "contain", border: "none", filter: "drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15))", transition: "transform 0.5s ease", transform: isProductHovered ? "translateY(-8px) scale(1.02)" : "translateY(0)" }} />
              <button
                type="button"
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#111',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  opacity: isProductHovered ? 1 : 0,
                  transform: isProductHovered ? 'scale(1)' : 'scale(0.8)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#333'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#111'; e.currentTarget.style.transform = 'scale(1)'; }}
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(featuredProduct);
                }}
                aria-label="Add to cart"
                title="Add to cart"
              >
                <Plus size={20} />
              </button>
            </div>
            <div style={{ position: 'relative', marginTop: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: "18px", color: "#666666", marginBottom: '8px', marginTop: 0, textAlign: 'center' }}>₹{featuredProduct.price}</div>
              <div style={{ fontSize: "20px", fontWeight: "600", color: "#080808", marginBottom: 0, marginTop: 0, textAlign: 'center' }}>{featuredProduct.name}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
