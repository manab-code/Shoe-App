// src/pages/Login.jsx
// Email login → Node.js /api/auth/login
// Google/Facebook login → Node.js /api/auth/google & /api/auth/facebook
// NEVER calls Apps Script directly

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BACKEND_URL, GOOGLE_CLIENT_ID, FACEBOOK_APP_ID } from '../config/api';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const leftShoeRef = useRef(null);
  const rightShoeRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (window.innerWidth / 2 - e.clientX) / 50;
      const y = (window.innerHeight / 2 - e.clientY) / 50;
      if (leftShoeRef.current && !leftShoeRef.current.matches(':hover')) {
        leftShoeRef.current.style.transform = `rotate(-15deg) translate(${x}px, ${y}px)`;
      }
      if (rightShoeRef.current && !rightShoeRef.current.matches(':hover')) {
        rightShoeRef.current.style.transform = `rotate(10deg) translate(${-x}px, ${-y}px)`;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Login failed');
        setLoading(false);
        return;
      }

      login(data.token, data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to reach the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!window.google) {
      alert('Google SDK not loaded yet. Please wait...');
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'email profile',
      callback: async (tokenResponse) => {
        try {
          const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          }).then((res) => res.json());

          const response = await fetch(`${BACKEND_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: userInfo.name,
              email: userInfo.email,
              googleId: userInfo.sub,
              picture: userInfo.picture,
            }),
          });

          const data = await response.json();

          if (data.success) {
            login(data.token, data.user);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate(data.user.role === 'admin' ? '/dashboard' : '/');
          } else {
            setError(data.message);
          }
        } catch (err) {
          setError('Google login failed. Please try again.');
        }
      },
    });
    client.requestAccessToken();
  };

  const handleFacebookLogin = () => {
    if (!window.FB) {
      alert('Facebook SDK not loaded yet. Please wait...');
      return;
    }

    window.FB.login(
      (response) => {
        if (response.authResponse) {
          window.FB.api('/me', { fields: 'name,email,picture' }, async (userInfo) => {
            try {
              const res = await fetch(`${BACKEND_URL}/api/auth/facebook`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: userInfo.name,
                  email: userInfo.email,
                  facebookId: userInfo.id,
                  picture: userInfo.picture?.data?.url,
                }),
              });

              const data = await res.json();

              if (data.success) {
                login(data.token, data.user);
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate(data.user.role === 'admin' ? '/dashboard' : '/');
              } else {
                setError(data.message);
              }
            } catch (err) {
              setError('Facebook login failed. Please try again.');
            }
          });
        } else {
          setError('Facebook login was cancelled');
        }
      },
      { scope: 'email,public_profile' }
    );
  };

  const handleShoeClick = (e, productName) => {
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute; border-radius: 50%; background: rgba(248, 243, 243, 0.6);
      transform: scale(0); animation: shoeRipple 0.6s ease-out; pointer-events: none;
      width: ${Math.max(rect.width, rect.height)}px; height: ${Math.max(rect.width, rect.height)}px;
      left: ${e.clientX - rect.left - Math.max(rect.width, rect.height) / 2}px;
      top: ${e.clientY - rect.top - Math.max(rect.width, rect.height) / 2}px;
    `;
    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
    const isLeft = element.classList.contains('shoe-top-left');
    element.style.transform = isLeft
      ? 'rotate(-8deg) scale(0.9) translateY(5px)'
      : 'rotate(6deg) scale(0.9) translateY(5px)';
    setTimeout(() => { element.style.transform = ''; }, 200);
  };

  useEffect(() => {
    const googleScript = document.createElement('script');
    googleScript.src = 'https://accounts.google.com/gsi/client';
    googleScript.async = true;
    googleScript.defer = true;
    document.body.appendChild(googleScript);

    const fbScript = document.createElement('script');
    fbScript.src = 'https://connect.facebook.net/en_US/sdk.js';
    fbScript.async = true;
    fbScript.defer = true;
    fbScript.crossOrigin = 'anonymous';
    fbScript.onload = () => {
      window.fbAsyncInit = () => {
        window.FB.init({ appId: FACEBOOK_APP_ID || '0', cookie: true, xfbml: true, version: 'v18.0' });
      };
    };
    document.body.appendChild(fbScript);

    return () => {
      document.body.removeChild(googleScript);
      document.body.removeChild(fbScript);
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes shoeRipple { to { transform: scale(4); opacity: 0; } }
        @keyframes shoeEnterTL { 0% { transform: rotate(-15deg) translateY(-50px) translateX(-50px); opacity: 0; } 100% { transform: rotate(-15deg) translateY(0) translateX(0); opacity: 1; } }
        @keyframes shoeEnterBR { 0% { transform: rotate(10deg) translateY(50px) translateX(50px); opacity: 0; } 100% { transform: rotate(10deg) translateY(0) translateX(0); opacity: 1; } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, #root { background: #f5f0f0; min-height: 100vh; }
        .login-page { min-height: 100vh; background: #f5f0f0; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; font-family: 'Poppins', sans-serif; }
        .shoe-top-left { position: absolute; top: -20px; left: -30px; width: 220px; transform: rotate(-15deg); cursor: pointer; transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.4s ease; z-index: 1; filter: drop-shadow(4px 8px 12px rgba(241, 233, 233, 0.15)); user-select: none; animation: shoeEnterTL 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .shoe-top-left:hover { transform: rotate(-5deg) scale(1.15) translateY(-10px) translateX(5px) !important; filter: drop-shadow(8px 16px 24px rgba(244, 236, 236, 0.25)) brightness(1.05); }
        .shoe-bottom-right { position: absolute; bottom: -20px; right: -30px; width: 230px; transform: rotate(10deg); cursor: pointer; transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.4s ease; z-index: 1; filter: drop-shadow(-4px 8px 12px rgba(255, 252, 252, 0.15)); user-select: none; animation: shoeEnterBR 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards; opacity: 0; }
        .shoe-bottom-right:hover { transform: rotate(2deg) scale(1.15) translateY(-10px) translateX(-5px) !important; filter: drop-shadow(-8px 16px 24px rgba(255, 250, 250, 0.25)) brightness(1.05); }
        .login-card { background: #ffffff; border-radius: 28px; padding: 48px 44px 40px; width: 100%; max-width: 480px; position: relative; z-index: 2; box-shadow: 0 20px 60px rgba(10, 10, 10, 0.08); margin: 20px; }
        .login-title { text-align: center; font-size: 36px; font-weight: 800; color: #111111; margin-bottom: 32px; letter-spacing: -0.5px; }
        .error-banner { background: #fff0f0; border: 1.5px solid #ffcccc; border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; font-size: 13px; color: #cc2222; display: flex; align-items: center; gap: 8px; animation: shake 0.4s ease; }
        .input-group { position: relative; margin-bottom: 16px; }
        .input-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); font-size: 17px; color: #888; pointer-events: none; }
        .login-input { width: 100%; padding: 16px 48px 16px 48px; border: 1.5px solid #e0e0e0; border-radius: 14px; font-size: 15px; color: #111; background: #fafafa; outline: none; font-family: 'Poppins', sans-serif; transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease, transform 0.2s ease; }
        .login-input::placeholder { color: #aaaaaa; }
        .login-input:hover { border-color: #b0b0b0; background: #f0f0f0; transform: scale(1.01); }
        .login-input:focus { border-color: #111111; box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.08); background: #ffffff; transform: scale(1.01); }
        .login-input:disabled { opacity: 0.6; cursor: not-allowed; }
        .eye-toggle { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 17px; color: #888; padding: 4px; }
        .eye-toggle:hover { color: #111; transform: translateY(-50%) scale(1.15); }
        .login-options { display: flex; align-items: center; justify-content: space-between; margin: 18px 0 28px; }
        .remember-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: #555; user-select: none; }
        .custom-checkbox { width: 18px; height: 18px; border: 2px solid #ccc; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; }
        .forgot-link { font-size: 13px; color: #555; text-decoration: none; }
        .forgot-link:hover { color: #111; text-decoration: underline; }
        .login-btn { width: 100%; padding: 16px; background: #f5f0eb; color: #111111; border: none; border-radius: 14px; font-size: 15px; font-weight: 700; letter-spacing: 1.5px; cursor: pointer; font-family: 'Poppins', sans-serif; transition: background 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease, color 0.25s ease; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .login-btn:hover:not(:disabled) { background: #111111; color: #ffffff; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(17, 17, 17, 0.2); }
        .login-btn:active:not(:disabled) { transform: translateY(0px); box-shadow: none; }
        .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .spinner { width: 16px; height: 16px; border: 2.5px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .signup-row { text-align: center; font-size: 13.5px; color: #666; }
        .signup-link { color: #111111; font-weight: 700; text-decoration: none; margin-left: 4px; position: relative; }
        .signup-link::after { content: ''; position: absolute; bottom: -1px; left: 0; width: 0%; height: 2px; background: #111111; transition: width 0.25s ease; }
        .signup-link:hover::after { width: 100%; }
        .signup-link:hover { color: #333; }
        .social-btn { width: 100%; padding: 14px; border: none; border-radius: 10px; margin-bottom: 12px; cursor: pointer; font-size: 15px; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 10px; transition: transform 0.2s, box-shadow 0.2s; }
        .social-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .facebook-btn { background: #1877f2; color: white; }
        .google-btn { background: white; border: 1.5px solid #ddd; color: #333; }
        .divider { text-align: center; margin: 24px 0; color: #888; font-size: 13px; font-weight: bold; letter-spacing: 1px; }
        @media (max-width: 520px) { .login-card { margin: 16px; padding: 36px 24px 32px; } .shoe-top-left { width: 140px; top: -10px; left: -20px; } .shoe-bottom-right { width: 150px; bottom: -10px; right: -20px; } }
      `}</style>

      <div className="login-page">
        <img ref={leftShoeRef} src="/shoe-left.png" alt="Red sneaker" className="shoe-top-left" onClick={(e) => handleShoeClick(e, 'Nike Air Max - $129')} onError={(e) => { e.currentTarget.src = 'side-red.png'; }} />
        <img ref={rightShoeRef} src="/shoe-right.png" alt="White and orange sneaker" className="shoe-bottom-right" onClick={(e) => handleShoeClick(e, 'Nike Metcon - $149')} onError={(e) => { e.currentTarget.src = 'side-mix.png'; }} />

        <div className="login-card">
          <h1 className="login-title">Login</h1>

          <button className="social-btn facebook-btn" onClick={handleFacebookLogin}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
            Continue with Facebook
          </button>

          <button className="social-btn google-btn" onClick={handleGoogleLogin}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="divider">OR LOGIN WITH EMAIL</div>

          {error && <div className="error-banner"><span>⚠️</span>{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <span className="input-icon">✉️</span>
              <input type="email" placeholder="Email" className="login-input" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} disabled={loading} required />
            </div>
            <div className="input-group">
              <span className="input-icon">🔒</span>
              <input type={showPassword ? 'text' : 'password'} placeholder="Password" className="login-input" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} disabled={loading} required />
              <button type="button" className="eye-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? '🙈' : '👁️'}</button>
            </div>
            <div className="login-options">
              <label className="remember-label" onClick={() => {}}><span className="custom-checkbox" style={{ background: '#ffffff' }}></span>Remember me</label>
              <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
            </div>
            <button type="submit" className="login-btn" disabled={loading}>{loading && <span className="spinner" />}{loading ? 'LOGGING IN…' : 'LOGIN'}</button>
          </form>

          <div className="signup-row">Don't have an account ?<Link to="/signup" className="signup-link">Sign Up</Link></div>
        </div>
      </div>
    </>
  );
};

export default Login;