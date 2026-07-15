// src/pages/SignUp.jsx
// Email signup → Node.js /api/auth/signup
// Google/Facebook signup → Node.js /api/auth/google & /api/auth/facebook
// NEVER calls Apps Script directly

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL, GOOGLE_CLIENT_ID, FACEBOOK_APP_ID } from '../config/api';

const SignUp = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [welcomeMsg, setWelcomeMsg] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setWelcomeMsg(`Welcome ${data.user.name}! ${data.message} 👟`);
      setName(''); setEmail(''); setPassword('');
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    if (!window.google) { alert('Google SDK not loaded yet. Please wait...'); return; }

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
            body: JSON.stringify({ name: userInfo.name, email: userInfo.email, googleId: userInfo.sub, picture: userInfo.picture }),
          });

          const data = await response.json();
          if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setWelcomeMsg(`Welcome ${data.user.name}! ${data.message} 👟`);
            setTimeout(() => navigate('/'), 1500);
          } else { alert(data.message); }
        } catch (err) { alert('Google signup failed: ' + err.message); }
      },
    });
    client.requestAccessToken();
  };

  const handleFacebookSignUp = () => {
    if (!window.FB) { alert('Facebook SDK not loaded yet. Please wait...'); return; }

    window.FB.login(
      (response) => {
        if (response.authResponse) {
          window.FB.api('/me', { fields: 'name,email,picture' }, async (userInfo) => {
            try {
              const res = await fetch(`${BACKEND_URL}/api/auth/facebook`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: userInfo.name, email: userInfo.email, facebookId: userInfo.id, picture: userInfo.picture?.data?.url }),
              });

              const data = await res.json();
              if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setWelcomeMsg(`Welcome ${data.user.name}! ${data.message} 👟`);
                setTimeout(() => navigate('/'), 1500);
              } else { alert(data.message); }
            } catch (err) { alert('Facebook signup failed: ' + err.message); }
          });
        } else { alert('Facebook login was cancelled'); }
      },
      { scope: 'public_profile' }
    );
  };

  useEffect(() => {
    const googleScript = document.createElement('script');
    googleScript.src = 'https://accounts.google.com/gsi/client';
    googleScript.async = true; googleScript.defer = true;
    document.body.appendChild(googleScript);

    const fbScript = document.createElement('script');
    fbScript.src = 'https://connect.facebook.net/en_US/sdk.js';
    fbScript.async = true; fbScript.defer = true; fbScript.crossOrigin = 'anonymous';
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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .signup-page { min-height: 100vh; background: #f5f0f0; display: flex; justify-content: center; align-items: center; font-family: Arial, sans-serif; padding: 20px; }
        .signup-card { background: #fff; width: 100%; max-width: 500px; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .signup-title { text-align: center; margin-bottom: 25px; font-size: 32px; font-weight: bold; }
        .social-btn { width: 100%; padding: 14px; border: none; border-radius: 10px; margin-bottom: 12px; cursor: pointer; font-size: 15px; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 10px; transition: transform 0.2s, box-shadow 0.2s; }
        .social-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .facebook-btn { background: #1877f2; color: white; }
        .google-btn { background: white; border: 1.5px solid #ddd; color: #333; }
        .divider { text-align: center; margin: 24px 0; color: #888; font-size: 13px; font-weight: bold; letter-spacing: 1px; }
        .signup-input { width: 100%; padding: 14px 16px; margin-bottom: 15px; border-radius: 10px; border: 1.5px solid #ddd; font-size: 15px; outline: none; transition: border-color 0.2s; }
        .signup-input:focus { border-color: #111; }
        .password-wrapper { position: relative; }
        .eye-toggle { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); border: none; background: none; cursor: pointer; font-size: 18px; }
        .signup-btn { width: 100%; padding: 14px; border: none; border-radius: 10px; background: #111; color: white; font-size: 16px; font-weight: bold; cursor: pointer; transition: background 0.2s, transform 0.2s; }
        .signup-btn:hover:not(:disabled) { background: #333; transform: translateY(-1px); }
        .signup-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .welcome-box { margin-top: 20px; padding: 15px; background: #e8f5e9; border-radius: 10px; border: 1px solid #c8e6c9; color: #2e7d32; }
        .welcome-label { font-weight: bold; margin-bottom: 5px; }
        .signup-footer { margin-top: 20px; text-align: center; font-size: 14px; color: #666; }
        .login-link { color: #111; text-decoration: none; font-weight: bold; margin-left: 4px; cursor: pointer; }
        .login-link:hover { text-decoration: underline; }
        .error-text { color: #cc2222; font-size: 13px; margin-bottom: 10px; text-align: center; }
      `}</style>

      <div className="signup-page">
        <div className="signup-card">
          <h1 className="signup-title">Welcome Back!</h1>

          <button type="button" className="social-btn facebook-btn" onClick={handleFacebookSignUp}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
            Continue with Facebook
          </button>

          <button type="button" className="social-btn google-btn" onClick={handleGoogleSignUp}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="divider">OR SIGN UP WITH EMAIL</div>

          {error && <div className="error-text">{error}</div>}
          {welcomeMsg && <div className="welcome-box"><div className="welcome-label">✨ Success!</div>{welcomeMsg}</div>}

          <form onSubmit={handleSignUp}>
            <input type="text" placeholder="Full Name" className="signup-input" value={name} onChange={(e) => setName(e.target.value)} required />
            <input type="email" placeholder="Email Address" className="signup-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <div className="password-wrapper">
              <input type={showPassword ? 'text' : 'password'} placeholder="Password (min 6 chars)" className="signup-input" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
              <button type="button" className="eye-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? '🙈' : '👁️'}</button>
            </div>
            <button type="submit" className="signup-btn" disabled={loading}>{loading ? 'Creating Account...' : 'Sign Up'}</button>
          </form>

          <div className="signup-footer">Already have an account?<span className="login-link" onClick={() => navigate('/login')}>Login</span></div>
        </div>
      </div>
    </>
  );
};

export default SignUp;