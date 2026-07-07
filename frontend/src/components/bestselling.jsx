import React, { useState, useEffect } from 'react';
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

const BestSelling = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addedMessage, setAddedMessage] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentProduct, setPaymentProduct] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState('');

  const user = getUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}?category=bestselling`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      } else {
        // Fallback to empty if API fails
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
        fetchProducts(); // Refresh list
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
    setAddedMessage('Added to cart!');
    setTimeout(() => {
      setAddedMessage('');
      closePopup();
      navigate('/');
    }, 800);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>;

  return (
    <section className="best-selling-section">

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