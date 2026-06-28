import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Navbar = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeCount, setActiveCount] = useState(0);

    // Fetch active request count badge for user role
    useEffect(() => {
        if (!user || user.role !== 'user' || !token) { setActiveCount(0); return; }
        const uid = user._id || user.id;
        fetch(`${API}/api/services/user/${uid}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                const active = (data || []).filter(r => ['Pending', 'Accepted', 'InProgress'].includes(r.status));
                setActiveCount(active.length);
            })
            .catch(() => { });
    }, [user, token, location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <Link to="/">Car<span>Assist</span></Link>
            </div>

            <ul className="nav-links">
                <li><NavLink to="/" end>Home</NavLink></li>
                <li className="dropdown">
                    <NavLink to="/services">Services</NavLink>
                    <ul className="dropdown-menu">
                        <li><NavLink to="/services">Car Assistance</NavLink></li>
                        <li><NavLink to="/services">Bike Assistance</NavLink></li>
                        <li><NavLink to="/services">Emergency Services</NavLink></li>
                        <li><NavLink to="/services">Towing &amp; Recovery</NavLink></li>
                    </ul>
                </li>
                <li><NavLink to="/how-it-works">How It Works</NavLink></li>
                {/* Hide partner link for mechanics/admins */}
                {(!user || user.role === 'user') && (
                    <li><NavLink to="/partner">Become a Partner</NavLink></li>
                )}
                {/* Admin quick-link in nav */}
                {user && user.role === 'admin' && (
                    <li><NavLink to="/admin">Admin Panel</NavLink></li>
                )}
            </ul>

            <div className="nav-actions">
                {user ? (
                    <div className="user-pro-controls">
                        {/* Mechanic → Dashboard button */}
                        {user.role === 'mechanic' && (
                            <Link to="/mechanic-dashboard" className="btn-dashboard-pro">⚙️ My Dashboard</Link>
                        )}
                        {/* Admin → Dashboard button */}
                        {user.role === 'admin' && (
                            <Link to="/admin" className="btn-dashboard-pro">🛡️ Admin Panel</Link>
                        )}
                        {/* User → "My Requests" with badge count (links to / which is their dashboard) */}
                        {user.role === 'user' && (
                            <Link to="/" className="btn-my-requests">
                                My Requests
                                {activeCount > 0 && (
                                    <span className="nav-req-badge">{activeCount}</span>
                                )}
                            </Link>
                        )}
                        <span className="user-welcome">Hello, <span>{user.name.split(' ')[0]}</span></span>
                        <button onClick={handleLogout} className="btn-logout">Logout</button>
                    </div>
                ) : (
                    <Link to="/login" className="btn-login">Login / Sign Up</Link>
                )}
                {/* Show Book Assistance only for guests and regular users */}
                {(!user || user.role === 'user') && (
                    <Link to="/book-assistance" className="btn-emergency">Book Assistance</Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
