import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, X, ShoppingCart, Trash2 } from 'lucide-react';
import PaymentModal from './PaymentModel';

const womenProducts = [
  {
    id: 1,
    name: 'White Shoe',
    price: '₹2000.00',
    oldPrice: '₹3999.00',
    image: '/pink.png',
    isNew: true,
  },
  {
    id: 2,
    name: 'Grey Shoe',
    price: '₹3500.00',
    oldPrice: '₹4999.00',
    image: '/Grey.png',
    isNew: true,
  },
  {
    id: 3,
    name: 'Style Shoe',
    price: '₹4000.00',
    oldPrice: '₹5999.00',
    image: '/style.png',
    isNew: true,
  },
  {
    id: 4,
    name: 'Jogging Shoe',
    price: '₹3000.00',
    oldPrice: '₹4999.00',
    image: '/jogging.png',
    isNew: true,
  },
  {
    id: 5,
    name: 'Mix Sneker',
    price: '₹4000.00',
    oldPrice: '₹5999.00',
    image: '/mix.png',
    isNew: true,
  },
  {
    id: 6,
    name: 'Rose Sneker',
    price: '₹2500.00',
    oldPrice: '₹4999.00',
    image: '/rose.png',
    isNew: true,
  },
];

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
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: '70px',
                      height: '70px',
                      objectFit: 'contain',
                      borderRadius: '10px',
                      background: '#fff',
                    }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 600, color: '#111' }}>
                      {item.name}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>
                        {item.price}
                      </span>
                      <span style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'line-through' }}>
                        {item.oldPrice}
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

