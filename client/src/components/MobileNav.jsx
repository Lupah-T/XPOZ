import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getMediaUrl } from '../utils/media';

const MobileNav = () => {
    const { user } = useAuth();
    const { totalUnreadCount } = useSocket();
    const location = useLocation();

    if (!user) return null;

    const navItemStyle = (path) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        textDecoration: 'none',
        color: location.pathname === path ? 'var(--primary)' : 'var(--text-muted)',
        flex: 1,
        position: 'relative',
        transition: 'all 0.3s ease'
    });

    const iconStyle = {
        fontSize: '1.4rem'
    };

    const labelStyle = {
        fontSize: '0.65rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    };

    return (
        <nav style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '65px',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid var(--glass-stroke)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 1000, // Higher than chat input but lower than modals
            paddingBottom: 'env(safe-area-inset-bottom)',
            boxShadow: '0 -4px 15px rgba(0,0,0,0.2)'
        }} className="mobile-only-nav">
            <Link to="/" style={navItemStyle('/')}>
                <span style={iconStyle}>🏠</span>
                <span style={labelStyle}>Home</span>
                {location.pathname === '/' && <div style={activeDotStyle} />}
            </Link>

            <Link to="/users" style={navItemStyle('/users')}>
                <span style={iconStyle}>👥</span>
                <span style={labelStyle}>Users</span>
                {location.pathname === '/users' && <div style={activeDotStyle} />}
            </Link>

            <Link to="/create" style={navItemStyle('/create')}>
                <div style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '15px',
                    background: 'linear-gradient(135deg, var(--primary), #ec4899)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '-25px',
                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                    border: '3px solid var(--bg-main)'
                }}>
                    <span style={{ ...iconStyle, color: 'white' }}>➕</span>
                </div>
                <span style={{ ...labelStyle, marginTop: '2px' }}>Post</span>
            </Link>

            <Link to="/messages" style={navItemStyle('/messages')}>
                <span style={iconStyle}>💬</span>
                <span style={labelStyle}>Chat</span>
                {totalUnreadCount > 0 && (
                    <span style={badgeStyle}>
                        {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </span>
                )}
                {location.pathname === '/messages' && <div style={activeDotStyle} />}
            </Link>

            <Link to={`/profile/${user.id}`} style={navItemStyle(`/profile/${user.id}`)}>
                {user.avatarUrl ? (
                    <img
                        src={getMediaUrl(user.avatarUrl)}
                        alt="Profile"
                        style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            border: location.pathname.includes('/profile') ? '2px solid var(--primary)' : '1px solid var(--glass-stroke)',
                            objectFit: 'cover'
                        }}
                    />
                ) : (
                    <span style={iconStyle}>👤</span>
                )}
                <span style={labelStyle}>Profile</span>
                {location.pathname.includes('/profile') && <div style={activeDotStyle} />}
            </Link>

            <style>{`
                @media (min-width: 768px) {
                    .mobile-only-nav {
                        display: none !important;
                    }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
            `}</style>
        </nav>
    );
};

const activeDotStyle = {
    position: 'absolute',
    bottom: '-8px',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: 'var(--primary)',
    boxShadow: '0 0 10px var(--primary)'
};

const badgeStyle = {
    position: 'absolute',
    top: '2px',
    right: '25%',
    minWidth: '16px',
    height: '16px',
    background: '#ef4444',
    color: 'white',
    fontSize: '0.65rem',
    fontWeight: 'bold',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid var(--glass-bg)',
    padding: '0 4px'
};

export default MobileNav;
