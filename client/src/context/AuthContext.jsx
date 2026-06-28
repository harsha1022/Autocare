import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Helper: decode JWT payload without verifying signature (client-side expiry check)
const isTokenExpired = (token) => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // exp is in seconds, Date.now() is in ms
        return payload.exp * 1000 < Date.now();
    } catch {
        return true; // malformed token → treat as expired
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        if (storedUser && storedToken) {
            if (isTokenExpired(storedToken)) {
                // Stale / expired token — clear it so the user is prompted to log in
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            } else {
                setUser(JSON.parse(storedUser));
                setToken(storedToken);
            }
        }
    }, []);

    const login = (userData, userToken) => {
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userToken);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
