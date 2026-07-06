import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const leftShoeRef = useRef(null);
  const rightShoeRef = useRef(null);

  // Mouse parallax effect for shoes
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
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed');
        setLoading(false);
        return;
      }

      login(data.token, data.user);

      if (data.user.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/store');
      }

    } catch (err) {
      setError('Unable to reach the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleShoeClick = (e, productName) => {
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();

    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(248, 243, 243, 0.6);
      transform: scale(0);
      animation: shoeRipple 0.6s ease-out;
      pointer-events: none;
      width: ${Math.max(rect.width, rect.height)}px;
      height: ${Math.max(rect.width, rect.height)}px;
      left: ${e.clientX - rect.left - Math.max(rect.width, rect.height) / 2}px;
      top: ${e.clientY - rect.top - Math.max(rect.width, rect.height) / 2}px;
    `;
    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    setTooltip({ show: true, text: productName, x: e.clientX + 10, y: e.clientY - 40 });
    setTimeout(() => setTooltip(prev => ({ ...prev, show: false })), 2000);

    const isLeft = element.classList.contains('shoe-top-left');
    element.style.transform = isLeft
      ? 'rotate(-8deg) scale(0.9) translateY(5px)'
      : 'rotate(6deg) scale(0.9) translateY(5px)';
    setTimeout(() => { element.style.transform = ''; }, 200);
  };

  return (
    <>
      <style>{`
        @keyframes shoeRipple {
          to { transform: scale(4); opacity: 0; }
        }

        @keyframes shoeEnterTL {
          0%   { transform: rotate(-15deg) translateY(-50px) translateX(-50px); opacity: 0; }
          100% { transform: rotate(-15deg) translateY(0) translateX(0);         opacity: 1; }
        }

        @keyframes shoeEnterBR {
          0%   { transform: rotate(10deg) translateY(50px) translateX(50px); opacity: 0; }
          100% { transform: rotate(10deg) translateY(0) translateX(0);       opacity: 1; }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body, #root {
          background: #f5f0f0;
          min-height: 100vh;
        }

        .login-page {
          min-height: 100vh;
          background: #f5f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'Poppins', sans-serif;
        }

        .shoe-top-left {
          position: absolute;
          top: -20px; left: -30px;
          width: 220px;
          transform: rotate(-15deg);
          cursor: pointer;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.4s ease;
          z-index: 1;
          filter: drop-shadow(4px 8px 12px rgba(241, 233, 233, 0.15));
          user-select: none;
          -webkit-user-drag: none;
          animation: shoeEnterTL 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .shoe-top-left:hover {
          transform: rotate(-5deg) scale(1.15) translateY(-10px) translateX(5px) !important;
          filter: drop-shadow(8px 16px 24px rgba(244, 236, 236, 0.25)) brightness(1.05);
        }
        .shoe-top-left:active {
          transform: rotate(-8deg) scale(0.95) translateY(5px) !important;
        }

        .shoe-bottom-right {
          position: absolute;
          bottom: -20px; right: -30px;
          width: 230px;
          transform: rotate(10deg);
          cursor: pointer;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.4s ease;
          z-index: 1;
          filter: drop-shadow(-4px 8px 12px rgba(255, 252, 252, 0.15));
          user-select: none;
          -webkit-user-drag: none;
          animation: shoeEnterBR 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards;
          opacity: 0;
        }
        .shoe-bottom-right:hover {
          transform: rotate(2deg) scale(1.15) translateY(-10px) translateX(-5px) !important;
          filter: drop-shadow(-8px 16px 24px rgba(255, 250, 250, 0.25)) brightness(1.05);
        }
        .shoe-bottom-right:active {
          transform: rotate(6deg) scale(0.95) translateY(5px) !important;
        }

        .login-card {
          background: #ffffff;
          border-radius: 28px;
          padding: 48px 44px 40px;
          width: 100%;
          max-width: 480px;
          position: relative;
          z-index: 2;
          box-shadow: 0 20px 60px rgba(10, 10, 10, 0.08);
          margin: 20px;
        }

        .login-title {
          text-align: center;
          font-size: 36px;
          font-weight: 800;
          color: #111111;
          margin-bottom: 32px;
          letter-spacing: -0.5px;
        }

        .error-banner {
          background: #fff0f0;
          border: 1.5px solid #ffcccc;
          border-radius: 10px;
          padding: 10px 14px;
          margin-bottom: 16px;
          font-size: 13px;
          color: #cc2222;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: shake 0.4s ease;
        }

        .input-group {
          position: relative;
          margin-bottom: 16px;
        }

        .input-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 17px;
          color: #888;
          pointer-events: none;
          transition: color 0.25s ease;
        }

        .login-input {
          width: 100%;
          padding: 16px 48px 16px 48px;
          border: 1.5px solid #e0e0e0;
          border-radius: 14px;
          font-size: 15px;
          color: #111;
          background: #fafafa;
          outline: none;
          font-family: 'Poppins', sans-serif;
          transition: border-color 0.25s ease, box-shadow 0.25s ease,
                      background 0.25s ease, transform 0.2s ease;
        }
        .login-input::placeholder { color: #aaaaaa; }
        .login-input:hover {
          border-color: #b0b0b0;
          background: #f0f0f0;
          transform: scale(1.01);
        }
        .login-input:focus {
          border-color: #111111;
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.08);
          background: #ffffff;
          transform: scale(1.01);
        }
        .login-input:focus + .input-icon,
        .input-group:hover .input-icon { color: #111; }
        .login-input:disabled { opacity: 0.6; cursor: not-allowed; }

        .eye-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 17px;
          color: #888;
          padding: 4px;
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .eye-toggle:hover {
          color: #111;
          transform: translateY(-50%) scale(1.15);
        }

        .login-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 18px 0 28px;
        }

        .remember-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13px;
          color: #555;
          user-select: none;
        }

        .custom-checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid #ccc;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
          flex-shrink: 0;
        }
        .remember-label:hover .custom-checkbox {
          border-color: #888;
          transform: scale(1.1);
        }

        .forgot-link {
          font-size: 13px;
          color: #555;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .forgot-link:hover { color: #111; text-decoration: underline; }

        .login-btn {
          width: 100%;
          padding: 16px;
          background: #f5f0eb;
          color: #111111;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 1.5px;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          transition: background 0.25s ease, transform 0.2s ease,
                      box-shadow 0.25s ease, color 0.25s ease;
          margin-bottom: 20px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .login-btn:hover:not(:disabled) {
          background: #111111;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(17, 17, 17, 0.2);
        }
        .login-btn:active:not(:disabled) {
          transform: translateY(0px);
          box-shadow: none;
        }
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2.5px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .signup-row {
          text-align: center;
          font-size: 13.5px;
          color: #666;
        }

        .signup-link {
          color: #111111;
          font-weight: 700;
          text-decoration: none;
          margin-left: 4px;
          position: relative;
          transition: color 0.2s ease;
          cursor: pointer;
        }
        .signup-link::after {
          content: '';
          position: absolute;
          bottom: -1px; left: 0;
          width: 0%; height: 2px;
          background: #111111;
          transition: width 0.25s ease;
        }
        .signup-link:hover::after { width: 100%; }
        .signup-link:hover { color: #333; }

        .shoe-tooltip {
          position: fixed;
          background: #111;
          color: #fff;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          pointer-events: none;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.3s ease, transform 0.3s ease;
          z-index: 100;
          white-space: nowrap;
        }
        .shoe-tooltip.show { opacity: 1; transform: translateY(0); }

        @media (max-width: 520px) {
          .login-card { margin: 16px; padding: 36px 24px 32px; }
          .shoe-top-left  { width: 140px; top: -10px; left: -20px; }
          .shoe-bottom-right { width: 150px; bottom: -10px; right: -20px; }
        }
      `}</style>

      <div className="login-page">
        <div
          className={`shoe-tooltip ${tooltip.show ? 'show' : ''}`}
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>

        <img
          ref={leftShoeRef}
          src="/shoe-left.png"
          alt="Red sneaker"
          className="shoe-top-left"
          onClick={(e) => handleShoeClick(e, 'Nike Air Max - $129')}
          onError={(e) => { e.currentTarget.src = 'side-red.png'; }}
        />

        <img
          ref={rightShoeRef}
          src="/shoe-right.png"
          alt="White and orange sneaker"
          className="shoe-bottom-right"
          onClick={(e) => handleShoeClick(e, 'Nike Metcon - $149')}
          onError={(e) => { e.currentTarget.src = 'side-mix.png'; }}
        />

        <div className="login-card">
          <h1 className="login-title">Login</h1>

          {error && (
            <div className="error-banner">
              <span>⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <span className="input-icon">✉️</span>
              <input
                type="email"
                placeholder="Email"
                className="login-input"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                disabled={loading}
                required
              />
            </div>

            <div className="input-group">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="login-input"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <div className="login-options">
              <label
                className="remember-label"
                onClick={() => setRememberMe(!rememberMe)}
              >
                <span
                  className="custom-checkbox"
                  style={{ background: rememberMe ? '#64d792' : '#ffffff' }}
                >
                  {rememberMe && (
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                      <path
                        d="M1 4L4 7L10 1"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="forgot-link"
              >
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? 'LOGGING IN…' : 'LOGIN'}
            </button>
          </form>

          <div className="signup-row">
            Don't have an account ?
            <Link
              to="/signup"
              className="signup-link"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;