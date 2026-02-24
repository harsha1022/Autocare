import React, { useState, useEffect } from 'react';
import {
    Users,
    Wrench,
    Calendar,
    CheckCircle,
    AlertCircle,
    Trash2,
    RefreshCcw,
    LayoutDashboard,
    LogOut,
    UserCircle,
    MapPin,
    Shield,
    Bell,
    Settings,
    Search,
    ChevronRight,
    Clock
} from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalMechanics: 0,
        totalRequests: 0,
        pendingVerification: 0
    });
    const [users, setUsers] = useState([]);
    const [mechanics, setMechanics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, mechanicsRes] = await Promise.all([
                fetch('http://localhost:5000/api/admin/stats'),
                fetch('http://localhost:5000/api/admin/users'),
                fetch('http://localhost:5000/api/admin/mechanics')
            ]);

            const statsData = await statsRes.json();
            const usersData = await usersRes.json();
            const mechanicsData = await mechanicsRes.json();

            setStats(statsData);
            setUsers(usersData);
            setMechanics(mechanicsData);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/admin/mechanics/${id}/verify`, {
                method: 'PUT'
            });
            if (response.ok) {
                fetchData();
            }
        } catch (error) {
            console.error('Error verifying mechanic:', error);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            const response = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchData();
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const handleDeleteMechanic = async (id) => {
        if (!window.confirm('Are you sure you want to delete this partner profile?')) return;
        try {
            const response = await fetch(`http://localhost:5000/api/admin/mechanics/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchData();
            }
        } catch (error) {
            console.error('Error deleting mechanic:', error);
        }
    };

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
    };

    const filteredMechanics = mechanics.filter(m =>
        m.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="admin-layout">
            <div className="admin-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', marginLeft: 0 }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="loader" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                        <RefreshCcw size={48} />
                    </div>
                    <p style={{ color: '#64748b', fontWeight: 600 }}>Loading Pro Dashboard...</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="admin-layout">
            {/* Pro Sidebar */}
            <aside className="admin-sidebar">
                <a href="/" className="sidebar-logo">
                    Car<span>Assist</span>
                </a>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <LayoutDashboard size={20} />
                        <span>Overview</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <Users size={20} />
                        <span>Users</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'partners' ? 'active' : ''}`}
                        onClick={() => setActiveTab('partners')}
                    >
                        <Wrench size={20} />
                        <span>Partner Shops</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <button className="nav-item" onClick={() => window.location.href = '/'}>
                        <LogOut size={20} />
                        <span>Exit Admin</span>
                    </button>
                </div>
            </aside>

            {/* Pro Main Content */}
            <main className="admin-main fade-in">
                <header className="admin-topbar">
                    <div className="topbar-search">
                        <Search size={18} color="#94a3b8" />
                        <input
                            type="text"
                            placeholder="Search everything..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ border: 'none', outline: 'none', marginLeft: '0.75rem', fontSize: '0.95rem', width: '300px' }}
                        />
                    </div>
                    <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <button className="btn-icon">
                            <Bell size={20} />
                        </button>
                        <button className="btn-icon">
                            <Settings size={20} />
                        </button>
                        <div style={{ height: '24px', width: '1px', background: '#e2e8f0' }}></div>
                        <button onClick={fetchData} className="btn-action btn-verify-pro" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <RefreshCcw size={16} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </header>

                <div className="page-header" style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
                        {activeTab === 'overview' ? 'Dashboard Overview' :
                            activeTab === 'users' ? 'User Management' : 'Partner Network'}
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '0.5rem' }}>
                        Welcome back, Admin. Here's what's happening with CarAssist today.
                    </p>
                </div>

                {activeTab === 'overview' && (
                    <>
                        <div className="stats-grid-pro">
                            <div className="stat-card-pro">
                                <div className="stat-header">
                                    <div className="stat-icon-wrapper users">
                                        <Users size={28} />
                                    </div>
                                    <span className="badge user-count">+12%</span>
                                </div>
                                <div className="stat-info">
                                    <span>Total Registered Users</span>
                                    <h3>{stats.totalUsers}</h3>
                                </div>
                            </div>
                            <div className="stat-card-pro">
                                <div className="stat-header">
                                    <div className="stat-icon-wrapper partners">
                                        <Wrench size={28} />
                                    </div>
                                    <span className="badge user-count">+5%</span>
                                </div>
                                <div className="stat-info">
                                    <span>Active Partners</span>
                                    <h3>{stats.totalMechanics}</h3>
                                </div>
                            </div>
                            <div className="stat-card-pro">
                                <div className="stat-header">
                                    <div className="stat-icon-wrapper requests">
                                        <Calendar size={28} />
                                    </div>
                                    <span className="badge user-count">+18%</span>
                                </div>
                                <div className="stat-info">
                                    <span>Total Service Requests</span>
                                    <h3>{stats.totalRequests}</h3>
                                </div>
                            </div>
                            <div className="stat-card-pro">
                                <div className="stat-header">
                                    <div className="stat-icon-wrapper pending">
                                        <Shield size={28} />
                                    </div>
                                    {stats.pendingVerification > 0 && <span className="badge pending">Action Required</span>}
                                </div>
                                <div className="stat-info">
                                    <span>Pending Verifications</span>
                                    <h3>{stats.pendingVerification}</h3>
                                </div>
                            </div>
                        </div>

                        {mechanics.some(m => !m.isVerified) && (
                            <section className="admin-card pending-card">
                                <div className="card-header">
                                    <h2 className="text-warning">
                                        <AlertCircle size={24} />
                                        Pending Partner Approvals
                                    </h2>
                                    <button className="btn-action btn-verify-pro" onClick={() => setActiveTab('partners')}>
                                        View All
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                                <div className="table-container">
                                    <table className="pro-table">
                                        <thead>
                                            <tr>
                                                <th>Shop Details</th>
                                                <th>Specialization</th>
                                                <th>Applied Date</th>
                                                <th style={{ textAlign: 'right' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mechanics.filter(m => !m.isVerified).slice(0, 5).map(m => (
                                                <tr key={m._id} className="fade-in">
                                                    <td>
                                                        <div className="profile-cell">
                                                            <div className="avatar pending-avatar">
                                                                {getInitials(m.shopName)}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 700 }}>{m.shopName}</div>
                                                                <div className="text-sub">Owner: {m.userId?.name}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge user-count">{m.specialization.join(', ')}</span>
                                                    </td>
                                                    <td>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'New'}</td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button onClick={() => handleVerify(m._id)} className="btn-action btn-success-pro">
                                                            Approve Now
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}
                    </>
                )}

                {(activeTab === 'overview' || activeTab === 'partners') && (
                    <section className="admin-card">
                        <div className="card-header">
                            <h2>Partner Network</h2>
                            <div className="badge user-count">{filteredMechanics.length} total shops</div>
                        </div>
                        <div className="table-container">
                            <table className="pro-table">
                                <thead>
                                    <tr>
                                        <th>Business Name</th>
                                        <th>Specialization</th>
                                        <th>Verification</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMechanics.map(m => (
                                        <tr key={m._id}>
                                            <td>
                                                <div className="profile-cell">
                                                    <div className="avatar">{getInitials(m.shopName)}</div>
                                                    <div>
                                                        <div style={{ fontWeight: 700 }}>{m.shopName}</div>
                                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{m.userId?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{m.specialization.join(', ')}</td>
                                            <td>
                                                <span className={`badge ${m.isVerified ? 'verified' : 'pending'}`}>
                                                    {m.isVerified ? <CheckCircle size={14} /> : <Clock size={14} />}
                                                    {m.isVerified ? 'Verified Pro' : 'Waiting Review'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => handleVerify(m._id)} className="btn-action btn-verify-pro">
                                                        {m.isVerified ? 'Revoke' : 'Verify'}
                                                    </button>
                                                    <button onClick={() => handleDeleteMechanic(m._id)} className="btn-icon delete">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {activeTab === 'users' && (
                    <section className="admin-card">
                        <div className="card-header">
                            <h2>User Management</h2>
                            <div className="badge user-count">{filteredUsers.length} active users</div>
                        </div>
                        <div className="table-container">
                            <table className="pro-table">
                                <thead>
                                    <tr>
                                        <th>User Profile</th>
                                        <th>Contact Info</th>
                                        <th>Joined At</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(u => (
                                        <tr key={u._id}>
                                            <td>
                                                <div className="profile-cell">
                                                    <div className="avatar" style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', color: '#4338ca' }}>
                                                        {getInitials(u.name)}
                                                    </div>
                                                    <div style={{ fontWeight: 700 }}>{u.name}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 500 }}>{u.email}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{u.phone || 'No phone'}</div>
                                            </td>
                                            <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button onClick={() => handleDeleteUser(u._id)} className="btn-icon delete">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
