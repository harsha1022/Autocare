import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import './Form.css';

const Partner = () => {
    const [formData, setFormData] = useState({
        shopName: '',
        specialization: 'Car',
        location: ''
    });
    const [mechanicStatus, setMechanicStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            setCheckingStatus(false);
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/mechanics/status/${user._id}`);
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

        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            alert('Please login first to apply as a partner.');
            navigate('/login');
            return;
        }

        const userId = user._id || user.id;
        if (!userId) {
            alert('User ID not found. Please logout and login again.');
            return;
        }

        setLoading(true);
        console.log('Sending registration to: http://localhost:5000/api/mechanics/register');
        try {
            const response = await fetch('http://localhost:5000/api/mechanics/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    ...formData,
                    location: [77.209021, 28.613939]
                }),
            });

            console.log('Server response status:', response.status);

            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            }

            if (response.ok) {
                alert('Application submitted successfully!');
                checkStatus();
            } else {
                const errorMsg = data?.message || data?.error || `Server error (${response.status})`;
                alert(errorMsg);
            }
        } catch (error) {
            console.error('Partner application error:', error);
            alert(`Network or Server error: ${error.message}. Please check if the backend is running.`);
        } finally {
            setLoading(false);
        }
    };

    if (checkingStatus) return <div className="form-container">Loading...</div>;

    if (mechanicStatus) {
        return (
            <div className="form-container fade-in">
                <div className="form-box status-view" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="status-icon" style={{ marginBottom: '1.5rem' }}>
                        {mechanicStatus.isVerified ? (
                            <ShieldCheck size={80} color="#10b981" />
                        ) : (
                            <Clock size={80} color="#f59e0b" />
                        )}
                    </div>
                    <h1>Application <span>{mechanicStatus.isVerified ? 'Verified' : 'Pending'}</span></h1>
                    <p style={{ fontSize: '1.1rem', color: '#6b7280', margin: '1rem 0 2rem' }}>
                        {mechanicStatus.isVerified
                            ? "Congratulations! Your partner account is verified. You can now accept service requests."
                            : "Your application is currently under review by our admin team. This usually takes 24-48 hours. We'll notify you once verified."}
                    </p>

                    <div className="status-details" style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '12px', textAlign: 'left', marginBottom: '2rem' }}>
                        <div style={{ marginBottom: '0.5rem' }}><strong>Shop Name:</strong> {mechanicStatus.shopName}</div>
                        <div style={{ marginBottom: '0.5rem' }}><strong>Specialization:</strong> {mechanicStatus.specialization.join(', ')}</div>
                        <div><strong>Submission Date:</strong> {new Date(mechanicStatus._id.getTimestamp ? mechanicStatus._id.getTimestamp() : Date.now()).toLocaleDateString()}</div>
                    </div>

                    <button className="btn-submit" onClick={() => navigate('/')}>Back to Home</button>
                    {!mechanicStatus.isVerified && (
                        <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#9ca3af' }}>
                            Need help? Contact support@carassist.com
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="form-container fade-in">
            <div className="form-box">
                <h1>Become a <span>Partner</span></h1>
                <p>Join India's fastest-growing roadside assistance network.</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Business / Shop Name</label>
                        <input
                            type="text"
                            name="shopName"
                            placeholder="Enter shop name"
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
                            <option value="Both">Both</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Location (City / Area)</label>
                        <input
                            type="text"
                            name="location"
                            placeholder="Enter city or area"
                            value={formData.location}
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
