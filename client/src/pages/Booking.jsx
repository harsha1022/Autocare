import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Form.css';

const Booking = () => {
    const location = useLocation();

    const [formData, setFormData] = useState({
        vehicleType: 'Car',
        serviceType: '',
        location: '',
        description: ''
    });

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

    const handleSubmit = (e) => {
        e.preventDefault();
        alert('Booking request sent! A mechanic will be assigned shortly.');
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
                    <button type="submit" className="btn-submit">Request Assistance</button>
                </form>
            </div>
        </div>
    );
};

export default Booking;
