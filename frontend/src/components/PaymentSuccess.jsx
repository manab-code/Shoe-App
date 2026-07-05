import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);

  const method = searchParams.get('method');
  const transactionId = searchParams.get('transaction_id');

  useEffect(() => {
    const timer = setTimeout(() => setVerifying(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '60px 20px',
      maxWidth: '500px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        width: '80px', 
        height: '80px', 
        background: '#dcfce7', 
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px'
      }}>
        <CheckCircle size={40} color="#16a34a" />
      </div>
      
      <h1 style={{ fontSize: '28px', marginBottom: '8px', color: '#111' }}>
        Payment Successful!
      </h1>
      
      {verifying ? (
        <p style={{ color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> 
          Confirming your payment...
        </p>
      ) : (
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          Your order has been confirmed and is being processed.
        </p>
      )}
      
      <div style={{ 
        background: '#f9fafb', 
        padding: '20px', 
        borderRadius: '12px',
        margin: '24px 0',
        textAlign: 'left'
      }}>
        <p style={{ margin: '8px 0', color: '#374151' }}>
          <strong>Payment Method:</strong> {method?.toUpperCase() || 'N/A'}
        </p>
        <p style={{ margin: '8px 0', color: '#374151' }}>
          <strong>Transaction ID:</strong>{' '}
          <code style={{ 
            background: '#e5e7eb', 
            padding: '2px 8px', 
            borderRadius: '4px', 
            fontSize: '14px'
          }}>
            {transactionId || 'N/A'}
          </code>
        </p>
      </div>

      <button 
        onClick={() => navigate('/')}
        style={{
          padding: '14px 32px',
          background: '#16a34a',
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '600',
          width: '100%'
        }}
      >
        Continue Shopping
      </button>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PaymentSuccess;