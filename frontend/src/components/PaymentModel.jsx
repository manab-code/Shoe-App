import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, product }) => {
  const [loading, setLoading] = useState({ esewa: false, khalti: false, cod: false });
  
  if (!isOpen || !product) return null;

  const BACKEND_URL = 'http://localhost:8080';

  const getToken = () => {
    return localStorage.getItem('token') 
      || localStorage.getItem('jwt') 
      || localStorage.getItem('authToken')
      || '';
  };

  const handleEsewa = async () => {
    setLoading(prev => ({ ...prev, esewa: true }));
    try {
      const amount = parseFloat(product.price.replace(/[^0-9.]/g, ''));
      if (isNaN(amount) || amount <= 0) throw new Error('Invalid amount');

      const token = getToken();
      if (!token) {
        alert('Please login first!');
        setLoading(prev => ({ ...prev, esewa: false }));
        return;
      }

      console.log('Initiating eSewa payment...');

      const response = await fetch(`${BACKEND_URL}/api/payment/esewa/initiate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount,
          productName: product.name,
          productId: product.id || product._id,
        }),
      });

      const data = await response.json();
      console.log('Backend response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || data.error || `Server error: ${response.status}`);
      }

      if (!data.success || !data.payload) {
        throw new Error(data.message || 'Failed to initiate payment');
      }

      // Create form and submit to eSewa
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.esewa_url;
      form.target = '_self'; // Important: submit in same window
      form.style.display = 'none';

      const payload = data.payload;
      
      Object.entries(payload).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      
      console.log('Submitting to eSewa:', data.esewa_url);
      console.log('Payload:', payload);
      
      // Small delay to ensure form is in DOM
      setTimeout(() => {
        form.submit();
        // Clean up form after submission
        setTimeout(() => {
          if (form.parentNode) form.parentNode.removeChild(form);
        }, 1000);
      }, 100);
      
    } catch (error) {
      console.error('eSewa Error:', error);
      alert('eSewa Error: ' + error.message);
      setLoading(prev => ({ ...prev, esewa: false }));
    }
  };

  const handleKhalti = async () => {
    setLoading(prev => ({ ...prev, khalti: true }));
    try {
      const amount = parseFloat(product.price.replace(/[^0-9.]/g, ''));
      const token = getToken();
      if (!token) {
        alert('Please login first!');
        setLoading(prev => ({ ...prev, khalti: false }));
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/payment/khalti/initiate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount,
          productName: product.name,
          productId: product.id || product._id,
        }),
      });

      const data = await response.json();
      if (data.success && data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        alert('Payment initiation failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Khalti Error:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(prev => ({ ...prev, khalti: false }));
    }
  };

  const handleCOD = async () => {
    setLoading(prev => ({ ...prev, cod: true }));
    try {
      const amount = parseFloat(product.price.replace(/[^0-9.]/g, ''));
      const token = getToken();
      if (!token) {
        alert('Please login first!');
        setLoading(prev => ({ ...prev, cod: false }));
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/payment/cod/initiate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount,
          productName: product.name,
          productId: product.id || product._id,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        window.location.href = `/payment/success?method=cod&transaction_id=${data.transactionId}`;
      } else {
        alert('COD order failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('COD Error:', error);
      alert('COD Error: ' + error.message);
    } finally {
      setLoading(prev => ({ ...prev, cod: false }));
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
            className="payment-option esewa" 
            onClick={handleEsewa}
            disabled={loading.esewa}
          >
            {loading.esewa ? <Loader2 size={18} className="spin" /> : <span>📱</span>}
            {loading.esewa ? 'Redirecting...' : 'eSewa'}
          </button>
          <button 
            className="payment-option khalti" 
            onClick={handleKhalti}
            disabled={loading.khalti}
          >
            {loading.khalti ? <Loader2 size={18} className="spin" /> : <span>💳</span>}
            {loading.khalti ? 'Redirecting...' : 'Khalti'}
          </button>
          <button 
            className="payment-option cod" 
            onClick={handleCOD}
            disabled={loading.cod}
          >
            {loading.cod ? <Loader2 size={18} className="spin" /> : <span>💵</span>}
            {loading.cod ? 'Processing...' : 'Cash on Delivery'}
          </button>
        </div>
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
          font-size: 20px;
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
          padding: 14px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fafafa;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .payment-option:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .payment-option.esewa:hover:not(:disabled) {
          background: #60bb46;
          color: white;
          border-color: #60bb46;
        }
        .payment-option.khalti:hover:not(:disabled) {
          background: #5c2d91;
          color: white;
          border-color: #5c2d91;
        }
        .payment-option.cod:hover:not(:disabled) {
          background: #f59e0b;
          color: white;
          border-color: #f59e0b;
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