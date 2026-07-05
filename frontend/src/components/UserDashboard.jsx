import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:8080/api/products';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (data.success) setProducts(data.products);
    } catch (err) {
      console.error('Failed to load products');
    }
    setLoading(false);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0f0', fontFamily: 'Poppins, sans-serif' }}>
      <nav style={{
        background: '#fff', padding: '16px 32px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100
      }}>
        <h2 style={{ margin: 0, fontSize: '22px', color: '#111' }}>🛍️ Sneaker Store</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {isAdmin && (
            <button onClick={() => navigate('/dashboard')} style={{
              background: '#111', color: '#fff', border: 'none',
              padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
            }}>
              ⚙️ Admin Panel
            </button>
          )}
          <span style={{ color: '#555' }}>Hi, {user?.name}</span>
          <button onClick={logout} style={{
            background: 'transparent', color: '#111', border: '1.5px solid #111',
            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'
          }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
        <div style={{
          display: 'flex', gap: '16px', marginBottom: '32px',
          background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <input
            type="text"
            placeholder="🔍 Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, padding: '12px 16px', border: '1.5px solid #e0e0e0',
              borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit'
            }}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: '12px 16px', border: '1.5px solid #e0e0e0',
              borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', minWidth: '150px'
            }}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {filteredProducts.map((product) => (
            <div key={product._id} style={{
              background: '#fff', borderRadius: '16px', overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)', transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
            }}
            >
              <img
                src={product.imageUrl || 'https://via.placeholder.com/300x200'}
                alt={product.name}
                style={{ width: '100%', height: '200px', objectFit: 'cover' }}
              />
              <div style={{ padding: '20px' }}>
                <span style={{
                  display: 'inline-block', padding: '4px 10px', borderRadius: '20px',
                  background: '#f5f0f0', color: '#666', fontSize: '12px', fontWeight: '600', marginBottom: '8px'
                }}>
                  {product.category || 'Uncategorized'}
                </span>
                <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#111' }}>{product.name}</h3>
                <p style={{ margin: '0 0 12px', color: '#666', fontSize: '13px', lineHeight: '1.5' }}>
                  {product.description || 'No description available'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '22px', fontWeight: '800', color: '#111' }}>${product.price}</span>
                  <span style={{
                    fontSize: '12px', color: product.stock > 0 ? '#28a745' : '#dc3545', fontWeight: '600'
                  }}>
                    {product.stock > 0 ? `✓ In Stock (${product.stock})` : '✗ Out of Stock'}
                  </span>
                </div>
                <button style={{
                  width: '100%', marginTop: '16px', padding: '12px', background: '#111', color: '#fff',
                  border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700',
                  cursor: 'pointer', transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#333'}
                onMouseLeave={(e) => e.target.style.background = '#111'}
                >
                  🛒 Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
            <p style={{ fontSize: '18px' }}>No products found 😕</p>
            <p>Try adjusting your search or filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;