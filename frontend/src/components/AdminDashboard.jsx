import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: '', imageUrl: '', stock: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = 'http://localhost:8080/api/products';
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchProducts();
  }, [isAdmin, navigate]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (data.success) setProducts(data.products);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load products' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const url = editingId ? `${API_URL}/${editingId}` : API_URL;
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          stock: Number(formData.stock)
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: editingId ? 'Product updated!' : 'Product added successfully!' 
        });
        setFormData({ name: '', description: '', price: '', category: '', imageUrl: '', stock: '' });
        setEditingId(null);
        fetchProducts();
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Server error' });
    }
    setLoading(false);
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category || '',
      imageUrl: product.imageUrl || '',
      stock: product.stock
    });
    setEditingId(product._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Product deleted!' });
        fetchProducts();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete' });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', price: '', category: '', imageUrl: '', stock: '' });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'Poppins, sans-serif' }}>
      <nav style={{
        background: '#111', color: '#fff', padding: '16px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>👑 Admin Dashboard</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span>Welcome, {user?.name}</span>
          <button onClick={() => navigate('/')} style={{
            background: '#333', color: '#fff', border: 'none',
            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'
          }}>🏪 Store</button>
          <button onClick={logout} style={{
            background: '#dc3545', color: '#fff', border: 'none',
            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'
          }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
        {message.text && (
          <div style={{
            padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
            background: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {message.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '28px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: 'fit-content'
          }}>
            <h3 style={{ marginBottom: '20px', fontSize: '20px' }}>
              {editingId ? '✏️ Edit Product' : '➕ Add New Product'}
            </h3>
            <form onSubmit={handleSubmit}>
              {[
                { name: 'name', placeholder: 'Product Name', type: 'text' },
                { name: 'description', placeholder: 'Description', type: 'text' },
                { name: 'price', placeholder: 'Price ($)', type: 'number' },
                { name: 'category', placeholder: 'Category (e.g. Sneakers)', type: 'text' },
                { name: 'imageUrl', placeholder: 'Image URL', type: 'url' },
                { name: 'stock', placeholder: 'Stock Quantity', type: 'number' }
              ].map((field) => (
                <input
                  key={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.name]}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  required={field.name !== 'description'}
                  style={{
                    width: '100%', padding: '12px 16px', marginBottom: '12px',
                    border: '1.5px solid #e0e0e0', borderRadius: '10px',
                    fontSize: '14px', outline: 'none', fontFamily: 'inherit'
                  }}
                />
              ))}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1, padding: '14px', background: '#111', color: '#fff',
                    border: 'none', borderRadius: '10px', fontSize: '15px',
                    fontWeight: '700', cursor: 'pointer', opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Saving...' : (editingId ? 'Update Product' : 'Add Product')}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    style={{
                      padding: '14px 20px', background: '#6c757d', color: '#fff',
                      border: 'none', borderRadius: '10px', fontSize: '15px',
                      fontWeight: '700', cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div style={{
            background: '#fff', borderRadius: '16px', padding: '28px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{ marginBottom: '20px', fontSize: '20px' }}>📦 All Products ({products.length})</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              {products.map((product) => (
                <div key={product._id} style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '16px', borderRadius: '12px', border: '1px solid #eee'
                }}>
                  <img
                    src={product.imageUrl || 'https://via.placeholder.com/80'}
                    alt={product.name}
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '16px' }}>{product.name}</h4>
                    <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>{product.category}</p>
                    <p style={{ margin: '4px 0 0', fontWeight: '700', color: '#111' }}>
                      ${product.price} • Stock: {product.stock}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(product)}
                      style={{
                        background: '#ffc107', color: '#111', border: 'none',
                        padding: '8px 14px', borderRadius: '6px', cursor: 'pointer',
                        fontSize: '13px', fontWeight: '600'
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      style={{
                        background: '#dc3545', color: '#fff', border: 'none',
                        padding: '8px 14px', borderRadius: '6px', cursor: 'pointer',
                        fontSize: '13px', fontWeight: '600'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                  No products yet. Add your first product!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;