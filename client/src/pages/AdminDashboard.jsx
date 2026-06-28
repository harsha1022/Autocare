import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    Users, Wrench, Calendar, CheckCircle, AlertCircle, Trash2,
    RefreshCcw, LayoutDashboard, LogOut, Shield, Search,
    ChevronRight, Clock, TrendingUp, BarChart2, Star, Home
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import './AdminDashboard.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const COLORS = ['#D6B588', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminDashboard = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState({ totalUsers: 0, totalMechanics: 0, totalRequests: 0, pendingVerification: 0, completedRequests: 0, activeRequests: 0 });
    const [users, setUsers] = useState([]);
    const [mechanics, setMechanics] = useState([]);
    const [serviceRequests, setServiceRequests] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { if (activeTab === 'analytics') fetchAnalytics(); }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sRes, uRes, mRes, reqRes] = await Promise.all([
                fetch(`${API}/api/admin/stats`, { headers }),
                fetch(`${API}/api/admin/users`, { headers }),
                fetch(`${API}/api/admin/mechanics`, { headers }),
                fetch(`${API}/api/admin/services?limit=50`, { headers }),
            ]);
            if (sRes.ok) setStats(await sRes.json());
            if (uRes.ok) setUsers(await uRes.json());
            if (mRes.ok) setMechanics(await mRes.json());
            if (reqRes.ok) { const d = await reqRes.json(); setServiceRequests(d.requests || []); }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await fetch(`${API}/api/admin/analytics`, { headers });
            if (res.ok) setAnalytics(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleApprove = async (id) => {
        try {
            const res = await fetch(`${API}/api/admin/mechanics/${id}/approve`, { method: 'PUT', headers });
            const data = await res.json();
            if (res.ok) {
                toast.success('Partner approved! They must log out and log back in to access the mechanic dashboard.');
            } else {
                toast.error(data.message || 'Failed to approve partner');
            }
        } catch { toast.error('Server error during approval'); }
        fetchData();
    };

    const handleReject = async (id) => {
        if (!window.confirm('Reject this partner application?')) return;
        try {
            const res = await fetch(`${API}/api/admin/mechanics/${id}/reject`, { method: 'PUT', headers });
            const data = await res.json();
            if (res.ok) {
                toast('Application rejected.', { icon: '❌' });
            } else {
                toast.error(data.message || 'Failed to reject application');
            }
        } catch { toast.error('Server error during rejection'); }
        fetchData();
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Delete this user? This action cannot be undone.')) return;
        try {
            const res = await fetch(`${API}/api/admin/users/${id}`, { method: 'DELETE', headers });
            if (res.ok) {
                toast.success('User deleted successfully');
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to delete user');
            }
        } catch { toast.error('Server error during deletion'); }
        fetchData();
    };

    const handleDeleteMechanic = async (id) => {
        if (!window.confirm('Delete this mechanic profile? This action cannot be undone.')) return;
        try {
            const res = await fetch(`${API}/api/admin/mechanics/${id}`, { method: 'DELETE', headers });
            if (res.ok) {
                toast.success('Mechanic profile deleted');
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to delete mechanic');
            }
        } catch { toast.error('Server error during deletion'); }
        fetchData();
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

    const filteredMechanics = mechanics.filter(m =>
        m.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredRequests = serviceRequests.filter(r =>
        (!statusFilter || r.status === statusFilter) &&
        (r.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.serviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            !searchTerm)
    );

    const TABS = [
        { id: 'overview', icon: <LayoutDashboard size={20} />, label: 'Overview' },
        { id: 'users', icon: <Users size={20} />, label: 'Users' },
        { id: 'partners', icon: <Wrench size={20} />, label: 'Partners' },
        { id: 'services', icon: <Calendar size={20} />, label: 'Service Requests' },
        { id: 'analytics', icon: <BarChart2 size={20} />, label: 'Analytics' },
        { id: 'leaderboard', icon: <Star size={20} />, label: 'Leaderboard' },
    ];

    const STATUS_COLORS = { Pending: '#f59e0b', Accepted: '#3b82f6', InProgress: '#10b981', Completed: '#D6B588', Cancelled: '#ef4444' };

    if (loading) return (
        <div className="admin-layout">
            <div className="admin-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <RefreshCcw size={48} color="#D6B588" style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: '#7a6a5a', marginTop: '1rem' }}>Loading Dashboard...</p>
                </div>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        </div>
    );

    return (
        <div className="admin-layout">
            {/* ─── SIDEBAR ─── */}
            <aside className="admin-sidebar">
                <a href="/" className="sidebar-logo">Car<span>Assist</span></a>

                <div className="admin-user-card">
                    <div className="admin-avatar">{getInitials(user?.name || 'Admin')}</div>
                    <div>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem' }}>{user?.name || 'Admin'}</div>
                        <span className="admin-role-tag">Super Admin</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {TABS.map(tab => (
                        <button key={tab.id}
                            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}>
                            {tab.icon}<span>{tab.label}</span>
                            {tab.id === 'partners' && stats.pendingVerification > 0 &&
                                <span className="nav-badge">{stats.pendingVerification}</span>}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="nav-item" onClick={() => navigate('/')}><Home size={20} /><span>Home</span></button>
                    <button className="nav-item logout" onClick={handleLogout}><LogOut size={20} /><span>Logout</span></button>
                </div>
            </aside>

            {/* ─── MAIN ─── */}
            <main className="admin-main fade-in">
                <header className="admin-topbar">
                    <div className="topbar-search">
                        <Search size={18} color="#94a3b8" />
                        <input type="text" placeholder="Search users, mechanics, services..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={fetchData} className="btn-action btn-verify-pro">
                            <RefreshCcw size={16} /><span>Refresh</span>
                        </button>
                    </div>
                </header>

                <div className="page-header">
                    <h1>{TABS.find(t => t.id === activeTab)?.label}</h1>
                    <p>Welcome back, Admin. Managing CarAssist platform.</p>
                </div>

                {/* ═══ OVERVIEW ═══ */}
                {activeTab === 'overview' && (<>
                    <div className="stats-grid-pro">
                        {[
                            { label: 'Registered Users', val: stats.totalUsers, icon: <Users size={28} />, cls: 'users', badge: '+12%' },
                            { label: 'Active Partners', val: stats.totalMechanics, icon: <Wrench size={28} />, cls: 'partners', badge: '+5%' },
                            { label: 'Total Requests', val: stats.totalRequests, icon: <Calendar size={28} />, cls: 'requests', badge: '+18%' },
                            { label: 'Pending Approvals', val: stats.pendingVerification, icon: <Shield size={28} />, cls: 'pending', badge: stats.pendingVerification > 0 ? 'Action!' : null },
                            { label: 'Completed', val: stats.completedRequests || 0, icon: <CheckCircle size={28} />, cls: 'users', badge: null },
                            { label: 'Active Now', val: stats.activeRequests || 0, icon: <TrendingUp size={28} />, cls: 'requests', badge: null },
                        ].map((s, i) => (
                            <div key={i} className="stat-card-pro">
                                <div className="stat-header">
                                    <div className={`stat-icon-wrapper ${s.cls}`}>{s.icon}</div>
                                    {s.badge && <span className="badge user-count">{s.badge}</span>}
                                </div>
                                <div className="stat-info"><span>{s.label}</span><h3>{s.val}</h3></div>
                            </div>
                        ))}
                    </div>

                    {mechanics.some(m => !m.isVerified) && (
                        <section className="admin-card pending-card">
                            <div className="card-header">
                                <h2 className="text-warning"><AlertCircle size={24} /> Pending Partner Approvals</h2>
                                <button className="btn-action btn-verify-pro" onClick={() => setActiveTab('partners')}>
                                    View All <ChevronRight size={16} />
                                </button>
                            </div>
                            <div className="table-container">
                                <table className="pro-table">
                                    <thead><tr><th>Shop</th><th>Specialization</th><th>Date</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
                                    <tbody>
                                        {mechanics.filter(m => !m.isVerified).slice(0, 5).map(m => (
                                            <tr key={m._id}>
                                                <td><div className="profile-cell">
                                                    <div className="avatar pending-avatar">{getInitials(m.shopName)}</div>
                                                    <div><div style={{ fontWeight: 700 }}>{m.shopName}</div>
                                                        <div className="text-sub">{m.userId?.name}</div></div>
                                                </div></td>
                                                <td><span className="badge user-count">{m.specialization?.join(', ')}</span></td>
                                                <td>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'New'}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <button onClick={() => handleApprove(m._id)} className="btn-action btn-success-pro">✓ Approve</button>
                                                        <button onClick={() => handleReject(m._id)} className="btn-action btn-danger-pro">✕ Reject</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </>)}

                {/* ═══ USERS ═══ */}
                {activeTab === 'users' && (
                    <section className="admin-card">
                        <div className="card-header">
                            <h2>User Management</h2>
                            <div className="badge user-count">{filteredUsers.length} users</div>
                        </div>
                        <div className="table-container">
                            <table className="pro-table">
                                <thead><tr><th>Profile</th><th>Contact</th><th>Joined</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                                <tbody>
                                    {filteredUsers.map(u => (
                                        <tr key={u._id}>
                                            <td><div className="profile-cell">
                                                <div className="avatar" style={{ background: 'linear-gradient(135deg,#93c5fd,#3b82f6)', color: '#fff' }}>{getInitials(u.name)}</div>
                                                <div style={{ fontWeight: 700 }}>{u.name}</div>
                                            </div></td>
                                            <td><div style={{ fontWeight: 500 }}>{u.email}</div>
                                                <div className="text-sub">{u.phone || 'No phone'}</div></td>
                                            <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button onClick={() => handleDeleteUser(u._id)} className="btn-icon delete"><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* ═══ PARTNERS ═══ */}
                {activeTab === 'partners' && (
                    <section className="admin-card">
                        <div className="card-header">
                            <h2>Partner Network</h2>
                            <div className="badge user-count">{filteredMechanics.length} shops</div>
                        </div>
                        <div className="table-container">
                            <table className="pro-table">
                                <thead><tr><th>Business</th><th>Specialization</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                                <tbody>
                                    {filteredMechanics.map(m => (
                                        <tr key={m._id}>
                                            <td><div className="profile-cell">
                                                <div className="avatar">{getInitials(m.shopName)}</div>
                                                <div><div style={{ fontWeight: 700 }}>{m.shopName}</div>
                                                    <div className="text-sub">{m.userId?.email}</div></div>
                                            </div></td>
                                            <td>{m.specialization?.join(', ')}</td>
                                            <td><span className={`badge ${m.isVerified ? 'verified' : 'pending'}`}>
                                                {m.isVerified ? <><CheckCircle size={12} /> Verified</> : <><Clock size={12} /> Pending</>}
                                            </span></td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    {!m.isVerified
                                                        ? <button onClick={() => handleApprove(m._id)} className="btn-action btn-success-pro">✓ Approve</button>
                                                        : <button onClick={() => handleReject(m._id)} className="btn-action btn-verify-pro">Revoke</button>}
                                                    <button onClick={() => handleDeleteMechanic(m._id)} className="btn-icon delete"><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* ═══ SERVICE REQUESTS ═══ */}
                {activeTab === 'services' && (
                    <section className="admin-card">
                        <div className="card-header">
                            <h2>All Service Requests</h2>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(214,181,136,0.2)', borderRadius: '8px', color: '#fff', padding: '6px 12px', fontSize: '0.85rem' }}>
                                    <option value="">All Status</option>
                                    {['Pending', 'Accepted', 'InProgress', 'Completed', 'Cancelled'].map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                                <div className="badge user-count">{filteredRequests.length} requests</div>
                            </div>
                        </div>
                        <div className="table-container">
                            <table className="pro-table">
                                <thead><tr><th>Customer</th><th>Service</th><th>Mechanic</th><th>Status</th><th>Date</th></tr></thead>
                                <tbody>
                                    {filteredRequests.map(r => (
                                        <tr key={r._id}>
                                            <td><div style={{ fontWeight: 600 }}>{r.userId?.name || 'N/A'}</div>
                                                <div className="text-sub">{r.vehicleType}</div></td>
                                            <td>{r.serviceType}</td>
                                            <td>{r.mechanicId?.shopName || <span style={{ color: '#a39585' }}>Unassigned</span>}</td>
                                            <td><span style={{
                                                padding: '3px 10px', borderRadius: '20px', fontSize: '0.76rem', fontWeight: 700,
                                                background: `${STATUS_COLORS[r.status]}22`,
                                                color: STATUS_COLORS[r.status],
                                                border: `1px solid ${STATUS_COLORS[r.status]}44`
                                            }}>{r.status}</span></td>
                                            <td style={{ color: '#a39585', fontSize: '0.82rem' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* ═══ ANALYTICS ═══ */}
                {activeTab === 'analytics' && (
                    <div>
                        {!analytics ? (
                            <div style={{ textAlign: 'center', padding: '4rem', color: '#a39585' }}>
                                <RefreshCcw size={36} style={{ animation: 'spin 1s linear infinite', color: '#D6B588' }} />
                                <p style={{ marginTop: '1rem' }}>Loading analytics...</p>
                            </div>
                        ) : (<>
                            <div className="stats-grid-pro" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '2rem' }}>
                                {[
                                    { label: 'Total Bookings', val: stats.totalRequests, color: '#D6B588' },
                                    { label: 'Completed', val: stats.completedRequests || 0, color: '#10b981' },
                                    { label: 'Active', val: stats.activeRequests || 0, color: '#3b82f6' },
                                ].map((s, i) => (
                                    <div key={i} className="stat-card-pro" style={{ borderColor: `${s.color}33` }}>
                                        <div className="stat-info">
                                            <span>{s.label}</span>
                                            <h3 style={{ color: s.color }}>{s.val}</h3>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                {analytics.bookingsByDay?.length > 0 && (
                                    <section className="admin-card">
                                        <h2 style={{ marginBottom: '1rem' }}>Bookings — Last 7 Days</h2>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={analytics.bookingsByDay}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="_id" tick={{ fill: '#a39585', fontSize: 11 }} />
                                                <YAxis tick={{ fill: '#a39585', fontSize: 11 }} />
                                                <Tooltip contentStyle={{ background: '#1e140a', borderColor: '#D6B588', color: '#fff' }} />
                                                <Bar dataKey="count" fill="#D6B588" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </section>
                                )}

                                {analytics.serviceBreakdown?.length > 0 && (
                                    <section className="admin-card">
                                        <h2 style={{ marginBottom: '1rem' }}>Service Type Breakdown</h2>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <PieChart>
                                                <Pie data={analytics.serviceBreakdown} dataKey="count" nameKey="_id" outerRadius={80} labelLine={false}>
                                                    {analytics.serviceBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip contentStyle={{ background: '#1e140a', borderColor: '#D6B588', color: '#fff' }} />
                                                <Legend wrapperStyle={{ color: '#a39585', fontSize: '12px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </section>
                                )}
                            </div>

                            {analytics.statusBreakdown?.length > 0 && (
                                <section className="admin-card" style={{ marginTop: '1.5rem' }}>
                                    <h2 style={{ marginBottom: '1rem' }}>Request Status Distribution</h2>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        {analytics.statusBreakdown.map(s => (
                                            <div key={s._id} style={{
                                                flex: 1, minWidth: '120px', padding: '1.25rem', textAlign: 'center',
                                                background: `${STATUS_COLORS[s._id] || '#D6B588'}11`,
                                                border: `1px solid ${STATUS_COLORS[s._id] || '#D6B588'}33`,
                                                borderRadius: '14px'
                                            }}>
                                                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: STATUS_COLORS[s._id] || '#D6B588' }}>{s.count}</div>
                                                <div style={{ color: '#a39585', fontSize: '0.8rem', marginTop: '4px' }}>{s._id}</div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </>)}
                    </div>
                )}

                {/* ═══ LEADERBOARD ═══ */}
                {activeTab === 'leaderboard' && (
                    <section className="admin-card">
                        <div className="card-header">
                            <h2><Star size={22} color="#f59e0b" style={{ marginRight: 8 }} /> Top Mechanics</h2>
                            <div className="badge user-count">by completed jobs</div>
                        </div>
                        {analytics?.topMechanics?.length > 0 ? (
                            <div className="table-container">
                                <table className="pro-table">
                                    <thead><tr><th>#</th><th>Mechanic</th><th>Owner</th><th>Completed Jobs</th><th>Rating</th></tr></thead>
                                    <tbody>
                                        {analytics.topMechanics.map((m, i) => (
                                            <tr key={m._id}>
                                                <td>
                                                    <span style={{ fontWeight: 900, fontSize: '1.1rem', color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b8935a' : '#a39585' }}>
                                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                                    </span>
                                                </td>
                                                <td><div className="profile-cell">
                                                    <div className="avatar">{m.shopName?.charAt(0) || 'M'}</div>
                                                    <div style={{ fontWeight: 700 }}>{m.shopName}</div>
                                                </div></td>
                                                <td style={{ color: '#a39585' }}>{m.ownerName || '—'}</td>
                                                <td>
                                                    <span style={{ fontWeight: 900, color: '#D6B588', fontSize: '1.1rem' }}>{m.completedJobs}</span>
                                                    <span style={{ color: '#a39585', fontSize: '0.82rem', marginLeft: '4px' }}>jobs</span>
                                                </td>
                                                <td>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: 700 }}>
                                                        ⭐ {m.rating?.toFixed(1) || '0.0'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="md-empty" style={{ padding: '3rem' }}>
                                <Star size={40} color="#a39585" />
                                <p style={{ color: '#a39585' }}>Leaderboard will populate as mechanics complete jobs.</p>
                                <button className="btn-action btn-verify-pro" onClick={() => { fetchAnalytics(); setActiveTab('leaderboard'); }}>
                                    <RefreshCcw size={14} /> Load Leaderboard
                                </button>
                            </div>
                        )}
                    </section>
                )}
            </main>

            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
};

export default AdminDashboard;
