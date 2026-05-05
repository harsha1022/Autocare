import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
    Car, Bike, Zap, Truck, Clock, CheckCircle, X,
    MapPin, Wrench, CreditCard, User, Phone, Mail,
    Edit3, Save, RefreshCcw, AlertCircle, History,
    ChevronRight, ArrowRight
} from 'lucide-react';
import './Home.css';

const API = 'http://localhost:5000';

const STATUS_META = {
    Pending:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)' },
    Accepted:   { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)' },
    InProgress: { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)' },
    Completed:  { color: '#D6B588', bg: 'rgba(214,181,136,0.12)', border: 'rgba(214,181,136,0.25)' },
    Cancelled:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)' },
};

const StatusPill = ({ status }) => {
    const s = STATUS_META[status] || STATUS_META.Pending;
    return (
        <span style={{
            padding: '3px 11px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
            background: s.bg, color: s.color, border: `1px solid ${s.border}`
        }}>{status}</span>
    );
};

const QUICK_SERVICES = [
    { icon: '⚡', label: 'Battery Jump-start', type: 'Car' },
    { icon: '🔧', label: 'Engine Check',       type: 'Car' },
    { icon: '🔨', label: 'Tyre Puncture',      type: 'Car' },
    { icon: '⛽', label: 'Fuel Delivery',       type: 'Car' },
    { icon: '🚛', label: 'Towing Service',      type: 'Car' },
    { icon: '🏍️', label: 'Bike Repair',        type: 'Bike' },
    { icon: '🔗', label: 'Chain Repair',        type: 'Bike' },
    { icon: '🆘', label: 'Emergency SOS',       type: 'Car' },
];

/* ════════════════════════════════════════════════════
   GUEST HOME — marketing landing page
════════════════════════════════════════════════════ */
const GuestHome = () => (
    <div className="home-container">
        <section className="hero">
            <div className="hero-content fade-in">
                <h1>Instant Roadside Assistance, <span>Anytime, Anywhere.</span></h1>
                <p>The smartest platform connecting you to verified mechanics for cars and bikes on highways and urban roads.</p>
                <div className="hero-btns">
                    <Link to="/login" className="btn-primary">Get Started Free</Link>
                    <Link to="/services" className="btn-secondary">Explore Services</Link>
                </div>
            </div>
            <div className="hero-image fade-in">
                <img src="/hero.png" alt="Car Assistance Hero" />
            </div>
        </section>

        <section className="services-overview">
            <div className="section-title">
                <h2>Our Specialized Services</h2>
                <p>Quick, reliable, and location-based assistance for your vehicle.</p>
            </div>
            <div className="services-grid">
                <Link to="/login" className="service-card">
                    <div className="icon"><Car size={64} strokeWidth={1.5} /></div>
                    <h3>Car Assistance</h3>
                    <p>Engine jump-start, tyre repair, fuel delivery, and more.</p>
                </Link>
                <Link to="/login" className="service-card">
                    <div className="icon"><Bike size={64} strokeWidth={1.5} /></div>
                    <h3>Bike Assistance</h3>
                    <p>Chain repair, spark plug replacement, and on-the-spot tuning.</p>
                </Link>
                <Link to="/login" className="service-card">
                    <div className="icon"><Zap size={64} strokeWidth={1.5} /></div>
                    <h3>Emergency Support</h3>
                    <p>24/7 SOS button and instant connection to verified partners.</p>
                </Link>
                <Link to="/login" className="service-card">
                    <div className="icon"><Truck size={64} strokeWidth={1.5} /></div>
                    <h3>Towing Services</h3>
                    <p>Flatbed and standard towing for short/long distances.</p>
                </Link>
            </div>
        </section>

        <section className="home-cta-strip">
            <div className="cta-inner">
                <h2>Ready to get back on the road?</h2>
                <p>Join thousands of drivers who trust CarAssist for roadside help.</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/login" className="btn-primary">Sign Up Free</Link>
                    <Link to="/partner" className="btn-secondary">Become a Partner</Link>
                </div>
            </div>
        </section>
    </div>
);

