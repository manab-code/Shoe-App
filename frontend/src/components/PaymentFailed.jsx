import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react';

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [retrying, setRetrying] = useState(false);

  const reason = searchParams.get('reason') || 'Unknown error occurred';
  const method = searchParams.get('method') || '';

  const getFriendlyError = (rawReason) => {
    const decoded = decodeURIComponent(rawReason).toLowerCase();
    if (decoded.includes('cancelled')) return 'You cancelled the payment process.';
    if (decoded.includes('verification_failed')) return 'We could not verify your payment with the provider.';
    if (decoded.includes('server_error')) return 'Our server encountered an issue. Please try again later.';
    if (decoded.includes('invalid_signature')) return 'Payment security check failed. Please try again.';
    if (decoded.includes('timeout')) return 'The payment session timed out. Please try again.';
    if (decoded.includes('insufficient')) return 'Insufficient balance in your wallet.';
    return decodeURIComponent(rawReason);
  };

  const handleRetry = () => {
    setRetrying(true);
    // Small delay to show loading state before reload
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleBack = () => {
    navigate('/');
  };

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
        margin: '0 auto 24px',
        animation: 'shake 0.5s ease-in-out'
      }}>
        <XCircle size={40} color="#dc2626" />
      </div>

      <h1 style={{ fontSize: '28px', marginBottom: '8px', color: '#111', fontWeight: 700 }}>
        Payment Failed
      </h1>

      <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '15px' }}>
        We couldn't complete your transaction. Don't worry — your money is safe.
      </p>

      <div style={{ 
        background: '#fef2f2', 
        padding: '16px 20px', 
        borderRadius: '12px',
        margin: '20px 0',
        border: '1px solid #fecaca',
        textAlign: 'left'
      }}>
        <p style={{ margin: '0 0 4px 0', color: '#991b1b', fontSize: '13px', fontWeight: 600 }}>
          ERROR DETAILS
        </p>
        <p style={{ margin: 0, color: '#7f1d1d', fontSize: '14px', lineHeight: '1.5' }}>
          {getFriendlyError(reason)}
        </p>
        {method && (
          <p style={{ margin: '8px 0 0 0', color: '#991b1b', fontSize: '12px' }}>
            Method: {method.toUpperCase()}
          </p>
        )}
      </div>

      <div style={{ 
        background: '#f0fdf4', 
        padding: '14px 18px', 
        borderRadius: '10px',
        margin: '16px 0 24px 0',
        border: '1px solid #bbf7d0',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        textAlign: 'left'
      }}>
        <HelpCircle size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={{ margin: 0, color: '#166534', fontSize: '13px', lineHeight: '1.5' }}>
          You can try again with the same method, or switch to a different payment option. 
          If the problem persists, contact our support team.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
        <button 
          onClick={handleBack}
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
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#374151'}
          onMouseLeave={(e) => e.target.style.background = '#111'}
        >
          <ArrowLeft size={18} />
          Back to Shopping
        </button>

        <button 
          onClick={handleRetry}
          disabled={retrying}
          style={{
            padding: '14px 32px',
            background: '#fff',
            color: retrying ? '#9ca3af' : '#111',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            cursor: retrying ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          {retrying ? (
            <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <RefreshCw size={18} />
          )}
          {retrying ? 'Retrying...' : 'Try Again'}
        </button>
      </div>

      <style>{`        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
};

export default PaymentFailed;