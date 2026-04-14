import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import toast from 'react-hot-toast';
import { Car, MapPin, CheckCircle, Clock } from 'lucide-react';
import './UserDashboard.css';

const containerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '12px'
};

const UserDashboard = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    
    const [myRequests, setMyRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTracking, setActiveTracking] = useState(null); // Which request we are currently viewing on the map
    const [mechanicCoords, setMechanicCoords] = useState(null); // Real-time updated mechanic coordinates

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchData();
    }, [user, navigate]);

    // Live Socket Connection Setup
    useEffect(() => {
        if (!activeTracking || !token) return;

        const socket = io('http://localhost:5000');
        
        // Listen dynamically to the channel for this specific request
        const channelName = `tracking_${activeTracking._id}`;
        console.log(`Listening for mechanic tracking on: ${channelName}`);
        
        socket.on(channelName, (data) => {
            // Data contains { lat, lng } from the mechanic side
            setMechanicCoords({ lat: data.lat, lng: data.lng });
        });

        // Also listen if it gets marked completed remotely
        socket.on('serviceCompleted', (reqId) => {
            if (reqId === activeTracking._id) {
                toast.success('Your service has been marked complete by the mechanic!');
                setActiveTracking(null);
                fetchData();
            }
        });

        return () => socket.disconnect();
    }, [activeTracking, token]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const userId = user._id || user.id;
            const res = await fetch(`http://localhost:5000/api/services/user/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMyRequests(data);
                
                // Automatically select an active one to track
                const active = data.find(r => r.status === 'Accepted' || r.status === 'InProgress');
                if (active) setActiveTracking(active);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load your requests');
        } finally {
            setIsLoading(false);
        }
    };

    const activeServices = myRequests.filter(req => req.status === 'Pending' || req.status === 'Accepted' || req.status === 'InProgress');
    const pastServices = myRequests.filter(req => req.status === 'Completed' || req.status === 'Cancelled');

    if (isLoading) return <div className="loading">Loading Your Dashboard...</div>;

    const renderMap = () => {
        if (!isLoaded || !activeTracking) return <p>Map Loading...</p>;

        const userLoc = {
            lat: activeTracking.location?.coordinates[1] || 0,
            lng: activeTracking.location?.coordinates[0] || 0
        };

        const mapCenter = mechanicCoords || userLoc;

        // Custom dark map styling matching masterpiece theme
        const mapOptions = {
            streetViewControl: false,
            mapTypeControl: false,
            styles: [
                { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
                { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
                { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
            ]
        };

        return (
            <div className="map-container fade-in">
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={mapCenter}
                    zoom={14}
                    options={mapOptions}
                >
                    {/* User's Broken Down Location Flag */}
                    <Marker 
                        position={userLoc} 
                        label="YOU"
                    />

                    {/* Mechanic's Live Location (if active) */}
                    {mechanicCoords && (
                        <Marker 
                            position={mechanicCoords}
                            icon={{
                                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" 
                            }}
                        />
                    )}
                </GoogleMap>
                <div className="tracking-status-bar">
                    {mechanicCoords ? (
                        <span className="live-badge">🟢 Mechanic is currently on the way (Tracking Live)</span>
                    ) : (
                        <span className="waiting-badge">Waiting for mechanic's location signal...</span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="user-dashboard fade-in">
            <div className="dashboard-header">
                <h1>My <span>Requests</span></h1>
            </div>

            <div className="dashboard-grid">
                <div className="main-content">
                    {activeTracking && (
                        <div className="dashboard-card live-tracking-card" style={{ marginBottom: '2rem' }}>
                            <h2>Live Tracking: {activeTracking.serviceType}</h2>
                            <p style={{ color: '#a39585', marginBottom: '1rem' }}>
                                Mechanic: {activeTracking.mechanicId?.shopName || 'Assigning...'}
                            </p>
                            {renderMap()}
                        </div>
                    )}

                    <div className="dashboard-card" style={{ marginBottom: '2rem' }}>
                        <h2>
                            <Clock size={24} color="#f59e0b" />
                            Active Service Requests
                        </h2>
                        {activeServices.length === 0 ? (
                            <p className="no-data">You have no active requests.</p>
                        ) : (
                            <div className="request-list">
                                {activeServices.map(req => (
                                    <div key={req._id} className="request-item active-item" onClick={() => setActiveTracking(req)} style={{cursor: 'pointer'}}>
                                        <div className="request-details">
                                            <h3><Car size={20} color="#D6B588"/> {req.serviceType}</h3>
                                            <p><MapPin size={16}/> {req.location?.address || 'N/A'}</p>
                                        </div>
                                        <div className="request-actions">
                                            <span className={`status-badge ${req.status.toLowerCase()}`}>{req.status}</span>
                                            {req.status === 'Pending' && <span style={{fontSize:'0.8rem', color:'#f59e0b'}}>Searching for mechanic...</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="dashboard-card history-section">
                        <h2>
                            <CheckCircle size={24} color="#3b82f6" />
                            Service History
                        </h2>
                        {pastServices.length === 0 ? (
                            <p className="no-data">No completed services yet.</p>
                        ) : (
                            <div className="request-list">
                                {pastServices.map(req => (
                                    <div key={req._id} className="request-item">
                                        <div className="request-details">
                                            <h3>{req.serviceType}</h3>
                                            <p>Mechanic: {req.mechanicId?.shopName || 'Unknown'}</p>
                                            <p>Completed: {new Date(req.completedAt || req.updatedAt).toLocaleDateString()}</p>
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
            </div>
        </div>
    );
};

export default UserDashboard;
