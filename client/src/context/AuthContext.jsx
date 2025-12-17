import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_URL } from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            // Very basic token validation (optional: verify with backend /me endpoint)
            // For MVP, if token exists, we assume logged in, but we should fetch user data
            fetchUser(token);
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchUser = async (authToken) => {
        try {
            console.log('[AuthContext] Fetching user data from:', `${API_URL}/api/auth/me`);
            const res = await fetch(`${API_URL}/api/auth/me`, {
                headers: { 'x-auth-token': authToken }
            });

            console.log('[AuthContext] Response status:', res.status);

            if (res.ok) {
                const userData = await res.json();
                console.log('[AuthContext] User data fetched successfully:', userData.pseudoName);
                // Normalize _id to id to match login/register response
                setUser({ ...userData, id: userData._id });
            } else {
                console.warn('[AuthContext] Failed to fetch user, status:', res.status);
                logout();
            }
        } catch (err) {
            console.error('[AuthContext] Error fetching user:', err);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (pseudoName, password) => {
        console.log('[AuthContext] Attempting login to:', `${API_URL}/api/auth/login`);
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pseudoName, password })
        });

        const data = await res.json();
        if (!res.ok) {
            console.error('[AuthContext] Login failed:', data.message);
            throw new Error(data.message);
        }

        console.log('[AuthContext] Login successful');
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
    };

    const register = async (pseudoName, password, securityData = {}) => {
        const res = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pseudoName, password, ...securityData })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