/* ════════════════════════════════════════════════════
   MECHANIC / ADMIN REDIRECT CARD
════════════════════════════════════════════════════ */
const RoleRedirectHome = ({ user }) => {
    const navigate = useNavigate();
    const isMechanic = user.role === 'mechanic';
    const path = isMechanic ? '/mechanic-dashboard' : '/admin';
    const label = isMechanic ? 'Mechanic Dashboard' : 'Admin Panel';
    const emoji = isMechanic ? '🔧' : '🛡️';
    const desc = isMechanic
        ? 'View pending requests, manage active jobs, track your earnings.'
        : 'Manage users, mechanics, service requests and view platform analytics.';

    return (
        <div className="home-container">
            <section className="role-redirect-section">
                <div className="role-redirect-card fade-in">
                    <div className="role-redirect-icon">{emoji}</div>
                    <h2>Welcome back, <span>{user.name.split(' ')[0]}</span>!</h2>
                    <p>{desc}</p>
                    <button className="btn-primary" onClick={() => navigate(path)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                        Go to {label} <ArrowRight size={18} />
                    </button>
                </div>
            </section>
        </div>
    );
};

/* ════════════════════════════════════════════════════
   USER SMART HOME / DASHBOARD
════════════════════════════════════════════════════ */
const UserSmartHome = ({ user, token }) => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileData, setProfileData] = useState({ name: user?.name || '', phone: user?.phone || '' });
    const [savingProfile, setSavingProfile] = useState(false);
    const [activeSection, setActiveSection] = useState('home'); // home | profile

    useEffect(() => {
        fetchRequests();
        // Live socket — update request status in real-time
        const socket = io(API);
        socket.on('requestStatusUpdate', ({ requestId, status }) => {
            setRequests(prev => prev.map(r => r._id === requestId ? { ...r, status } : r));
            const msgs = { Accepted: '🔧 A mechanic accepted your request!', Completed: '✅ Service completed!', Cancelled: '❌ Request was cancelled.' };
            if (msgs[status]) toast(msgs[status]);
        });
        return () => socket.disconnect();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const uid = user._id || user.id;
            const res = await fetch(`${API}/api/services/user/${uid}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setRequests(await res.json());
        } catch { toast.error('Could not load requests'); }
        finally { setLoading(false); }
    };

    const handleProfileSave = async () => {
        setSavingProfile(true);
        try {
            const res = await fetch(`${API}/api/users/me`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(profileData)
            });
            const data = await res.json();
            if (res.ok) { toast.success('Profile updated!'); setEditingProfile(false); }
            else toast.error(data.message);
        } catch { toast.error('Server error'); }
        finally { setSavingProfile(false); }
    };

    const activeReqs  = requests.filter(r => ['Pending', 'Accepted', 'InProgress'].includes(r.status));
    const historyReqs = requests.filter(r => ['Completed', 'Cancelled'].includes(r.status));

    return (
        <div className="smart-home-wrapper">
            {/* ── GREETING STRIP ── */}
            <div className="smart-greeting fade-in">
                <div className="greeting-left">
                    <div className="greeting-avatar">{user.name.charAt(0).toUpperCase()}</div>
                    <div>
                        <h2>Welcome back, <span>{user.name.split(' ')[0]}</span>! 🚗</h2>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                            <span className="greeting-badge">Customer</span>
                            {activeReqs.length > 0 && (
                                <span className="greeting-active-badge">
                                    {activeReqs.length} Active Request{activeReqs.length > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="greeting-actions">
                    <button
                        className={`greeting-tab ${activeSection === 'home' ? 'active' : ''}`}
                        onClick={() => setActiveSection('home')}
                    >
                        🏠 Dashboard
                    </button>
                    <button
                        className={`greeting-tab ${activeSection === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveSection('profile')}
                    >
                        👤 My Profile
                    </button>
                    <button className="greeting-refresh" onClick={fetchRequests} title="Refresh">
                        <RefreshCcw size={16} />
                    </button>
                </div>
            </div>

            {activeSection === 'home' && (
                <div className="smart-home-content fade-in">

                    {/* ── QUICK BOOK GRID ── */}
                    <section className="sh-section">
                        <div className="sh-section-header">
                            <h3>⚡ Quick Book a Service</h3>
                            <Link to="/book-assistance" className="sh-see-all">Custom request <ChevronRight size={14} /></Link>
                        </div>
                        <div className="sh-quick-grid">
                            {QUICK_SERVICES.map((svc, i) => (
                                <button
                                    key={i}
                                    className="sh-quick-tile"
                                    onClick={() => navigate('/book-assistance', {
                                        state: { serviceType: svc.label, vehicleType: svc.type }
                                    })}
                                >
                                    <span className="sh-tile-icon">{svc.icon}</span>
                                    <span className="sh-tile-label">{svc.label}</span>
                                    <span className="sh-tile-type">{svc.type}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* ── ACTIVE REQUESTS ── */}
                    <section className="sh-section">
                        <div className="sh-section-header">
                            <h3><Clock size={18} color="#f59e0b" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />Active Requests</h3>
                            {activeReqs.length > 0 && (
                                <span className="sh-count-badge">{activeReqs.length}</span>
                            )}
                        </div>

                        {loading ? (
                            <div className="sh-loading">
                                <RefreshCcw size={24} style={{ animation: 'spin 1s linear infinite', color: '#D6B588' }} />
                                <span>Loading your requests...</span>
                            </div>
                        ) : activeReqs.length === 0 ? (
                            <div className="sh-empty-inline">
                                <AlertCircle size={32} color="#a39585" />
                                <div>
                                    <p style={{ margin: 0, fontWeight: 600, color: '#fff' }}>No active requests</p>
                                    <p style={{ margin: '2px 0 0', color: '#a39585', fontSize: '0.85rem' }}>Use the Quick Book tiles above to get help fast.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="sh-request-cards">
                                {activeReqs.map(req => (
                                    <div key={req._id} className="sh-req-card">
                                        <div className="sh-req-top">
                                            <div>
                                                <div className="sh-req-title">{req.serviceType}</div>
                                                <div className="sh-req-sub">
                                                    <Car size={13} /> {req.vehicleType}
                                                </div>
                                            </div>
                                            <StatusPill status={req.status} />
                                        </div>
                                        <div className="sh-req-body">
                                            {req.location?.address && (
                                                <span className="sh-req-info">
                                                    <MapPin size={12} /> {req.location.address}
                                                </span>
                                            )}
                                            {req.mechanicId && (
                                                <span className="sh-req-info" style={{ color: '#D6B588' }}>
                                                    <Wrench size={12} /> {req.mechanicId.shopName}
                                                </span>
                                            )}
                                        </div>
                                        <div className="sh-req-footer">
                                            <span style={{
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                color: req.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b',
                                                fontSize: '0.78rem', fontWeight: 600
                                            }}>
                                                <CreditCard size={12} /> {req.paymentStatus}
                                            </span>
                                            <span style={{ color: '#a39585', fontSize: '0.75rem' }}>
                                                {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {req.status === 'Pending' && (
                                            <div className="sh-searching-bar">
                                                <span className="sh-pulse-dot" /> Searching for a nearby mechanic...
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* ── RECENT HISTORY ── */}
                    {historyReqs.length > 0 && (
                        <section className="sh-section">
                            <div className="sh-section-header">
                                <h3><History size={18} color="#3b82f6" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />Recent History</h3>
                                <Link to="/book-assistance" className="sh-see-all">Book again <ChevronRight size={14} /></Link>
                            </div>
                            <div className="sh-history-list">
                                {historyReqs.slice(0, 4).map(req => (
                                    <div key={req._id} className="sh-history-row">
                                        <div className="sh-hist-icon">
                                            {req.status === 'Completed'
                                                ? <CheckCircle size={16} color="#10b981" />
                                                : <X size={16} color="#ef4444" />}
                                        </div>
                                        <div className="sh-hist-info">
                                            <span className="sh-hist-title">{req.serviceType}</span>
                                            <span className="sh-hist-sub">
                                                {req.vehicleType} •{' '}
                                                {req.mechanicId?.shopName || 'Unassigned'} •{' '}
                                                {new Date(req.completedAt || req.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                                            <StatusPill status={req.status} />
                                            <button
                                                className="sh-rebook-btn"
                                                onClick={() => navigate('/book-assistance', { state: { serviceType: req.serviceType, vehicleType: req.vehicleType } })}
                                            >
                                                Rebook
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {/* ── PROFILE SECTION ── */}
            {activeSection === 'profile' && (
                <div className="smart-home-content fade-in">
                    <section className="sh-section">
                        <div className="sh-profile-card">
                            <div className="sh-profile-hero">
                                <div className="sh-profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
                                <div>
                                    <h3 style={{ color: '#fff', margin: '0 0 4px' }}>{user.name}</h3>
                                    <span className="greeting-badge">Customer Account</span>
                                </div>
                                {!editingProfile && (
                                    <button className="sh-edit-btn" onClick={() => setEditingProfile(true)} style={{ marginLeft: 'auto' }}>
                                        <Edit3 size={16} /> Edit
                                    </button>
                                )}
                            </div>

                            <div className="sh-profile-fields">
                                <div className="sh-field">
                                    <label><User size={13} /> Full Name</label>
                                    {editingProfile
                                        ? <input className="sh-input" value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} />
                                        : <div className="sh-field-val">{user.name}</div>}
                                </div>
                                <div className="sh-field">
                                    <label><Mail size={13} /> Email</label>
                                    <div className="sh-field-val sh-field-ro">{user.email}</div>
                                </div>
                                <div className="sh-field">
                                    <label><Phone size={13} /> Phone</label>
                                    {editingProfile
                                        ? <input className="sh-input" value={profileData.phone} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} />
                                        : <div className="sh-field-val">{user.phone || 'Not set'}</div>}
                                </div>
                            </div>

                            {editingProfile && (
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                                    <button className="btn-primary" style={{ padding: '0.6rem 1.4rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        onClick={handleProfileSave} disabled={savingProfile}>
                                        <Save size={15} /> {savingProfile ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button className="btn-secondary" style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        onClick={() => { setEditingProfile(false); setProfileData({ name: user.name, phone: user.phone || '' }); }}>
                                        <X size={15} /> Cancel
                                    </button>
                                </div>
                            )}

                            <div className="sh-stats-row">
                                {[
                                    { label: 'Total Requests', val: requests.length, color: '#D6B588' },
                                    { label: 'Completed',      val: historyReqs.filter(r => r.status === 'Completed').length, color: '#10b981' },
                                    { label: 'Active Now',     val: activeReqs.length, color: '#f59e0b' },
                                ].map(s => (
                                    <div key={s.label} className="sh-stat">
                                        <span style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color }}>{s.val}</span>
                                        <span style={{ fontSize: '0.78rem', color: '#a39585', fontWeight: 600 }}>{s.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

/* ════════════════════════════════════════════════════
   MAIN HOME COMPONENT — routes to correct view
════════════════════════════════════════════════════ */
const Home = () => {
    const { user, token } = useAuth();

    if (!user) return <GuestHome />;
    if (user.role === 'user') return <UserSmartHome user={user} token={token} />;
    return <RoleRedirectHome user={user} />;
};

export default Home;
