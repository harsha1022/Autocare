import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Form.css';

const Booking = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, token } = useAuth();

    const [formData, setFormData] = useState({
        vehicleType: 'Car',
        serviceType: '',
        location: '',
        description: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (location.state) {
            const { vehicleType, serviceType } = location.state;
            setFormData(prev => ({
                ...prev,
                vehicleType: vehicleType || prev.vehicleType,
                serviceType: serviceType || prev.serviceType
            }));
        }
    }, [location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user || !token) {
            toast.error('Please login to book assistance');
            navigate('/login');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/services/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    vehicleType: formData.vehicleType,
                    serviceType: formData.serviceType,
                    description: formData.description,
                    location: {
                        address: formData.location
                    }
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Booking request sent! A mechanic will be assigned shortly.');
                setFormData({ vehicleType: 'Car', serviceType: '', location: '', description: '' });
                navigate('/');
            } else {
                toast.error(data.message || data.error || 'Failed to submit booking');
            }
        } catch (error) {
            console.error('Booking error:', error);
            toast.error('Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="form-container fade-in">
            <div className="form-box">
                <h1>Book <span>Assistance</span></h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Vehicle Type</label>
                        <select
                            value={formData.vehicleType}
                            onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                        >
                            <option>Car</option>
                            <option>Bike</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Service Needed</label>
                        <input
                            type="text"
                            placeholder="e.g., Battery Jump-start, Tyre Puncture"
                            required
                            onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Location / Landmark</label>
                        <input
                            type="text"
                            placeholder="Your current location"
                            required
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Description (Optional)</label>
                        <textarea
                            placeholder="Tell us more about the issue..."
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>
                    <button type="submit" className="btn-submit" disabled={isLoading}>
                        {isLoading ? 'Submitting...' : 'Request Assistance'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Booking;
