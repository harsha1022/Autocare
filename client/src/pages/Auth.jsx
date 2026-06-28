import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Phone, Eye, EyeOff, Car } from 'lucide-react';
import './Form.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ROLE_REDIRECTS = {
    admin: '/admin',
    mechanic: '/mechanic-dashboard',
    user: '/user-dashboard'
};

const Auth = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const endpoint = isLogin ? '/api/users/login' : '/api/users/register';
        const url = `${API}${endpoint}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
                login(data.user, data.token);

                // Role-based redirect
                const intendedPath = location.state?.from?.pathname;
                const rolePath = ROLE_REDIRECTS[data.user.role] || '/';
                navigate(intendedPath || rolePath, { replace: true });
            } else {
                toast.error(data.message || data.error || 'Something went wrong');
            }
        } catch (error) {
            console.error('Auth error:', error);
            toast.error('Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="form-container fade-in">
            <div className="form-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{
                        width: '44px', height: '44px',
                        background: 'var(--primary)',
                        borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Car size={22} color="#ffffff" />
                    </div>
                    <h1 style={{ margin: 0 }}>
                        {isLogin ? 'Welcome Back' : 'Join'} <span>CarAssist</span>
                    </h1>
                </div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                    {isLogin ? 'Sign in to access your dashboard' : 'Create your account to get started'}
                </p>

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label>Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    style={{ paddingLeft: '40px' }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                style={{ paddingLeft: '40px', paddingRight: '44px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0
                                }}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {!isLogin && (
                        <div className="form-group">
                            <label>Phone Number</label>
                            <div style={{ position: 'relative' }}>
                                <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="Enter your phone number"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    style={{ paddingLeft: '40px' }}
                                />
                            </div>
                        </div>
                    )}

                    <button type="submit" className="btn-submit" disabled={isLoading}>
                        {isLoading ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <span style={{
                                    width: '16px', height: '16px',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    borderTop: '2px solid #ffffff',
                                    borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite',
                                    display: 'inline-block'
                                }} />
                                {isLogin ? 'Signing In...' : 'Creating Account...'}
                            </span>
                        ) : (
                            isLogin ? 'Sign In' : 'Create Account'
                        )}
                    </button>
                </form>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{
                            background: 'none', border: 'none',
                            color: 'var(--primary)', marginLeft: '0.5rem',
                            fontWeight: 700, cursor: 'pointer', fontSize: 'inherit'
                        }}
                    >
                        {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                </p>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default Auth;
