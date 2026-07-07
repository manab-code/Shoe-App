import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [welcomeMsg, setWelcomeMsg] = useState('');

const handleSignUp = async (e) => {
  e.preventDefault();

  try {
    setLoading(true);

    const response = await fetch(
       "http://localhost:8080/signup",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Signup failed");
    }

    setWelcomeMsg(
      `Welcome ${data.user?.name || name}! Your account has been created successfully. 👟`
    );

    console.log("Signup Success:", data);

    setName("");
    setEmail("");
    setPassword("");
  } catch (error) {
    console.error("Signup Error:", error);
    alert(error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .signup-page {
          min-height: 100vh;
          background: #f5f0f0;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: Arial, sans-serif;
        }

        .signup-card {
          background: #fff;
          width: 100%;
          max-width: 500px;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          position: relative;
        }

        .shoe-inside-card {
          width: 100%;
          max-width: 300px;
          display: block;
          margin: 0 auto 20px;
        }

        .signup-title {
          text-align: center;
          margin-bottom: 25px;
          font-size: 32px;
          font-weight: bold;
        }

        .social-btn {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 10px;
          margin-bottom: 10px;
          cursor: pointer;
          font-size: 15px;
          font-weight: bold;
        }

        .facebook-btn {
          background: #1877f2;
          color: white;
        }

        .google-btn {
          background: white;
          border: 1px solid #ddd;
        }

        .divider {
          text-align: center;
          margin: 20px 0;
        }

        .signup-input {
          width: 100%;
          padding: 14px;
          margin-bottom: 15px;
          border-radius: 10px;
          border: 1px solid #ccc;
          font-size: 15px;
        }

        .password-wrapper {
          position: relative;
        }

        .eye-toggle {
          position: absolute;
          right: 10px;
          top: 12px;
          border: none;
          background: none;
          cursor: pointer;
        }

        .signup-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 10px;
          background: black;
          color: white;
          font-size: 16px;
          cursor: pointer;
        }

        .signup-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .welcome-box {
          margin-top: 20px;
          padding: 15px;
          background: #f3f0ff;
          border-radius: 10px;
          border: 1px solid #ddd;
        }

        .welcome-label {
          font-weight: bold;
          margin-bottom: 5px;
        }

        .signup-footer {
          margin-top: 20px;
          text-align: center;
        }

        .login-link {
          color: black;
          text-decoration: none;
          font-weight: bold;
        }

        .login-link:hover {
          text-decoration: underline;
        }
      `}</style>

      <div className="signup-page">
        <div className="signup-card">
          <img
            src="/adikid.png"
            alt="Sneaker"
            className="shoe-inside-card"
            onError={(e) => {
              e.target.src =
                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500';
            }}
          />

          <h1 className="signup-title">Welcome Back!</h1>

          <button
            type="button"
            className="social-btn facebook-btn"
            onClick={() => alert('Facebook login clicked')}
          >
            Continue with Facebook
          </button>

          <button
            type="button"
            className="social-btn google-btn"
            onClick={() => alert('Google login clicked')}
          >
            Continue with Google
          </button>

          <div className="divider">
            <strong>OR SIGN UP WITH EMAIL</strong>
          </div>

          <form onSubmit={handleSignUp}>
            <input
              type="text"
              placeholder="Full Name"
              className="signup-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <input
              type="email"
              placeholder="Email Address"
              className="signup-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="signup-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <button
              type="submit"
              className="signup-btn"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          {welcomeMsg && (
            <div className="welcome-box">
              <div className="welcome-label">
                ✨ Welcome Message
              </div>
              {welcomeMsg}
            </div>
          )}

          <div className="signup-footer">
            <a
              href="#"
              className="login-link"
              onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}
            >
              Already have an account? Login
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUp;