import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { io } from 'socket.io-client';
import { Car, Bike, MapPin, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import './MechanicDashboard.css';

const MechanicDashboard = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    
    const [socket, setSocket] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [mechanicId, setMechanicId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const COLORS = ['#D6B588', '#C6C0B9', '#705E46', '#10b981', '#3b82f6'];

    useEffect(() => {
        if (!user || user.role !== 'mechanic') {
            toast.error('Unauthorized access');
            navigate('/');
            return;
        }

        const fetchMechanicProfile = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/mechanics/status/${user.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setMechanicId(data._id);
                } else {
                    toast.error('Mechanic profile not found');
                    navigate('/');
                }
            } catch (err) {
                console.error(err);
                toast.error('Failed to load profile');
            }
        };

        fetchMechanicProfile();
    }, [user, navigate]);

    useEffect(() => {
        if (mechanicId) {
            fetchData();
        }
    }, [mechanicId]);

    // Setup Socket.io Connection for Real-Time Updates and Locking
    useEffect(() => {
        if (!user || user.role !== 'mechanic') return;

        // Connect to the backend
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to real-time service requests server');
        });

        // Listen for new requests
        newSocket.on('newServiceRequest', (newRequest) => {
            setPendingRequests((prevRequests) => {
                if (prevRequests.some((req) => req._id === newRequest._id)) {
                    return prevRequests;
                }
                toast('🔔 New Service Request Available!', {
                    icon: '🚨',
                    style: { borderRadius: '10px', background: '#333', color: '#fff' }
                });
                return [newRequest, ...prevRequests];
            });
        });

        // Listen for requests accepted by OTHER mechanics to remove them instantly
        newSocket.on('requestAccepted', (acceptedRequestId) => {
            setPendingRequests((prevRequests) => {
                const isPresent = prevRequests.some(r => r._id === acceptedRequestId);
                if (isPresent) {
                    // It was grabbed by someone else, remove it
                    return prevRequests.filter(req => req._id !== acceptedRequestId);
                }
                return prevRequests;
            });
        });

        return () => newSocket.disconnect();
    }, [user]);

    // Active Jobs Live Tracking (WebSockets + Geolocation)
    useEffect(() => {
        const activeServices = myRequests.filter(req => req.status === 'Accepted' || req.status === 'InProgress');
        if (!socket || activeServices.length === 0 || !navigator.geolocation) return;

        console.log(`Starting real-time tracking broadcast for ${activeServices.length} active jobs...`);
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // Broadcast coordinates to the backend for every active request so user can map it
                activeServices.forEach(req => {
                    socket.emit('mechanicLocationUpdate', {
                        requestId: req._id,
                        mechanicId: mechanicId,
                        lat: latitude,
                        lng: longitude
                    });
                });
            },
            (error) => console.log('Mechanic denied location or error:', error),
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [socket, myRequests, mechanicId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const pendingRes = await fetch('http://localhost:5000/api/services/pending', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (pendingRes.ok) {
                const pendingData = await pendingRes.json();
                setPendingRequests(pendingData);
            }

            const myRes = await fetch(`http://localhost:5000/api/services/mechanic/${mechanicId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (myRes.ok) {
                const myData = await myRes.json();
                setMyRequests(myData);
            }
        } catch (error) {
            console.error(error);
            toast.error('Error fetching dashboard data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/services/${id}/accept`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                toast.success('Service Request Accepted Successfully!');
                // Remove from pending instantly on our side
                setPendingRequests(prev => prev.filter(req => req._id !== id));
                fetchData(); // Refresh myRequests
            } else {
                const err = await res.json();
                toast.error(err.message || 'Someone else might have accepted this request already');
                // Could be it was already accepted, so remove it from list
                setPendingRequests(prev => prev.filter(req => req._id !== id));
            }
        } catch (err) {
            console.error(err);
            toast.error('Server error or network issue');
        }
    };

    const handleComplete = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/services/${id}/complete`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Service Marked as Completed!');
                // Notify user dashboard that service is done so it turns off maps
                if (socket) {
                    socket.emit('mechanicLocationUpdate', { requestId: id, status: 'Completed' }); // generic notify
                }
                fetchData(); // Refresh lists
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to complete request');
            }
        } catch (err) {
            console.error(err);
            toast.error('Server error');
        }
    };

    // Derived states
    const activeServices = myRequests.filter(req => req.status === 'Accepted' || req.status === 'InProgress');
    const pastServices = myRequests.filter(req => req.status === 'Completed' || req.status === 'Cancelled');

    // Chart Data Preparation
    const completedServices = myRequests.filter(req => req.status === 'Completed');
    const serviceStatsMap = completedServices.reduce((acc, curr) => {
        acc[curr.serviceType] = (acc[curr.serviceType] || 0) + 1;
        return acc;
    }, {});
    
    const chartData = Object.keys(serviceStatsMap).map((key) => ({
        name: key,
        value: serviceStatsMap[key]
    }));

    if (isLoading) return <div className="loading">Loading Dashboard...</div>;

    const renderVehicleIcon = (type) => {
        return type.toLowerCase() === 'car' ? <Car size={20} color="#D6B588"/> : <Bike size={20} color="#D6B588"/>;
    };

    return (
        <div className="mechanic-dashboard fade-in">
            <div className="dashboard-header">
                <h1>Mechanic <span>Command Center</span></h1>
            </div>

            <div className="dashboard-grid">
                <div className="main-content">
                    
                    {/* Top: Available Pending Requests */}
                    <div className="dashboard-card pending-section" style={{ marginBottom: '2rem' }}>
                        <h2>
                            <AlertCircle size={24} color="#f59e0b" />
                            Live Pending Requests
                        </h2>
                        {pendingRequests.length === 0 ? (
                            <p className="no-data">Looking for requests... Currently clear.</p>
                        ) : (
                            <div className="request-list">
                                {pendingRequests.map(req => (
                                    <div key={req._id} className="request-item pending-item">
                                        <div className="request-details">
                                            <h3>{renderVehicleIcon(req.vehicleType)} {req.serviceType}</h3>
                                            <p><span style={{color: '#fff', fontWeight: 'bold'}}>{req.userId?.name || 'Customer'}</span></p>
                                            <p><MapPin size={16}/> <strong>Location:</strong> {req.location?.address || 'N/A'}</p>
                                            {req.description && <p><strong>Issue:</strong> {req.description}</p>}
                                            <p><Clock size={16}/> <strong>Time:</strong> {new Date(req.createdAt).toLocaleTimeString()} ({new Date(req.createdAt).toLocaleDateString()})</p>
                                        </div>
                                        <div className="request-actions">
                                            <span className="status-badge pending">Pending Acceptance</span>
                                            <button onClick={() => handleAccept(req._id)} className="btn-accept">
                                                Accept Request
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Middle: Active Jobs */}
                    <div className="dashboard-card active-section" style={{ marginBottom: '2rem' }}>
                        <h2>
                            <Clock size={24} color="#10b981" />
                            Active Jobs
                        </h2>
                        {activeServices.length === 0 ? (
                            <p className="no-data">No active jobs. Accept a pending request above.</p>
                        ) : (
                            <div className="request-list">
                                {activeServices.map(req => (
                                    <div key={req._id} className="request-item active-item">
                                        <div className="request-details">
                                            <h3>{renderVehicleIcon(req.vehicleType)} {req.serviceType}</h3>
                                            <p><span style={{color: '#fff'}}>{req.userId?.name || 'Customer'}</span></p>
                                            <p><MapPin size={16}/> <strong>Location:</strong> {req.location?.address || 'N/A'}</p>
                                            {req.description && <p><strong>Issue:</strong> {req.description}</p>}
                                        </div>
                                        <div className="request-actions">
                                            <span className="status-badge accepted">{req.status}</span>
                                            <button onClick={() => handleComplete(req._id)} className="btn-complete">
                                                Mark Completed
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bottom: Past History */}
                    <div className="dashboard-card history-section">
                        <h2>
                            <CheckCircle size={24} color="#3b82f6" />
                            Work History
                        </h2>
                        {pastServices.length === 0 ? (
                            <p className="no-data">No completed services yet.</p>
                        ) : (
                            <div className="request-list">
                                {pastServices.slice(0, 10).map(req => ( // Limit to 10 for clean UI
                                    <div key={req._id} className="request-item">
                                        <div className="request-details">
                                            <h3>{renderVehicleIcon(req.vehicleType)} {req.serviceType}</h3>
                                            <p>Customer: {req.userId?.name || 'Customer'}</p>
                                            <p><Calendar size={16}/> Completed On: {req.completedAt ? new Date(req.completedAt).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                        <div className="request-actions">
                                            <span className={`status-badge ${req.status.toLowerCase()}`}>{req.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="side-content">
                    {/* Statistics Pie Chart */}
                    <div className="dashboard-card stats-section">
                        <h2>Performance Stats</h2>
                        {chartData.length === 0 ? (
                            <p className="no-data">Complete services to unlock your analytics.</p>
                        ) : (
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1e140a', borderColor: '#d6b588' }} itemStyle={{ color: '#fff' }}/>
                                        <Legend wrapperStyle={{ color: '#c6c0b9' }}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MechanicDashboard;
