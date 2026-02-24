import { NavLink, Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import './Navbar.css';

const Navbar = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        console.log('Navbar loaded user:', storedUser);
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
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
                        <li><NavLink to="/services">Towing & Recovery</NavLink></li>
                    </ul>
                </li>
                <li><NavLink to="/how-it-works">How It Works</NavLink></li>
                <li><NavLink to="/partner">Become a Partner</NavLink></li>
                {user && user.role === 'admin' && (
                    <li><NavLink to="/admin">Admin</NavLink></li>
                )}
            </ul>
            <div className="nav-actions">
                {user ? (
                    <div className="user-pro-controls">
                        {user.role === 'admin' && (
                            <Link to="/admin" className="btn-dashboard-pro">Dashboard</Link>
                        )}
                        <span className="user-welcome">Hello, <span>{user.name.split(' ')[0]}</span></span>
                        <button onClick={handleLogout} className="btn-logout">Logout</button>
                    </div>
                ) : (
                    <Link to="/login" className="btn-login">Login / Sign Up</Link>
                )}
                <Link to="/book-assistance" className="btn-emergency">Book Assistance</Link>
            </div>

        </nav>


    );
};

export default Navbar;
