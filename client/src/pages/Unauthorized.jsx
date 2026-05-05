import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft, Home } from 'lucide-react';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f0b07 0%, #1e140a 50%, #0f0b07 100%)',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                textAlign: 'center',
                padding: '3rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(214,181,136,0.15)',
                borderRadius: '24px',
                backdropFilter: 'blur(20px)',
                maxWidth: '480px',
                width: '90%'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05))',
                    border: '2px solid rgba(239,68,68,0.4)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem'
                }}>
                    <ShieldOff size={36} color="#ef4444" />
                </div>

                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: '#fff',
                    marginBottom: '0.5rem'
                }}>
                    Access <span style={{ color: '#D6B588' }}>Denied</span>
                </h1>
                <p style={{
                    color: '#a39585',
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    marginBottom: '2rem'
                }}>
                    You don't have permission to view this page. 
                    This area is restricted to authorized roles only.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            background: 'rgba(214,181,136,0.1)',
                            border: '1px solid rgba(214,181,136,0.3)',
                            borderRadius: '12px',
                            color: '#D6B588',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(214,181,136,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(214,181,136,0.1)'}
                    >
                        <ArrowLeft size={18} /> Go Back
                    </button>
                    <Link
                        to="/"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #D6B588, #b8935a)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#1e140a',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            textDecoration: 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Home size={18} /> Return Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
