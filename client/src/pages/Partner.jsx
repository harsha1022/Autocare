import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Clock, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Form.css';

const Partner = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        shopName: '',
        specialization: 'Car',
        locationText: ''
    });
    const [mechanicStatus, setMechanicStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);

    useEffect(() => {
        if (user) {
            checkStatus();
        } else {
            setCheckingStatus(false);
        }
    }, [user]);

    const checkStatus = async () => {
        try {
            const userId = user._id || user.id;
            const response = await fetch(`http://localhost:5000/api/mechanics/status/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setMechanicStatus(data);
            }
        } catch (error) {
            console.error('Error checking status:', error);
        } finally {
            setCheckingStatus(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user || !token) {
            toast.error('Please login first to apply as a partner.');
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/mechanics/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Application submitted! Pending admin review.');
                checkStatus();
            } else {
                toast.error(data.message || data.error || `Error: ${response.status}`);
            }
        } catch (error) {
            toast.error('Network error. Please check if the server is running.');
        } finally {
            setLoading(false);
        }
    };

    // 1. Loading state
    if (checkingStatus) {
        return <div className="form-container" style={{ color: '#9d8d7a' }}>Checking status...</div>;
    }

    // 2. Not logged in
    if (!user) {
        return (
            <div className="form-container fade-in">
                <div className="form-box" style={{ textAlign: 'center' }}>
                    <LogIn size={64} color="#D6B588" style={{ marginBottom: '1.5rem' }} />
                    <h1>Login <span>Required</span></h1>
                    <p style={{ color: '#9d8d7a', margin: '1rem 0 2rem' }}>
                        You must be logged in to apply as a partner.
                    </p>
                    <Link to="/login" className="btn-submit" style={{ display: 'inline-block', textDecoration: 'none' }}>
                        Login / Sign Up
                    </Link>
                </div>
            </div>
        );
    }

    // 3. Application already submitted — show status
    if (mechanicStatus) {
        return (
            <div className="form-container fade-in">
                <div className="form-box" style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        {mechanicStatus.isVerified ? (
                            <ShieldCheck size={80} color="#68d391" />
                        ) : (
                            <Clock size={80} color="#D6B588" />
                        )}
                    </div>
                    <h1>Application <span>{mechanicStatus.isVerified ? 'Approved ✓' : 'Pending Review'}</span></h1>
                    <p style={{ fontSize: '1rem', color: '#9d8d7a', margin: '1rem 0 2rem', lineHeight: 1.7 }}>
                        {mechanicStatus.isVerified
                            ? 'Congratulations! Your partner account is verified. You can now accept service requests from the mechanic dashboard.'
                            : 'Your application is under review by our admin team. This usually takes 24–48 hours.'}
                    </p>

                    <div style={{
                        background: 'rgba(214,181,136,0.06)',
                        border: '1px solid rgba(214,181,136,0.15)',
                        padding: '1.5rem',
                        borderRadius: '14px',
                        textAlign: 'left',
                        marginBottom: '2rem'
                    }}>
                        <div style={{ marginBottom: '0.5rem' }}><strong>Shop Name:</strong> {mechanicStatus.shopName}</div>
                        <div style={{ marginBottom: '0.5rem' }}><strong>Specialization:</strong> {mechanicStatus.specialization.join(', ')}</div>
                        {mechanicStatus.locationText && (
                            <div style={{ marginBottom: '0.5rem' }}><strong>Location:</strong> {mechanicStatus.locationText}</div>
                        )}
                        <div>
                            <strong>Status:</strong>{' '}
                            <span style={{ color: mechanicStatus.isVerified ? '#68d391' : '#D6B588', fontWeight: 700 }}>
                                {mechanicStatus.isVerified ? 'Approved' : 'Awaiting Approval'}
                            </span>
                        </div>
                    </div>

                    <button className="btn-submit" onClick={() => navigate('/')}>Back to Home</button>
                    {!mechanicStatus.isVerified && (
                        <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#7a6a5a' }}>
                            Need help? Contact <strong>support@carassist.com</strong>
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // 4. Application form
    return (
        <div className="form-container fade-in">
            <div className="form-box">
                <h1>Become a <span>Partner</span></h1>
                <p style={{ color: '#9d8d7a', marginBottom: '2rem' }}>
                    Join India's fastest-growing roadside assistance network. Submit your details and our admin team will review your application within 24–48 hours.
                </p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Business / Shop Name</label>
                        <input
                            type="text"
                            name="shopName"
                            placeholder="Enter your shop or business name"
                            value={formData.shopName}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Specialization</label>
                        <select name="specialization" value={formData.specialization} onChange={handleChange}>
                            <option value="Car">Car</option>
                            <option value="Bike">Bike</option>
                            <option value="Both">Both (Car &amp; Bike)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Location (City / Area)</label>
                        <input
                            type="text"
                            name="locationText"
                            placeholder="e.g. MG Road, Vijayawada"
                            value={formData.locationText}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Application'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Partner;