const Women = () => {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addedMessage, setAddedMessage] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentProduct, setPaymentProduct] = useState(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('cartItems')) || [];
    setCartItems(items);
    setCartCount(items.length);
  }, []);

  const addToCart = (product) => {
    const existingCart = JSON.parse(localStorage.getItem('cartItems')) || [];
    const updatedCart = [...existingCart, { ...product, cartId: Date.now() }];
    localStorage.setItem('cartItems', JSON.stringify(updatedCart));

    setCartItems(updatedCart);
    setCartCount(updatedCart.length);

    setAddedMessage('Added to cart!');
    setTimeout(() => {
      setAddedMessage('');
      setSelectedProduct(null);
    }, 800);
  };

  const removeFromCart = (indexToRemove) => {
    const updatedCart = cartItems.filter((_, index) => index !== indexToRemove);
    setCartItems(updatedCart);
    setCartCount(updatedCart.length);
    localStorage.setItem('cartItems', JSON.stringify(updatedCart));
  };

  return (
    <>
      <style>{`
        body, #root { background: #ffffff; }

        .women-section {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px 48px;
          position: relative;
          background: #ffffff;
        }

        .women-back-arrow {
          position: absolute;
          top: 24px;
          left: 24px;
          background: transparent;
          color: #111111;
          border: none;
          padding: 0;
          z-index: 10;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 28px;
          line-height: 1;
          transition: transform 0.2s ease;
        }

        .women-back-arrow:hover { transform: translateX(-2px); }

        .women-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 0 16px 0;
          margin-top: 40px;
        }

        .women-title {
          font-size: 28px;
          font-weight: 700;
          color: #111;
          margin: 0;
        }

        .women-cart-btn {
          position: relative;
          padding: 10px;
          background: #f3f4f6;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, transform 0.2s;
        }

        .women-cart-btn:hover {
          background: #e5e7eb;
          transform: scale(1.05);
        }

        .women-cart-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #e53e3e;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #fff;
        }

        .women-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
          padding: 24px 0;
          box-sizing: border-box;
        }

        .women-product-card {
          background: #f7f6f6;
          border-radius: 24px;
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
          border: 1px solid rgba(229, 231, 235, 0.8);
          overflow: hidden;
          position: relative;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
          box-sizing: border-box;
          width: 100%;
          max-width: 280px;
          margin: 0 auto;
        }

        .women-product-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 28px 60px rgba(15, 23, 42, 0.12);
        }

        .women-product-image-wrapper {
          position: relative;
          padding: 16px;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 200px;
        }

        .women-new-badge {
          position: absolute;
          top: 20px;
          left: 20px;
          background: #0a0909;
          color: #f9f7f7;
          padding: 6px 12px;
          font-size: 10px;
          font-weight: 700;
          border-radius: 999px;
          z-index: 2;
          font-family: poppins, sans-serif;
        }

        .women-product-image {
          width: 100%;
          max-width: 220px;
          object-fit: contain;
          transition: transform 0.3s ease;
          position: relative;
          z-index: 1;
        }

        .women-product-card:hover .women-product-image {
          transform: translateY(-12px) scale(1.05);
        }

        .women-product-details {
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          flex: 1;
        }

        .women-product-name {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 16px;
        }

        .women-product-pricing {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .women-product-price {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }

        .women-product-old-price {
          font-size: 14px;
          color: #6b7280;
          text-decoration: line-through;
        }

        .women-card-action {
          width: 40px;
          height: 44px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #080808;
          color: #f9f3f3;
          cursor: pointer;
          border: none;
          transition: background-color 0.25s ease, transform 0.25s ease;
          position: relative;
          z-index: 5;
          pointer-events: auto;
        }

        .women-card-action:hover {
          background: #1f2937;
          transform: scale(1.05);
        }

        .women-popup-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }

        .women-popup {
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
        }

        .women-popup-close {
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

        .women-popup-close:hover { background: #e5e7eb; }

        .women-popup-image-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 16px;
        }

        .women-popup-image {
          width: 100%;
          max-width: 220px;
          object-fit: contain;
        }

        .women-popup-name {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }

        .women-popup-pricing {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .women-popup-price {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
        }

        .women-popup-old-price {
          font-size: 13px;
          color: #6b7280;
          text-decoration: line-through;
        }

        .women-popup-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .women-popup-buy-now,
        .women-popup-add-cart {
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

        .women-popup-buy-now:hover,
        .women-popup-add-cart:hover {
          background: #111827;
          color: #ffffff;
        }

        .women-added-msg {
          color: #22c55e;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          justify-content: center;
        }

        @media (max-width: 1024px) {
          .women-cards-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 720px) {
          .women-section { padding: 32px 16px; }
          .women-cards-grid { grid-template-columns: 1fr; }
          .women-product-image-wrapper { padding: 18px; }
        }
      `}</style>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={removeFromCart}
      />

      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        product={paymentProduct}
      />

      <section className="women-section">
        <button
          type="button"
          className="women-back-arrow"
          aria-label="Go back to best selling"
          onClick={() => navigate('/best-selling')}
        >
          ←
        </button>

        <div className="women-header">
          <h1 className="women-title">Women's Collection</h1>
          <button
            className="women-cart-btn"
            onClick={() => setCartOpen(true)}
            aria-label="Open cart"
          >
            <ShoppingCart size={22} color="#374151" />
            {cartCount > 0 && (
              <span className="women-cart-badge">{cartCount}</span>
            )}
          </button>
        </div>

        <div className="women-cards-grid">
          {womenProducts.map((product) => (
            <div key={product.id} className="women-product-card">
              <div className="women-product-image-wrapper">
                {product.isNew && <span className="women-new-badge">NEW</span>}
                <img
                  src={product.image}
                  alt={product.name}
                  className="women-product-image"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/220x160?text=Shoe';
                  }}
                />
              </div>
              <div className="women-product-details">
                <p className="women-product-name">{product.name}</p>
                <div className="women-product-pricing">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span className="women-product-price">{product.price}</span>
                    <span className="women-product-old-price">{product.oldPrice}</span>
                  </div>
                  <button
                    type="button"
                    className="women-card-action"
                    aria-label={`View ${product.name}`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <ArrowUpRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Popup */}
        {selectedProduct && (
          <div className="women-popup-overlay" onClick={() => setSelectedProduct(null)}>
            <div className="women-popup" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="women-popup-close"
                aria-label="Close"
                onClick={() => setSelectedProduct(null)}
              >
                <X size={14} />
              </button>

              <div className="women-popup-image-wrapper">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="women-popup-image"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/220x160?text=Shoe';
                  }}
                />
              </div>

              <h3 className="women-popup-name">{selectedProduct.name}</h3>

              <div className="women-popup-pricing">
                <span className="women-popup-price">{selectedProduct.price}</span>
                <span className="women-popup-old-price">{selectedProduct.oldPrice}</span>
              </div>

              {addedMessage && (
                <div className="women-added-msg">
                  <ShoppingCart size={16} />
                  {addedMessage}
                </div>
              )}

              <div className="women-popup-actions">
                <button 
                  type="button" 
                  className="women-popup-buy-now"
                  onClick={() => {
                    setPaymentProduct(selectedProduct);
                    setShowPayment(true);
                  }}
                >
                  Buy Now
                </button>
                <button
                  type="button"
                  className="women-popup-add-cart"
                  onClick={() => addToCart(selectedProduct)}
                >
                  Add to cart
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default Women;