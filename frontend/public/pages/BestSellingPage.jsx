import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BestSelling from '../components/bestselling';

const BestSellingPage = () => {
  const navigate = useNavigate();
  const [showPage, setShowPage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowPage(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const styles = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: 'poppins, sans-serif',
    },
    navbar: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 16px',
      position: 'relative',
      zIndex: 20,
      borderBottom: '1px solid #f8f9fc',
    },
    backButton: {
      width: '32px',
      height: '32px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      background: 'transparent',
      color: '#111111',
      cursor: 'pointer',
      borderRadius: '50%',
      transition: 'background-color 0.2s ease',
    },
    logo: {
      fontSize: '30px',
      color: '#111111',
      fontWeight: '700',
      letterSpacing: '-0.8px',
      marginLeft: '950px',
    },
  };

  const pageAnimatedStyle = showPage
    ? { ...styles.page, animation: 'slideInUp 0.8s ease forwards' }
    : { ...styles.page, opacity: 0, transform: 'translateY(24px)' };

  const animationKeyframes = `
    @keyframes slideInUp {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  return (
    <>
      <style>{animationKeyframes}</style>
      <div style={pageAnimatedStyle}>
        <nav style={styles.navbar}>
          <button
            type="button"
            style={styles.backButton}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            onClick={() => navigate('/')}
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <div style={styles.logo}>Slick</div>
        </nav>
        <BestSelling />
      </div>
    </>
  );
};

export default BestSellingPage;
