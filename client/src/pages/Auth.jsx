import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './Form.css';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: ''
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isLogin ? '/api/users/login' : '/api/users/register';
        const url = `http://localhost:5000${endpoint}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                alert(isLogin ? 'Login successful!' : 'Account created successfully!');
                localStorage.setItem('user', JSON.stringify(data.user || data));
                window.location.href = '/';
            } else {
                alert(data.message || data.error || 'Something went wrong');
            }
        } catch (error) {
            console.error('Auth error:', error);
            alert('Failed to connect to server');
        }
    };

    return (
        <div className="form-container fade-in">
            <div className="form-box">
                <h1>{isLogin ? 'Login' : 'Sign Up'} <span>CarAssist</span></h1>
                <form onSubmit={handleSubmit}>

                    {!isLogin && (
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    {!isLogin && (
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Enter your phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}
                    <button type="submit" className="btn-submit">
                        {isLogin ? 'Login' : 'Create Account'}
                    </button>
                </form>
                <p style={{ marginTop: '1.5rem' }}>
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{ background: 'none', color: 'var(--primary-color)', marginLeft: '0.5rem', fontWeight: 'bold' }}
                    >
                        {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Auth;
