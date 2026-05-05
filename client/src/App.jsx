import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Services from './pages/Services';
import Booking from './pages/Booking';
import Partner from './pages/Partner';
import Auth from './pages/Auth';
import HowItWorks from './pages/HowItWorks';
import AdminDashboard from './pages/AdminDashboard';
import MechanicDashboard from './pages/MechanicDashboard';
import Unauthorized from './pages/Unauthorized';

import './index.css';

// Navbar is hidden on full-screen management dashboards
const HIDE_NAVBAR_PATHS = ['/admin', '/mechanic-dashboard', '/unauthorized'];

const AppContent = () => {
    const location = useLocation();
    const hideNavbar = HIDE_NAVBAR_PATHS.some(p => location.pathname.startsWith(p));

    return (
        <div className="App">
            {!hideNavbar && <Navbar />}
            <Routes>
                {/* Public + smart home (also serves as user dashboard when logged in) */}
                <Route path="/" element={<Home />} />
                <Route path="/services" element={<Services />} />
                <Route path="/book-assistance" element={<Booking />} />
                <Route path="/partner" element={<Partner />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* /user-dashboard → redirect to / (Home IS the user dashboard now) */}
                <Route path="/user-dashboard" element={<Navigate to="/" replace />} />

                {/* Protected: Mechanic Dashboard */}
                <Route
                    path="/mechanic-dashboard"
                    element={
                        <ProtectedRoute roles={['mechanic']}>
                            <MechanicDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Protected: Admin Dashboard */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute roles={['admin']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
            </Routes>
            <Toaster position="top-right" toastOptions={{
                style: { background: '#1e140a', color: '#fff', border: '1px solid rgba(214,181,136,0.3)' }
            }} />
        </div>
    );
};

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
