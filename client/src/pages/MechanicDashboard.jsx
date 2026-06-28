import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { io } from 'socket.io-client';
import {
    Car, Bike, MapPin, Clock, CheckCircle, AlertCircle, Calendar,
    LogOut, Home, Settings, Wrench, TrendingUp, RefreshCcw,
    ToggleLeft, ToggleRight, User, Star, X, History, DollarSign,
    QrCode, Upload, Trash2, Copy, Link, MessageCircle
} from 'lucide-react';
import './MechanicDashboard.css';
import ChatBox from '../components/ChatBox';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const COLORS = ['#D6B588', '#C6C0B9', '#705E46', '#10b981', '#3b82f6'];

const StatusBadge = ({ status }) => {
    const map = {
        Pending: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
        Accepted: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
        OnTheWay: { bg: 'rgba(214,181,136,0.15)', color: '#D6B588', border: 'rgba(214,181,136,0.3)' },
        Arrived: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
        InProgress: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
        Completed: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
        Cancelled: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
    };
    const s = map[status] || map.Pending;
    return (
        <span style={{
            padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
            background: s.bg, color: s.color, border: `1px solid ${s.border}`
        }}>
            {status}
        </span>
    );
};

const MechanicDashboard = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('requests');
    const [socket, setSocket] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [mechanicId, setMechanicId] = useState(null);
    const [mechanicProfile, setMechanicProfile] = useState(null);
    const [earnings, setEarnings] = useState(null);
    const [isAvailable, setIsAvailable] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [togglingAvailability, setTogglingAvailability] = useState(false);
    const [activeChatRequest, setActiveChatRequest] = useState(null);

    // Payment QR state
    const [qrPreview, setQrPreview] = useState('');
    const [qrUpiId, setQrUpiId] = useState('');
    const [savingQR, setSavingQR] = useState(false);
    const [qrDragOver, setQrDragOver] = useState(false);
    const qrFileRef = useRef(null);

    // Fetch mechanic profile
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API}/api/mechanics/profile/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMechanicId(data._id);
                    setMechanicProfile(data);
                    setIsAvailable(data.availability);
                    // Load saved QR data
                    if (data.paymentQR) setQrPreview(data.paymentQR);
                    if (data.paymentUpiId) setQrUpiId(data.paymentUpiId);
                } else {
                    toast.error('Mechanic profile not found');
                    navigate('/');
                }
            } catch {
                toast.error('Failed to load profile');
            }
        };
        if (token) fetchProfile();
    }, [token]);

    // Fetch data after mechanicId is set
    useEffect(() => {
        if (mechanicId) fetchData();
    }, [mechanicId]);

    // Fetch earnings when earnings tab is active
    useEffect(() => {
        if (token && activeTab === 'earnings') fetchEarnings();
    }, [activeTab, token]);

    // Socket.io
    useEffect(() => {
        if (!token) return;
        const newSocket = io(API);
        setSocket(newSocket);

        newSocket.on('newServiceRequest', (req) => {
            setPendingRequests(prev => {
                if (prev.some(r => r._id === req._id)) return prev;
                toast('🔔 New service request!', { style: { background: '#1e140a', color: '#fff' } });
                return [req, ...prev];
            });
        });

        newSocket.on('requestAccepted', (id) => {
            setPendingRequests(prev => prev.filter(r => r._id !== id));
        });

        newSocket.on('requestStatusUpdate', ({ requestId, status }) => {
            setMyRequests(prev => prev.map(r => r._id === requestId ? { ...r, status } : r));
        });

        return () => newSocket.disconnect();
    }, [token]);

    // Geolocation broadcast
    useEffect(() => {
        const activeJobs = myRequests.filter(r => r.status === 'Accepted' || r.status === 'InProgress');
        if (!socket || activeJobs.length === 0 || !navigator.geolocation) return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                activeJobs.forEach(req => {
                    socket.emit('mechanicLocationUpdate', {
                        requestId: req._id,
                        mechanicId,
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                });
            },
            (err) => console.log('Geo error:', err),
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [socket, myRequests, mechanicId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [pendingRes, myRes] = await Promise.all([
                fetch(`${API}/api/services/pending`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API}/api/services/mechanic/${mechanicId}`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (pendingRes.ok) setPendingRequests(await pendingRes.json());
            if (myRes.ok) setMyRequests(await myRes.json());
        } catch {
            toast.error('Error loading dashboard data');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEarnings = async () => {
        try {
            const res = await fetch(`${API}/api/mechanics/earnings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setEarnings(await res.json());
        } catch {
            console.error('Earnings fetch failed');
        }
    };

    const handleAccept = async (id) => {
        try {
            const res = await fetch(`${API}/api/services/${id}/accept`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const updatedReq = await res.json();
                toast.success('Request accepted!');
                setPendingRequests(prev => prev.filter(r => r._id !== id));
                setMyRequests(prev => [updatedReq, ...prev.filter(r => r._id !== id)]);
                // We still call fetchData() to ensure everything is synced, but UI updates instantly
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Already taken by another mechanic');
                setPendingRequests(prev => prev.filter(r => r._id !== id));
            }
        } catch {
            toast.error('Server error');
        }
    };

    const handleReject = async (id) => {
        try {
            const res = await fetch(`${API}/api/services/${id}/reject`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast('Request declined', { icon: '↩️' });
                setPendingRequests(prev => prev.filter(r => r._id !== id));
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.message);
            }
        } catch {
            toast.error('Server error');
        }
    };

    const handleComplete = async (id) => {
        handleUpdateStatus(id, 'Completed');
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            const res = await fetch(`${API}/api/services/${id}/status`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                toast.success(`Status updated to ${status}`);
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.message);
            }
        } catch {
            toast.error('Server error');
        }
    };

    const handleToggleAvailability = async () => {
        setTogglingAvailability(true);
        try {
            const res = await fetch(`${API}/api/mechanics/availability`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setIsAvailable(data.availability);
                toast.success(data.message);
            }
        } catch {
            toast.error('Failed to toggle availability');
        } finally {
            setTogglingAvailability(false);
        }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    // ── QR Handlers ──────────────────────────────────────────────────────────
    const handleQRFile = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file (PNG, JPG, etc.)');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image must be smaller than 2MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => setQrPreview(e.target.result);
        reader.readAsDataURL(file);
    };

    const savePaymentQR = async () => {
        setSavingQR(true);
        try {
            const res = await fetch(`${API}/api/mechanics/payment-qr`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ paymentQR: qrPreview, paymentUpiId: qrUpiId })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Payment QR saved successfully!');
                setMechanicProfile(prev => ({ ...prev, paymentQR: qrPreview, paymentUpiId: qrUpiId }));
            } else {
                toast.error(data.message || 'Failed to save QR');
            }
        } catch { toast.error('Server error'); }
        finally { setSavingQR(false); }
    };

    const removeQR = async () => {
        setQrPreview('');
        setSavingQR(true);
        try {
            await fetch(`${API}/api/mechanics/payment-qr`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ paymentQR: '', paymentUpiId: qrUpiId })
            });
            toast('QR removed', { icon: '🗑️' });
            setMechanicProfile(prev => ({ ...prev, paymentQR: '' }));
        } catch { toast.error('Server error'); }
        finally { setSavingQR(false); }
    };

    const activeJobs = myRequests.filter(r => ['Accepted', 'OnTheWay', 'Arrived', 'InProgress'].includes(r.status));
    const pastJobs = myRequests.filter(r => r.status === 'Completed' || r.status === 'Cancelled');

    const serviceStatsMap = myRequests
        .filter(r => r.status === 'Completed')
        .reduce((acc, r) => { acc[r.serviceType] = (acc[r.serviceType] || 0) + 1; return acc; }, {});
    const chartData = Object.entries(serviceStatsMap).map(([name, value]) => ({ name, value }));

    const VehicleIcon = ({ type }) => type?.toLowerCase() === 'bike'
        ? <Bike size={16} color="#D6B588" />
        : <Car size={16} color="#D6B588" />;

    if (isLoading && !mechanicProfile) return (
        <div className="md-layout">
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#a39585' }}>
                    <RefreshCcw size={40} style={{ animation: 'spin 1s linear infinite', color: '#D6B588' }} />
                    <p style={{ marginTop: '1rem' }}>Loading dashboard...</p>
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div className="md-layout">
            {/* ─── SIDEBAR ─── */}
            <aside className="md-sidebar">
                <div className="md-brand">Car<span>Assist</span></div>

                {/* Mechanic Profile Card */}
                <div className="md-profile-card">
                    <div className="md-avatar">
                        {mechanicProfile?.shopName?.charAt(0) || user?.name?.charAt(0) || 'M'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
                            {mechanicProfile?.shopName || user?.name}
                        </div>
                        <div style={{ color: '#a39585', fontSize: '0.75rem', marginTop: '2px' }}>
                            {mechanicProfile?.specialization?.join(', ')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                            <Star size={12} color="#f59e0b" fill="#f59e0b" />
                            <span style={{ color: '#f59e0b', fontSize: '0.78rem', fontWeight: 700 }}>
                                {mechanicProfile?.rating?.toFixed(1) || '0.0'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Availability Toggle */}
                <button
                    className={`md-availability-btn ${isAvailable ? 'online' : 'offline'}`}
                    onClick={handleToggleAvailability}
                    disabled={togglingAvailability}
                >
                    {isAvailable
                        ? <><ToggleRight size={20} /> Online — Taking Jobs</>
                        : <><ToggleLeft size={20} /> Offline — Not Taking Jobs</>}
                </button>

                <nav className="md-nav">
                    {[
                        { id: 'requests', icon: <AlertCircle size={20} />, label: 'Live Requests', count: pendingRequests.length },
                        { id: 'active', icon: <Clock size={20} />, label: 'Active Jobs', count: activeJobs.length },
                        { id: 'history', icon: <History size={20} />, label: 'Work History' },
                        { id: 'earnings', icon: <DollarSign size={20} />, label: 'Earnings' },
                        { id: 'stats', icon: <TrendingUp size={20} />, label: 'Analytics' },
                        { id: 'profile', icon: <User size={20} />, label: 'My Profile' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            className={`md-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon} <span>{tab.label}</span>
                            {tab.count > 0 && <span className="md-badge">{tab.count}</span>}
                        </button>
                    ))}
                </nav>

                <div className="md-sidebar-footer">
                    <button className="md-nav-item" onClick={() => navigate('/')}>
                        <Home size={20} /> <span>Home</span>
                    </button>
                    <button className="md-nav-item logout" onClick={handleLogout}>
                        <LogOut size={20} /> <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* ─── MAIN ─── */}
            <main className="md-main fade-in">
                <header className="md-topbar">
                    <div>
                        <h1 className="md-page-title">
                            {activeTab === 'requests' && 'Live Requests'}
                            {activeTab === 'active' && 'Active Jobs'}
                            {activeTab === 'history' && 'Work History'}
                            {activeTab === 'earnings' && 'Earnings'}
                            {activeTab === 'stats' && 'Performance Analytics'}
                            {activeTab === 'profile' && 'My Profile'}
                        </h1>
                    </div>
                    <button className="md-icon-btn" onClick={fetchData} title="Refresh">
                        <RefreshCcw size={18} />
                    </button>
                </header>

                <div className="md-content">

                    {/* ═══ LIVE REQUESTS ═══ */}
                    {activeTab === 'requests' && (
                        <div>
                            {pendingRequests.length === 0 ? (
                                <div className="md-empty">
                                    <AlertCircle size={48} color="#a39585" />
                                    <h3>No Pending Requests</h3>
                                    <p>New customer requests will appear here in real-time.</p>
                                </div>
                            ) : (
                                <div className="md-request-list">
                                    {pendingRequests.map(req => (
                                        <div key={req._id} className="md-request-card pending">
                                            <div className="md-card-top">
                                                <div>
                                                    <h3><VehicleIcon type={req.vehicleType} /> {req.serviceType}</h3>
                                                    <p className="md-customer-name">{req.userId?.name || 'Customer'}</p>
                                                </div>
                                                <StatusBadge status="Pending" />
                                            </div>
                                            <div className="md-card-info">
                                                <span><MapPin size={13} /> {req.location?.address || 'N/A'}</span>
                                                <span><Clock size={13} /> {new Date(req.createdAt).toLocaleTimeString()}</span>
                                                {req.description && <span style={{ fontStyle: 'italic', color: '#a39585' }}>"{req.description}"</span>}
                                            </div>
                                            <div className="md-card-actions">
                                                <button className="md-btn-accept" onClick={() => handleAccept(req._id)}>
                                                    <CheckCircle size={16} /> Accept
                                                </button>
                                                <button className="md-btn-reject" onClick={() => handleReject(req._id)}>
                                                    <X size={16} /> Decline
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ ACTIVE JOBS ═══ */}
                    {activeTab === 'active' && (
                        <div>
                            {activeJobs.length === 0 ? (
                                <div className="md-empty">
                                    <Clock size={48} color="#a39585" />
                                    <h3>No Active Jobs</h3>
                                    <p>Accept a pending request to start working.</p>
                                </div>
                            ) : (
                                <div className="md-request-list">
                                    {activeJobs.map(req => (
                                        <div key={req._id} className="md-request-card active">
                                            <div className="md-card-top">
                                                <div>
                                                    <h3><VehicleIcon type={req.vehicleType} /> {req.serviceType}</h3>
                                                    <p className="md-customer-name">{req.userId?.name || 'Customer'}</p>
                                                </div>
                                                <StatusBadge status={req.status} />
                                            </div>
                                            <div className="md-card-info">
                                                <span><MapPin size={13} /> {req.location?.address || 'N/A'}</span>
                                                {req.userId?.phone && <span>📞 {req.userId.phone}</span>}
                                                {req.description && <span style={{ fontStyle: 'italic', color: '#a39585' }}>"{req.description}"</span>}
                                            </div>
                                            <div className="md-card-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                {req.status === 'Accepted' && (
                                                    <button className="md-btn-complete" style={{ flex: 1, background: '#D6B588', color: '#000', borderColor: '#D6B588' }} onClick={() => handleUpdateStatus(req._id, 'OnTheWay')}>
                                                        <Car size={16} /> Mark On The Way
                                                    </button>
                                                )}
                                                {req.status === 'OnTheWay' && (
                                                    <button className="md-btn-complete" style={{ flex: 1, background: '#f59e0b', color: '#000', borderColor: '#f59e0b' }} onClick={() => handleUpdateStatus(req._id, 'Arrived')}>
                                                        <MapPin size={16} /> Mark Arrived
                                                    </button>
                                                )}
                                                {req.status === 'Arrived' && (
                                                    <button className="md-btn-complete" style={{ flex: 1, background: '#3b82f6', color: '#fff', borderColor: '#3b82f6' }} onClick={() => handleUpdateStatus(req._id, 'InProgress')}>
                                                        <Wrench size={16} /> Start Service
                                                    </button>
                                                )}
                                                {req.status === 'InProgress' && (
                                                    <button className="md-btn-complete" style={{ flex: 1 }} onClick={() => handleUpdateStatus(req._id, 'Completed')}>
                                                        <CheckCircle size={16} /> Mark Completed
                                                    </button>
                                                )}
                                                <button 
                                                    className="md-btn-reject" 
                                                    style={{ flex: 1, background: '#3b82f6', color: '#fff', borderColor: '#3b82f6' }} 
                                                    onClick={() => setActiveChatRequest(req._id)}
                                                >
                                                    <MessageCircle size={16} /> Chat
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ HISTORY ═══ */}
                    {activeTab === 'history' && (
                        <div>
                            {pastJobs.length === 0 ? (
                                <div className="md-empty">
                                    <History size={48} color="#a39585" />
                                    <h3>No Work History Yet</h3>
                                    <p>Completed and cancelled jobs will appear here.</p>
                                </div>
                            ) : (
                                <div className="md-history-list">
                                    {pastJobs.map(req => (
                                        <div key={req._id} className="md-history-item">
                                            <div className="md-history-left">
                                                <div className="md-history-icon">
                                                    {req.status === 'Completed'
                                                        ? <CheckCircle size={18} color="#10b981" />
                                                        : <X size={18} color="#ef4444" />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: '#fff' }}>
                                                        <VehicleIcon type={req.vehicleType} /> {req.serviceType}
                                                    </div>
                                                    <div style={{ color: '#a39585', fontSize: '0.82rem' }}>
                                                        Customer: {req.userId?.name || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <StatusBadge status={req.status} />
                                                <div style={{ color: '#a39585', fontSize: '0.78rem', marginTop: '6px' }}>
                                                    {req.completedAt
                                                        ? new Date(req.completedAt).toLocaleDateString()
                                                        : new Date(req.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ EARNINGS ═══ */}
                    {activeTab === 'earnings' && (
                        <div>
                            <div className="md-earnings-grid">
                                <div className="md-earnings-card gold">
                                    <DollarSign size={28} />
                                    <div className="md-earnings-num">{earnings?.totalCompleted || pastJobs.filter(r => r.status === 'Completed').length}</div>
                                    <div className="md-earnings-label">Total Completed Jobs</div>
                                </div>
                                <div className="md-earnings-card blue">
                                    <Calendar size={28} />
                                    <div className="md-earnings-num">{earnings?.thisMonthCompleted || 0}</div>
                                    <div className="md-earnings-label">This Month</div>
                                </div>
                                <div className="md-earnings-card green">
                                    <TrendingUp size={28} />
                                    <div className="md-earnings-num">{activeJobs.length}</div>
                                    <div className="md-earnings-label">Active Now</div>
                                </div>
                                <div className="md-earnings-card amber">
                                    <Star size={28} />
                                    <div className="md-earnings-num">{mechanicProfile?.rating?.toFixed(1) || '0.0'}</div>
                                    <div className="md-earnings-label">Your Rating</div>
                                </div>
                            </div>

                            {earnings?.recentJobs && earnings.recentJobs.length > 0 && (
                                <div style={{ marginTop: '2rem' }}>
                                    <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Recent Completed Jobs</h3>
                                    <div className="md-history-list">
                                        {earnings.recentJobs.slice(0, 8).map((req, i) => (
                                            <div key={i} className="md-history-item">
                                                <div className="md-history-left">
                                                    <CheckCircle size={18} color="#10b981" />
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: '#fff' }}>{req.serviceType}</div>
                                                        <div style={{ color: '#a39585', fontSize: '0.82rem' }}>{req.vehicleType}</div>
                                                    </div>
                                                </div>
                                                <div style={{ color: '#a39585', fontSize: '0.82rem' }}>
                                                    {req.completedAt ? new Date(req.completedAt).toLocaleDateString() : '—'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ ANALYTICS ═══ */}
                    {activeTab === 'stats' && (
                        <div>
                            <div className="md-stats-grid">
                                {[
                                    { label: 'Total Jobs', val: myRequests.length, color: '#D6B588' },
                                    { label: 'Completed', val: pastJobs.filter(r => r.status === 'Completed').length, color: '#10b981' },
                                    { label: 'Pending', val: pendingRequests.length, color: '#f59e0b' },
                                    { label: 'Active Now', val: activeJobs.length, color: '#3b82f6' },
                                ].map((s, i) => (
                                    <div key={i} className="md-stat-pill" style={{ borderColor: `${s.color}33` }}>
                                        <span style={{ fontSize: '2rem', fontWeight: 900, color: s.color }}>{s.val}</span>
                                        <span style={{ color: '#a39585', fontSize: '0.82rem' }}>{s.label}</span>
                                    </div>
                                ))}
                            </div>

                            {chartData.length > 0 ? (
                                <div className="md-chart-card">
                                    <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Service Type Breakdown</h3>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie data={chartData} cx="50%" cy="50%" outerRadius={90} dataKey="value" labelLine={false}>
                                                {chartData.map((_, i) => (
                                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ background: '#1e140a', borderColor: '#D6B588', color: '#fff' }} />
                                            <Legend wrapperStyle={{ color: '#a39585' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="md-empty" style={{ marginTop: '2rem' }}>
                                    <TrendingUp size={40} color="#a39585" />
                                    <p>Complete services to unlock analytics</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ PROFILE ═══ */}
                    {activeTab === 'profile' && (
                        <div className="md-profile-section">
                            <div className="md-profile-hero">
                                <div className="md-profile-avatar-lg">
                                    {mechanicProfile?.shopName?.charAt(0)?.toUpperCase() || 'M'}
                                </div>
                                <div>
                                    <h2 style={{ color: '#fff', margin: '0 0 4px' }}>{mechanicProfile?.shopName}</h2>
                                    <p style={{ color: '#a39585', margin: '0 0 8px', fontSize: '0.88rem' }}>
                                        Owner: {mechanicProfile?.userId?.name}
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {mechanicProfile?.specialization?.map(s => (
                                            <span key={s} className="md-spec-tag">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="md-profile-fields">
                                {[
                                    { label: 'Email', value: mechanicProfile?.userId?.email },
                                    { label: 'Phone', value: mechanicProfile?.userId?.phone || 'Not set' },
                                    { label: 'Location', value: mechanicProfile?.locationText || 'Not set' },
                                    { label: 'Status', value: mechanicProfile?.isVerified ? '✅ Verified Partner' : '⏳ Pending Verification' },
                                    { label: 'Rating', value: `${mechanicProfile?.rating?.toFixed(1) || '0.0'} / 5.0 ⭐` },
                                    { label: 'Availability', value: isAvailable ? '🟢 Online' : '🔴 Offline' },
                                ].map(field => (
                                    <div key={field.label} className="md-profile-field">
                                        <span className="md-field-label">{field.label}</span>
                                        <span className="md-field-value">{field.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* ── Payment QR Section ── */}
                            <div className="md-qr-card">
                                <div className="md-qr-card-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <QrCode size={20} color="#D6B588" />
                                        <div>
                                            <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>Payment QR Code</h3>
                                            <p style={{ margin: 0, color: '#a39585', fontSize: '0.8rem' }}>Customers scan this to pay you directly</p>
                                        </div>
                                    </div>
                                    {qrPreview && (
                                        <button className="md-qr-remove-btn" onClick={removeQR} title="Remove QR">
                                            <Trash2 size={15} /> Remove
                                        </button>
                                    )}
                                </div>

                                <div className="md-qr-body">
                                    {/* Upload Drop Zone */}
                                    <div
                                        className={`md-qr-dropzone ${qrDragOver ? 'drag-over' : ''} ${qrPreview ? 'has-preview' : ''}`}
                                        onClick={() => qrFileRef.current?.click()}
                                        onDragOver={e => { e.preventDefault(); setQrDragOver(true); }}
                                        onDragLeave={() => setQrDragOver(false)}
                                        onDrop={e => { e.preventDefault(); setQrDragOver(false); handleQRFile(e.dataTransfer.files[0]); }}
                                    >
                                        {qrPreview ? (
                                            <img src={qrPreview} alt="Payment QR" className="md-qr-preview" />
                                        ) : (
                                            <div className="md-qr-placeholder">
                                                <Upload size={32} color="#D6B588" />
                                                <p>Click or drag & drop your QR code image</p>
                                                <span>PNG, JPG up to 2MB</span>
                                            </div>
                                        )}
                                        <input
                                            ref={qrFileRef}
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={e => handleQRFile(e.target.files[0])}
                                        />
                                    </div>

                                    {/* UPI ID Input */}
                                    <div className="md-qr-upi">
                                        <label><Link size={13} /> UPI ID <span style={{ color: '#a39585', fontWeight: 400 }}>(optional)</span></label>
                                        <input
                                            type="text"
                                            className="md-qr-upi-input"
                                            placeholder="yourname@upi or yourname@paytm"
                                            value={qrUpiId}
                                            onChange={e => setQrUpiId(e.target.value)}
                                        />
                                        {qrUpiId && (
                                            <button
                                                className="md-qr-copy-btn"
                                                onClick={() => { navigator.clipboard.writeText(qrUpiId); toast.success('UPI ID copied!'); }}
                                            >
                                                <Copy size={13} /> Copy
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <button
                                    className="md-qr-save-btn"
                                    onClick={savePaymentQR}
                                    disabled={savingQR || (!qrPreview && !qrUpiId)}
                                >
                                    {savingQR ? 'Saving...' : '💾 Save Payment QR'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {activeChatRequest && (
                <ChatBox 
                    requestId={activeChatRequest} 
                    onClose={() => setActiveChatRequest(null)} 
                />
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default MechanicDashboard;
