import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — wraps a route that requires authentication and optionally a specific role.
 * 
 * @param {React.ReactNode} children — the component to render if allowed
 * @param {string[]} roles — if provided, user must have one of these roles
 */
const ProtectedRoute = ({ children, roles = [] }) => {
    const { user } = useAuth();
    const location = useLocation();

    // Not logged in — redirect to login, preserving the intended destination
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Logged in but wrong role
    if (roles.length > 0 && !roles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default ProtectedRoute;
