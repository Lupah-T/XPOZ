import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const BottomNav = () => {
    const location = useLocation();
    const { user } = useAuth();
    const { totalUnreadCount } = useSocket();

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
                        filter: isActive(item.path) ? 'none' : 'grayscale(0.3) opacity(0.7)',
                        position: 'relative'
                    }}>
                        {item.icon}
                        {/* Unread Badge for Messages */}
                        {item.path === '/messages' && totalUnreadCount > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-8px',
                                background: '#ef4444',
                                color: 'white',
                                fontSize: '0.6rem',
                                fontWeight: 'bold',
                                minWidth: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0 4px',
                                border: '2px solid #0f172a'
                            }}>
                                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                            </div>
                        )}
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
