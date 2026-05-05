import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
    Car, MapPin, CheckCircle, Clock, User, Phone, Mail,
    LogOut, Wrench, AlertCircle, CreditCard, Edit3, Save, X,
    History, Home, Settings, Bell, RefreshCcw
} from 'lucide-react';
import './UserDashboard.css';

const API = 'http://localhost:5000';

const STATUS_COLORS = {
    Pending: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
    Accepted: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
    InProgress: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
    Completed: { bg: 'rgba(214,181,136,0.15)', color: '#D6B588', border: 'rgba(214,181,136,0.3)' },
    Cancelled: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
};

const StatusBadge = ({ status }) => {
    const s = STATUS_COLORS[status] || STATUS_COLORS.Pending;
    return (
        <span style={{
            padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
            background: s.bg, color: s.color, border: `1px solid ${s.border}`
        }}>
            {status}
        </span>
    );
};

const UserDashboard = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('requests');
    const [myRequests, setMyRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [profileData, setProfileData] = useState({ name: '', phone: '' });
    const [editingProfile, setEditingProfile] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);

    useEffect(() => {
        fetchData();
        // Seed profile data from auth context
        setProfileData({ name: user?.name || '', phone: user?.phone || '' });
    }, []);

    // Live socket for status updates
    useEffect(() => {
        if (!token) return;
        const socket = io(API);

        socket.on('requestStatusUpdate', ({ requestId, status }) => {
            setMyRequests(prev =>
                prev.map(r => r._id === requestId ? { ...r, status } : r)
            );
            const statusMessages = {
                Accepted: '🔧 A mechanic has accepted your request!',
                Completed: '✅ Your service has been completed!',
                Cancelled: '❌ Your request was cancelled.',
            };
            if (statusMessages[status]) toast(statusMessages[status]);
        });

        socket.on('serviceCompleted', (reqId) => {
            setMyRequests(prev =>
                prev.map(r => r._id === reqId ? { ...r, status: 'Completed' } : r)
            );
        });

        return () => socket.disconnect();
    }, [token]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const userId = user._id || user.id;
            const res = await fetch(`${API}/api/services/user/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMyRequests(data);
            }
        } catch (err) {
            toast.error('Failed to load your requests');
        } finally {
            setIsLoading(false);
        }
    };

    const handleProfileSave = async () => {
        setSavingProfile(true);
        try {
            const res = await fetch(`${API}/api/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileData)
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Profile updated!');
                setEditingProfile(false);
            } else {
                toast.error(data.message || 'Failed to update profile');
            }
        } catch {
            toast.error('Server error');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const activeServices = myRequests.filter(r => ['Pending', 'Accepted', 'InProgress'].includes(r.status));
    const pastServices = myRequests.filter(r => ['Completed', 'Cancelled'].includes(r.status));

    const SERVICES = [
        { icon: '⚡', label: 'Battery Jump-start', type: 'Car' },
        { icon: '🔧', label: 'Engine Check', type: 'Car' },
        { icon: '🔨', label: 'Tyre Puncture', type: 'Car' },
        { icon: '⛽', label: 'Fuel Delivery', type: 'Car' },
        { icon: '🚛', label: 'Towing Service', type: 'Car' },
        { icon: '🏍️', label: 'Bike Repair', type: 'Bike' },
        { icon: '🔗', label: 'Chain Repair', type: 'Bike' },
        { icon: '🆘', label: 'Emergency SOS', type: 'Car' },
    ];

    if (isLoading) return (
        <div className="ud-layout">
            <div className="ud-sidebar" />
            <div className="ud-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#a39585' }}>
                    <RefreshCcw size={40} style={{ animation: 'spin 1s linear infinite', color: '#D6B588' }} />
                    <p style={{ marginTop: '1rem' }}>Loading your dashboard...</p>
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div className="ud-layout">
            {/* ─── SIDEBAR ─── */}
            <aside className="ud-sidebar">
                <div className="ud-brand">
                    Car<span>Assist</span>
                </div>

                <div className="ud-user-card">
                    <div className="ud-avatar">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{user?.name}</div>
                        <div style={{ color: '#a39585', fontSize: '0.78rem' }}>{user?.email}</div>
                        <span className="ud-role-badge">Customer</span>
                    </div>
                </div>

                <nav className="ud-nav">
                    {[
                        { id: 'requests', icon: <Clock size={20} />, label: 'My Requests' },
                        { id: 'book', icon: <Wrench size={20} />, label: 'Book Service' },
                        { id: 'history', icon: <History size={20} />, label: 'History' },
                        { id: 'profile', icon: <Settings size={20} />, label: 'Profile' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            className={`ud-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                            {tab.id === 'requests' && activeServices.length > 0 && (
                                <span className="ud-badge">{activeServices.length}</span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="ud-sidebar-footer">
                    <button className="ud-nav-item" onClick={() => navigate('/')}>
                        <Home size={20} /> <span>Go Home</span>
                    </button>
                    <button className="ud-nav-item logout" onClick={handleLogout}>
                        <LogOut size={20} /> <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* ─── MAIN CONTENT ─── */}
            <main className="ud-main fade-in">
                <header className="ud-topbar">
                    <div>
                        <h1 className="ud-page-title">
                            {activeTab === 'requests' && 'Active Requests'}
                            {activeTab === 'book' && 'Book a Service'}
                            {activeTab === 'history' && 'Service History'}
                            {activeTab === 'profile' && 'My Profile'}
                        </h1>
                        <p className="ud-page-sub">
                            {activeTab === 'requests' && `You have ${activeServices.length} active request(s)`}
                            {activeTab === 'book' && 'Choose a service and get help fast'}
                            {activeTab === 'history' && `${pastServices.length} completed or cancelled service(s)`}
                            {activeTab === 'profile' && 'Manage your personal details'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="ud-icon-btn" onClick={fetchData} title="Refresh">
                            <RefreshCcw size={18} />
                        </button>
                    </div>
                </header>

                {/* ═══ REQUESTS TAB ═══ */}
                {activeTab === 'requests' && (
                    <div className="ud-content">
                        {activeServices.length === 0 ? (
                            <div className="ud-empty">
                                <AlertCircle size={48} color="#a39585" />
                                <h3>No Active Requests</h3>
                                <p>Book a service to get started. Our mechanics are standing by!</p>
                                <button className="ud-btn-primary" onClick={() => setActiveTab('book')}>
                                    Book a Service
                                </button>
                            </div>
                        ) : (
                            <div className="ud-cards-grid">
                                {activeServices.map(req => (
                                    <div key={req._id} className="ud-request-card">
                                        <div className="ud-card-header">
                                            <div>
                                                <h3>{req.serviceType}</h3>
                                                <p style={{ color: '#a39585', fontSize: '0.85rem', marginTop: '4px' }}>
                                                    <Car size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                                    {req.vehicleType}
                                                </p>
                                            </div>
                                            <StatusBadge status={req.status} />
                                        </div>
                                        <div className="ud-card-body">
                                            <div className="ud-info-row">
                                                <MapPin size={14} color="#a39585" />
                                                <span>{req.location?.address || 'Location not set'}</span>
                                            </div>
                                            {req.mechanicId && (
                                                <div className="ud-info-row">
                                                    <Wrench size={14} color="#D6B588" />
                                                    <span style={{ color: '#D6B588' }}>
                                                        Mechanic: {req.mechanicId.shopName || 'Assigned'}
                                                    </span>
                                                </div>
                                            )}
                                            {req.description && (
                                                <div className="ud-info-row">
                                                    <span style={{ color: '#a39585', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                                        "{req.description}"
                                                    </span>
                                                </div>
                                            )}
                                            <div className="ud-info-row">
                                                <Clock size={14} color="#a39585" />
                                                <span>{new Date(req.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="ud-card-footer">
                                            <span style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                color: req.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b',
                                                fontSize: '0.82rem', fontWeight: 600
                                            }}>
                                                <CreditCard size={14} />
                                                Payment: {req.paymentStatus}
                                            </span>
                                            {req.status === 'Pending' && (
                                                <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontStyle: 'italic' }}>
                                                    Searching for mechanic...
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ BOOK SERVICE TAB ═══ */}
                {activeTab === 'book' && (
                    <div className="ud-content">
                        <div className="ud-section-header">
                            <h2>Available Services</h2>
                            <p>Select a service type to begin your booking</p>
                        </div>
                        <div className="ud-services-grid">
                            {SERVICES.map((svc, i) => (
                                <button
                                    key={i}
                                    className="ud-service-card"
                                    onClick={() => navigate('/book-assistance', {
                                        state: { serviceType: svc.label, vehicleType: svc.type }
                                    })}
                                >
                                    <div className="ud-service-icon">{svc.icon}</div>
                                    <div className="ud-service-label">{svc.label}</div>
                                    <div className="ud-service-type">{svc.type}</div>
                                </button>
                            ))}
                        </div>

                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <p style={{ color: '#a39585', marginBottom: '1rem' }}>
                                Or fill in a custom service request
                            </p>
                            <button
                                className="ud-btn-primary"
                                onClick={() => navigate('/book-assistance')}
                            >
                                Custom Booking Form
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══ HISTORY TAB ═══ */}
                {activeTab === 'history' && (
                    <div className="ud-content">
                        {pastServices.length === 0 ? (
                            <div className="ud-empty">
                                <History size={48} color="#a39585" />
                                <h3>No Service History</h3>
                                <p>Your completed and cancelled services will appear here.</p>
                            </div>
                        ) : (
                            <div className="ud-history-list">
                                {pastServices.map(req => (
                                    <div key={req._id} className="ud-history-item">
                                        <div className="ud-history-left">
                                            <div className="ud-history-icon">
                                                {req.status === 'Completed' ? <CheckCircle size={20} color="#10b981" /> : <X size={20} color="#ef4444" />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#fff' }}>{req.serviceType}</div>
                                                <div style={{ color: '#a39585', fontSize: '0.82rem', marginTop: '2px' }}>
                                                    {req.vehicleType} • {req.location?.address || 'N/A'}
                                                </div>
                                                {req.mechanicId && (
                                                    <div style={{ color: '#D6B588', fontSize: '0.82rem', marginTop: '2px' }}>
                                                        Mechanic: {req.mechanicId.shopName}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="ud-history-right">
                                            <StatusBadge status={req.status} />
                                            <div style={{ color: '#a39585', fontSize: '0.78rem', marginTop: '6px', textAlign: 'right' }}>
                                                {new Date(req.completedAt || req.updatedAt || req.createdAt).toLocaleDateString()}
                                            </div>
                                            <div style={{
                                                color: req.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b',
                                                fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '4px'
                                            }}>
                                                <CreditCard size={12} /> {req.paymentStatus}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ PROFILE TAB ═══ */}
                {activeTab === 'profile' && (
                    <div className="ud-content">
                        <div className="ud-profile-card">
                            <div className="ud-profile-hero">
                                <div className="ud-profile-avatar">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <h2 style={{ color: '#fff', margin: 0 }}>{user?.name}</h2>
                                    <span className="ud-role-badge" style={{ marginTop: '8px', display: 'inline-block' }}>
                                        Customer Account
                                    </span>
                                </div>
                                {!editingProfile && (
                                    <button
                                        className="ud-icon-btn"
                                        onClick={() => setEditingProfile(true)}
                                        style={{ marginLeft: 'auto' }}
                                    >
                                        <Edit3 size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="ud-profile-fields">
                                <div className="ud-field-group">
                                    <label>
                                        <User size={14} /> Full Name
                                    </label>
                                    {editingProfile ? (
                                        <input
                                            type="text"
                                            value={profileData.name}
                                            onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                                            className="ud-profile-input"
                                        />
                                    ) : (
                                        <div className="ud-field-value">{user?.name || '—'}</div>
                                    )}
                                </div>

                                <div className="ud-field-group">
                                    <label>
                                        <Mail size={14} /> Email Address
                                    </label>
                                    <div className="ud-field-value ud-field-readonly">{user?.email}</div>
                                </div>

                                <div className="ud-field-group">
                                    <label>
                                        <Phone size={14} /> Phone Number
                                    </label>
                                    {editingProfile ? (
                                        <input
                                            type="tel"
                                            value={profileData.phone}
                                            onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                                            className="ud-profile-input"
                                        />
                                    ) : (
                                        <div className="ud-field-value">{user?.phone || 'Not set'}</div>
                                    )}
                                </div>
                            </div>

                            {editingProfile && (
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button
                                        className="ud-btn-primary"
                                        onClick={handleProfileSave}
                                        disabled={savingProfile}
                                    >
                                        <Save size={16} />
                                        {savingProfile ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        className="ud-btn-secondary"
                                        onClick={() => {
                                            setEditingProfile(false);
                                            setProfileData({ name: user?.name || '', phone: user?.phone || '' });
                                        }}
                                    >
                                        <X size={16} /> Cancel
                                    </button>
                                </div>
                            )}

                            <div className="ud-stats-row">
                                <div className="ud-stat-pill">
                                    <span className="ud-stat-num">{myRequests.length}</span>
                                    <span className="ud-stat-label">Total Requests</span>
                                </div>
                                <div className="ud-stat-pill">
                                    <span className="ud-stat-num">{pastServices.filter(r => r.status === 'Completed').length}</span>
                                    <span className="ud-stat-label">Completed</span>
                                </div>
                                <div className="ud-stat-pill">
                                    <span className="ud-stat-num">{activeServices.length}</span>
                                    <span className="ud-stat-label">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default UserDashboard;
