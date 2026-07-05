import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  // 🔥 DEBUG: Show what Vite actually sees
  useEffect(() => {
    const raw = import.meta.env.VITE_API_URL;
    console.log('VITE_API_URL:', raw);
    console.log('Type:', typeof raw);
    setDebugInfo(`Env: ${JSON.stringify(raw)} | Type: ${typeof raw}`);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    // ==========================================
    // 🔥 FIX: Hardcoded fallback + aggressive cleaning
    // ==========================================
    let baseUrl = import.meta.env.VITE_API_URL;
    
    // If env var is undefined, use hardcoded fallback
    if (!baseUrl) {
      baseUrl = 'http://192.168.1.6:8080';
      console.warn('VITE_API_URL not found, using fallback');
    }

    // Convert to string and clean thoroughly
    baseUrl = String(baseUrl)
      .trim()
      .replace(/^["']+/, '')      // Remove leading quotes
      .replace(/["']+$/, '')      // Remove trailing quotes
      .replace(/\/+$/, '');       // Remove trailing slashes

    const apiUrl = `${baseUrl}/api/auth/forgot-password`;

    // 🔥 Validate URL before fetch
    let validatedUrl;
    try {
      validatedUrl = new URL(apiUrl).toString();
    } catch (urlErr) {
      setDebugInfo(`❌ Invalid URL: "${apiUrl}"\nBase: "${baseUrl}"\nError: ${urlErr.message}`);
      setError('Configuration error. Check console.');
      setLoading(false);
      return;
    }

    setDebugInfo(`📡 URL: ${validatedUrl}`);

    try {
      const res = await fetch(validatedUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || 'Check your email for the reset link.');
        setEmail('');
      } else {
        setError(data.message || 'Request failed.');
      }
    } catch (err) {
      setError('Network error. Check connection.');
      setDebugInfo(`❌ ${err.message}\nURL: ${validatedUrl}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Reset Password</h1>
        <p style={{ textAlign: 'center', marginBottom: '20px', color: '#555' }}>
          Enter your email and we'll send you a link to reset your password.
        </p>

        {message && (
          <div style={{ background: '#e6ffed', border: '1px solid #b7e1cd', color: '#2e7d32', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', color: '#c62828', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* 🔥 DEBUG BLOCK */}
        {debugInfo && (
          <div style={{ background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', fontFamily: 'monospace', wordBreak: 'break-all', color: '#333' }}>
            <strong>🔍 Debug:</strong><br/>
            {debugInfo}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '14px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
          >
            {loading ? 'SENDING...' : 'SEND RESET LINK'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          Remember your password?{' '}
          <span style={{ color: '#1976d2', cursor: 'pointer' }} onClick={() => navigate('/login')}>
            Login
          </span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;