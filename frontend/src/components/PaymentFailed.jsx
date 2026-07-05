import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reason = searchParams.get('reason') || 'Unknown error occurred';

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
        background: '#fee2e2', 
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px'
      }}>
        <XCircle size={40} color="#dc2626" />
      </div>

      <h1 style={{ fontSize: '28px', marginBottom: '8px', color: '#111' }}>
        Payment Failed
      </h1>
      
      <div style={{ 
        background: '#fef2f2', 
        padding: '16px 20px', 
        borderRadius: '12px',
        margin: '20px 0',
        border: '1px solid #fecaca'
      }}>
        <p style={{ margin: 0, color: '#991b1b', fontSize: '14px' }}>
          <strong>Error:</strong> {decodeURIComponent(reason)}
        </p>
      </div>

      <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
        Don't worry — your money is safe. You can try again or choose a different payment method.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
        <button 
          onClick={() => navigate('/')}
          style={{
            padding: '14px 32px',
            background: '#111',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <ArrowLeft size={18} />
          Back to Shopping
        </button>
        
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '14px 32px',
            background: '#fff',
            color: '#111',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default PaymentFailed;