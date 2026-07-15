import React, { useState } from 'react';
import { X, Loader2, CreditCard, Truck } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, product }) => {
  const [loading, setLoading] = useState({ khalti: false, cod: false });
  const [selectedMethod, setSelectedMethod] = useState(null);

  if (!isOpen || !product) return null;

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

  const getToken = () => {
    return localStorage.getItem('token') 
      || localStorage.getItem('jwt') 
      || localStorage.getItem('authToken')
      || '';
  };

  const getAuthHeaders = () => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  const extractAmount = () => {
    let price = product.price;
    
    // Handle different price formats
    if (typeof price === 'number') {
      price = price.toString();
    }
    
    if (typeof price !== 'string') {
      console.error('Invalid price type:', typeof price, price);
      throw new Error('Invalid product price format');
    }
    
    // Remove currency symbols and commas, keep only numbers and dots
    const cleanPrice = price.replace(/[^0-9.]/g, '');
    const amount = parseFloat(cleanPrice);
    
    if (isNaN(amount) || amount <= 0) {
      throw new Error(`Invalid product amount: ${price} (cleaned: ${cleanPrice})`);
    }
    return amount;
  };

  const handleKhalti = async () => {
    setSelectedMethod('khalti');
    setLoading(prev => ({ ...prev, khalti: true }));
    
    try {
      const amount = extractAmount();
      const token = getToken();
      
      if (!token) {
        alert('Please login first!');
        setLoading(prev => ({ ...prev, khalti: false }));
        setSelectedMethod(null);
        return;
      }

      const productId = product.id || product._id;
      if (!productId) {
        throw new Error('Product ID is missing');
      }

      console.log('Sending Khalti request:', {
        amount,
        productName: product.name,
        productId,
      });

      const response = await fetch(`${BACKEND_URL}/api/payment/khalti/initiate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount,
          productName: product.name || 'Product',
          productId: productId.toString(),
        }),
      });

      const data = await response.json();
      console.log('Khalti response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || data.error || `Server error: ${response.status}`);
      }

      if (data.success && data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        throw new Error(data.message || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('Khalti Error:', error);
      alert('Khalti Error: ' + error.message);
      setLoading(prev => ({ ...prev, khalti: false }));
      setSelectedMethod(null);
    }
  };

  const handleCOD = async () => {
    setSelectedMethod('cod');
    setLoading(prev => ({ ...prev, cod: true }));
    
    try {
      const amount = extractAmount();
      const token = getToken();
      
      if (!token) {
        alert('Please login first!');
        setLoading(prev => ({ ...prev, cod: false }));
        setSelectedMethod(null);
        return;
      }

      const productId = product.id || product._id;
      if (!productId) {
        throw new Error('Product ID is missing');
      }

      const response = await fetch(`${BACKEND_URL}/api/payment/cod/initiate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount,
          productName: product.name || 'Product',
          productId: productId.toString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `Server error: ${response.status}`);
      }

      if (data.success) {
        window.location.href = `/payment/success?method=cod&transaction_id=${data.transactionId}&order_id=${data.orderId}`;
      } else {
        throw new Error(data.message || 'COD order failed');
      }
    } catch (error) {
      console.error('COD Error:', error);
      alert('COD Error: ' + error.message);
      setLoading(prev => ({ ...prev, cod: false }));
      setSelectedMethod(null);
    }
  };

  return (
    <div className="payment-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <button className="payment-close" onClick={onClose}>
          <X size={18} />
        </button>

        <h3 className="payment-title">Payment</h3>
        <p className="payment-sub">Choose your payment method for {product.name}</p>
        <p className="payment-amount">{product.price}</p>

        <div className="payment-options">
          <button 
            className={`payment-option khalti ${selectedMethod === 'khalti' ? 'selected' : ''}`}
            onClick={handleKhalti}
            disabled={loading.khalti || loading.cod}
          >
            {loading.khalti ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <CreditCard size={18} />
            )}
            {loading.khalti ? 'Redirecting to Khalti...' : 'Pay with Khalti'}
          </button>

          <button 
            className={`payment-option cod ${selectedMethod === 'cod' ? 'selected' : ''}`}
            onClick={handleCOD}
            disabled={loading.khalti || loading.cod}
          >
            {loading.cod ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <Truck size={18} />
            )}
            {loading.cod ? 'Placing order...' : 'Cash on Delivery'}
          </button>
        </div>

        <p className="payment-note">
          🔒 Your payment is secured with industry-standard encryption
        </p>
      </div>

      <style>{`
        .payment-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          backdrop-filter: blur(4px);
        }
        .payment-modal {
          background: #fff;
          border-radius: 20px;
          padding: 32px 24px 28px;
          max-width: 360px;
          width: 100%;
          position: relative;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .payment-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #f3f4f6;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }
        .payment-close:hover {
          background: #e5e7eb;
        }
        .payment-title {
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 6px;
          color: #111;
        }
        .payment-sub {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 8px;
        }
        .payment-amount {
          font-size: 24px;
          font-weight: 700;
          color: #111;
          margin: 0 0 24px;
        }
        .payment-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .payment-option {
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 14px;
          background: #fafafa;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #374151;
        }
        .payment-option:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .payment-option.khalti:hover:not(:disabled),
        .payment-option.khalti.selected {
          background: #5c2d91;
          color: white;
          border-color: #5c2d91;
        }
        .payment-option.cod:hover:not(:disabled),
        .payment-option.cod.selected {
          background: #f59e0b;
          color: white;
          border-color: #f59e0b;
        }
        .payment-note {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 16px;
          margin-bottom: 0;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default PaymentModal;