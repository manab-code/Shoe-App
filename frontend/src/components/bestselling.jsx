import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, X, ShoppingCart, Trash2 } from 'lucide-react';
import './bestselling.css';
import PaymentModal from './PaymentModel';

const API_URL = 'http://localhost:8080/api/products';
const token = localStorage.getItem('token');

const getUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

// ─── Cart Drawer ─────────────────────────────────────────────────────────────
const CartDrawer = ({ isOpen, onClose, cartItems, onRemoveItem }) => {
  const drawerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose();
    };
    if (isOpen) {
      document.addEventListener('mousedown', handler);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('mousedown', handler);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

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
        {/* Header */}
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
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '50%',
              border: 'none',
              background: '#f3f4f6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
          >
            <X size={18} color="#374151" />
          </button>
        </div>

        {/* Cart Items */}
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
              <p style={{ margin: 0, fontSize: '13px' }}>Add items to see them here</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cartItems.map((item, index) => (
                <div
                  key={item.cartId || index}
                  style={{
                    display: 'flex',
                    gap: '14px',
                    padding: '14px',
                    borderRadius: '14px',
                    background: '#fafafa',
                    border: '1px solid #f0f0f0',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
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
                    <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 600, color: '#111' }}>
                      {item.name}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>
                        ₹{item.price}
                      </span>
                      <span style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'line-through' }}>
                        ₹{item.oldPrice || item.price * 1.2}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveItem(index)}
                    style={{
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
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fecaca'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.transform = 'scale(1)'; }}
                    title="Remove from cart"
                  >
                    <Trash2 size={16} color="#e53e3e" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
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
            <button
              style={{
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
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#333'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#111'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
};

const BestSelling = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addedMessage, setAddedMessage] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentProduct, setPaymentProduct] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  const user = getUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchProducts();
    const items = JSON.parse(localStorage.getItem('cartItems')) || [];
    setCartItems(items);
    setCartCount(items.length);
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}?category=bestselling`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
      setProducts([]);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDeleteMessage('Product deleted!');
        setTimeout(() => setDeleteMessage(''), 2000);
        fetchProducts();
      } else {
        alert(data.message || 'Failed to delete');
      }
    } catch (err) {
      alert('Server error while deleting');
    }
  };

  const handleCardAction = (product) => {
    setSelectedProduct(product);
  };

  const closePopup = () => {
    setSelectedProduct(null);
    setAddedMessage('');
  };

  const addToCart = (product) => {
    const existingCart = JSON.parse(localStorage.getItem('cartItems')) || [];
    const updatedCart = [...existingCart, { ...product, cartId: Date.now() }];
    localStorage.setItem('cartItems', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
    setCartItems(updatedCart);
    setCartCount(updatedCart.length);
    setAddedMessage('Added to cart!');
    setTimeout(() => {
      setAddedMessage('');
      closePopup();
    }, 800);
  };

  const removeFromCart = (indexToRemove) => {
    const updatedCart = cartItems.filter((_, index) => index !== indexToRemove);
    setCartItems(updatedCart);
    setCartCount(updatedCart.length);
    localStorage.setItem('cartItems', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>;

  return (
    <section className="best-selling-section">

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={removeFromCart}
      />

      <button
        type="button"
        className="men-back-arrow"
        aria-label="Go back to home"
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          background: 'transparent',
          color: '#050404',
          border: 'none',
          padding: 0,
          zIndex: 10,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '28px',
          lineHeight: 1,
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
      >
        ←
      </button>

      {/* Cart Button */}
      <button
        onClick={() => setCartOpen(true)}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          padding: '10px',
          background: '#f9fafd',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s, transform 0.2s',
          zIndex: 10,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#e5e7eb'; e.currentTarget.style.transform = 'scale(1.05)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#f9fafd'; e.currentTarget.style.transform = 'scale(1)'; }}
        aria-label="Open cart"
      >
        <ShoppingCart size={22} color="#374151" />
        {cartCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#e53e3e',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #fff',
          }}>{cartCount}</span>
        )}
      </button>

      <header className="best-selling-header">
        <div className="best-selling-title">Best Selling</div>
        <div className="category-filters">
          <button type="button" className="category-button" onClick={() => navigate('/man')}>Man</button>
          <button type="button" className="category-button" onClick={() => navigate('/women')}>Woman</button>
          <button type="button" className="category-button" onClick={() => navigate('/children')}>Child</button>
        </div>
      </header>

      {/* Admin delete message */}
      {deleteMessage && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          background: '#dc3545', color: '#fff', padding: '12px 24px',
          borderRadius: '8px', zIndex: 9999, fontWeight: 600
        }}>
          {deleteMessage}
        </div>
      )}

      <div className="cards-grid">
        {products.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', gridColumn: '1 / -1', padding: '40px' }}>
            No products available. {isAdmin && 'Add products from Admin Dashboard.'}
          </p>
        ) : (
          products.map((product) => (
            <article key={product._id} className="product-card" style={{ position: 'relative' }}>

              {/* Admin Delete Button */}
              {isAdmin && (
                <button
                  onClick={() => handleDelete(product._id)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: '#dc3545',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    cursor: 'pointer',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    transition: 'transform 0.2s, background 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = '#c82333'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#dc3545'; }}
                  title="Delete product"
                >
                  <Trash2 size={16} />
                </button>
              )}

              <div className="product-image-wrapper">
                <img
                  src={product.imageUrl || product.image || '/placeholder.png'}
                  alt={product.name}
                  className="product-image"
                  onError={(e) => { e.target.src = '/placeholder.png'; }}
                />
              </div>

              <div className="product-details">
                <h3 className="product-name">{product.name}</h3>
                <div className="product-pricing">
                  <span className="product-price">₹{product.price}</span>
                  <span className="product-old-price">₹{product.oldPrice || product.price * 1.2}</span>
                  <button
                    type="button"
                    className="card-action"
                    aria-label="View product details"
                    onClick={() => handleCardAction(product)}
                  >
                    <ArrowUpRight size={18} />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {selectedProduct && (
        <div className="product-popup-overlay" onClick={closePopup}>
          <div className="product-popup" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="popup-close" aria-label="Close" onClick={closePopup}>
              <X size={18} />
            </button>

            <div className="popup-image-wrapper">
              <img src={selectedProduct.imageUrl || selectedProduct.image} alt={selectedProduct.name} className="popup-image" />
            </div>

            <h3 className="popup-name">{selectedProduct.name}</h3>

            <div className="popup-pricing">
              <span className="popup-price">₹{selectedProduct.price}</span>
              <span className="popup-old-price">₹{selectedProduct.oldPrice || selectedProduct.price * 1.2}</span>
            </div>

            {addedMessage && (
              <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                <ShoppingCart size={16} /> {addedMessage}
              </div>
            )}

            <div className="popup-actions">
              <button type="button" className="popup-buy-now" onClick={() => { setPaymentProduct(selectedProduct); setShowPayment(true); }}>
                Buy Now
              </button>
              <button type="button" className="popup-add-cart" onClick={() => addToCart(selectedProduct)}>
                Add to cart
              </button>
            </div>
          </div>
        </div>
      )}
      <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} product={paymentProduct} />
    </section>
  );
};

export default BestSelling;