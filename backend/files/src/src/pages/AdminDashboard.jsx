import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      navigate('/store');
    }
  }, [isAdmin, navigate]);

  // Fetch dashboard data
  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchUsers();
      fetchProducts();
      fetchOrders();
    }
  }, [isAdmin]);

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const fetchStats = async () => {
    try {
      const [usersRes, productsRes, ordersRes] = await Promise.all([
        fetch('http://localhost:8080/api/users', { headers: getAuthHeaders() }),
        fetch('http://localhost:8080/api/products', { headers: getAuthHeaders() }),
        fetch('http://localhost:8080/api/payment/orders', { headers: getAuthHeaders() })
      ]);

      const usersData = await usersRes.json();
      const productsData = await productsRes.json();
      const ordersData = await ordersRes.json();

      const totalRevenue = ordersData.orders?.reduce((sum, order) => 
        order.status === 'completed' ? sum + (order.amount || 0) : sum, 0) || 0;

      setStats({
        totalUsers: usersData.users?.length || 0,
        totalProducts: productsData.products?.length || 0,
        totalOrders: ordersData.orders?.length || 0,
        totalRevenue
      });
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/users', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) {
      setError('Failed to load users');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/products', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) setProducts(data.products);
    } catch (err) {
      setError('Failed to load products');
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/payment/orders', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (err) {
      console.error('Orders error:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`http://localhost:8080/api/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setUsers(users.filter(u => u._id !== userId));
        fetchStats();
      }
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const res = await fetch(`http://localhost:8080/api/users/${userId}/role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      setError('Failed to update role');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`http://localhost:8080/api/products/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setProducts(products.filter(p => p._id !== productId));
        fetchStats();
      }
    } catch (err) {
      setError('Failed to delete product');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const StatCard = ({ title, value, icon, color }) => (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '12px',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px'
      }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{title}</p>
        <h3 style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '800', color: '#111' }}>
          {typeof value === 'number' && title.includes('Revenue') ? `Rs. ${value.toLocaleString()}` : value}
        </h3>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div>
      <h2 style={{ marginBottom: '24px', color: '#111' }}>Dashboard Overview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <StatCard title="Total Users" value={stats.totalUsers} icon="👥" color="#e3f2fd" />
        <StatCard title="Total Products" value={stats.totalProducts} icon="📦" color="#f3e5f5" />
        <StatCard title="Total Orders" value={stats.totalOrders} icon="🛒" color="#e8f5e9" />
        <StatCard title="Total Revenue" value={stats.totalRevenue} icon="💰" color="#fff3e0" />
      </div>
    </div>
  );

  const renderUsers = () => (
    <div>
      <h2 style={{ marginBottom: '24px', color: '#111' }}>User Management</h2>
      <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Name</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Email</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Role</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Joined</th>
              <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '16px' }}>{user.name || 'N/A'}</td>
                <td style={{ padding: '16px' }}>{user.email}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: user.role === 'admin' ? '#e3f2fd' : '#f5f5f5',
                    color: user.role === 'admin' ? '#1976d2' : '#666'
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '16px', color: '#888', fontSize: '13px' }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleUpdateRole(user._id, user.role === 'admin' ? 'user' : 'admin')}
                    style={{
                      padding: '6px 12px',
                      marginRight: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {user.role === 'admin' ? 'Demote' : 'Promote'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user._id)}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      background: '#ffebee',
                      color: '#c62828',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div>
      <h2 style={{ marginBottom: '24px', color: '#111' }}>Product Management</h2>
      <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Product</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Category</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Price</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Stock</th>
              <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product._id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img 
                    src={product.imageUrl || '/placeholder.png'} 
                    alt={product.name}
                    style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                  />
                  <span>{product.name}</span>
                </td>
                <td style={{ padding: '16px' }}>{product.category}</td>
                <td style={{ padding: '16px', fontWeight: '600' }}>Rs. {product.price}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    background: product.stock > 10 ? '#e8f5e9' : '#ffebee',
                    color: product.stock > 10 ? '#2e7d32' : '#c62828'
                  }}>
                    {product.stock}
                  </span>
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleDeleteProduct(product._id)}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      background: '#ffebee',
                      color: '#c62828',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div>
      <h2 style={{ marginBottom: '24px', color: '#111' }}>Order Management</h2>
      <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Order ID</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Product</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Amount</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Method</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Status</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '13px' }}>
                  {order._id?.slice(-8)}
                </td>
                <td style={{ padding: '16px' }}>{order.productName}</td>
                <td style={{ padding: '16px', fontWeight: '600' }}>Rs. {order.amount}</td>
                <td style={{ padding: '16px', textTransform: 'uppercase', fontSize: '12px' }}>
                  {order.method}
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: order.status === 'completed' ? '#e8f5e9' : order.status === 'pending' ? '#fff3e0' : '#ffebee',
                    color: order.status === 'completed' ? '#2e7d32' : order.status === 'pending' ? '#f57c00' : '#c62828'
                  }}>
                    {order.status}
                  </span>
                </td>
                <td style={{ padding: '16px', color: '#888', fontSize: '13px' }}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'users', label: '👥 Users', icon: '👥' },
    { id: 'products', label: '📦 Products', icon: '📦' },
    { id: 'orders', label: '🛒 Orders', icon: '🛒' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Poppins, sans-serif' }}>
      {/* Sidebar */}
      <div style={{
        width: '260px',
        background: '#111',
        color: '#fff',
        padding: '24px 0',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto'
      }}>
        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid #333' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>Admin Panel</h2>
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#888' }}>
            Welcome, {user?.name || user?.email}
          </p>
        </div>

        <nav style={{ padding: '16px 12px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%',
                padding: '14px 16px',
                marginBottom: '4px',
                border: 'none',
                borderRadius: '10px',
                background: activeTab === tab.id ? '#333' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#888',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px 24px', position: 'absolute', bottom: '0', width: '100%' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #444',
              borderRadius: '10px',
              background: 'transparent',
              color: '#ff6b6b',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: '260px', flex: 1, padding: '32px' }}>
        {error && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'products' && renderProducts()}
        {activeTab === 'orders' && renderOrders()}
      </div>
    </div>
  );
};

export default AdminDashboard;