import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, X, ShoppingCart } from 'lucide-react';
import './bestselling.css';
 
const products = [
  {
    id: 1,
    name: 'Nike Sport Shoe',
    price: '₹3999.00',
    oldPrice: '₹4999.00',
    image: '/nikesport.png',
  },
  {
    id: 2,
    name: 'Sneakers shoe for man',
    price: '₹2999.00',
    oldPrice: '₹4999.00',
    image: '/snekerblue.png',
  },
  {
    id: 3,
    name: 'Trendy Slick Pro',
    price: '₹3999.00',
    oldPrice: '₹4999.00',
    image: '/whiteshoe2.png',
  },
  {
    id: 4,
    name: 'Slick running shoes',
    price: '₹2999.00',
    oldPrice: '₹4999.00',
    image: '/slick.png',
  },
  {
    id: 5,
    name: 'Formal canvas shoe for man',
    price: '₹2999.00',
    oldPrice: '₹4999.00',
    image: 'canvasshoe.png',
  },
  {
    id: 6,
    name: 'Running Shoe',
    price: '₹2999.00',
    oldPrice: '₹4999.00',
    image: "/running.png",
  },
];
 
const BestSelling = () => {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addedMessage, setAddedMessage] = useState('');
 
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
      navigate('/'); // Navigate to home where cart is displayed
    }, 800);
  };
 
  return (
    <section className="best-selling-section">
 
      {/* ── Back arrow (same as man.jsx) ── */}
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
          <button type="button" className="category-button" onClick={() => navigate('/man')}>
            Man
          </button>
          <button type="button" className="category-button" onClick={() => navigate('/women')}>
            Woman
          </button>
          <button type="button" className="category-button" onClick={() => navigate('/children')}>
            Child
          </button>
        </div>
      </header>
 
      <div className="cards-grid">
        {products.map((product) => (
          <article key={product.id} className="product-card">
            <div className="product-image-wrapper">
              <img
                src={product.image}
                alt={product.name}
                className="product-image"
              />
            </div>
 
            <div className="product-details">
              <h3 className="product-name">{product.name}</h3>
 
              <div className="product-pricing">
                <span className="product-price">{product.price}</span>
                <span className="product-old-price">{product.oldPrice}</span>
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
        ))}
      </div>
 
      {selectedProduct && (
        <div className="product-popup-overlay" onClick={closePopup}>
          <div className="product-popup" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="popup-close"
              aria-label="Close"
              onClick={closePopup}
            >
              <X size={18} />
            </button>
 
            <div className="popup-image-wrapper">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="popup-image"
              />
            </div>
 
            <h3 className="popup-name">{selectedProduct.name}</h3>
 
            <div className="popup-pricing">
              <span className="popup-price">{selectedProduct.price}</span>
              <span className="popup-old-price">{selectedProduct.oldPrice}</span>
            </div>
 
            {addedMessage && (
              <div style={{
                color: '#22c55e',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                justifyContent: 'center'
              }}>
                <ShoppingCart size={16} />
                {addedMessage}
              </div>
            )}
 
            <div className="popup-actions">
              <button type="button" className="popup-buy-now">
                Buy Now
              </button>
              <button 
                type="button" 
                className="popup-add-cart"
                onClick={() => addToCart(selectedProduct)}
              >
                Add to cart
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
 
export default BestSelling;