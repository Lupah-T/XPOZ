import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BottomNav = () => {
    const location = useLocation();
    const { user } = useAuth();

    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    const navItems = [
        { path: '/', icon: '🏠', label: 'Home' },
        { path: '/users', icon: '👥', label: 'Users' },
        { path: '/messages', icon: '💬', label: 'Messages' },
        { path: `/profile/${user?.id}`, icon: '👤', label: 'Profile' }
    ];

    return (
        <nav style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60px',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid var(--glass-border)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            zIndex: 1000,
            padding: '0 0.5rem'
        }}>
            {navItems.map((item) => (
                <Link
                    key={item.path}
                    to={item.path}
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none',
                        color: isActive(item.path) ? '#a855f7' : '#94a3b8',
                        transition: 'all 0.2s',
                        padding: '0.5rem',
                        position: 'relative'
                    }}
                >
                    <span style={{
                        fontSize: '1.5rem',
                        marginBottom: '0.15rem',
                        filter: isActive(item.path) ? 'none' : 'grayscale(0.3) opacity(0.7)'
                    }}>
                        {item.icon}
                    </span>
                    <span style={{
                        fontSize: '0.65rem',
                        fontWeight: isActive(item.path) ? '600' : '400'
                    }}>
                        {item.label}
                    </span>
                    {isActive(item.path) && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '40px',
                            height: '3px',
                            background: '#a855f7',
                            borderRadius: '0 0 3px 3px'
                        }} />
                    )}
                </Link>
            ))}
        </nav>
    );
};

export default BottomNav;
