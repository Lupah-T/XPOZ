import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const Header = () => {
    const { user } = useAuth();

    return (
        <header style={{
            position: 'sticky',
            top: 0,
            zIndex: 999,
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid var(--glass-border)',
            padding: '0.75rem 1rem'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <Link to="/" style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    letterSpacing: '-0.05em',
                    background: 'linear-gradient(45deg, #a855f7, #ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textDecoration: 'none'
                }}>
                    X-POZ
                </Link>

                {/* Desktop Navigation - Hidden on mobile */}
                <div style={{
                    display: 'flex',
                    gap: '1.5rem',
                    alignItems: 'center'
                }} className="desktop-nav">
                    <Link to="/" className="nav-icon" title="Home">🏠</Link>
                    <Link to="/chats" className="nav-icon" title="Chats">💬</Link>
                    <Link to="/groups" className="nav-icon" title="Groups">👥</Link>
                    <Link to="/create" className="nav-icon" title="New Post">➕</Link>
                    {user && user.role === 'admin' && (
                        <Link to="/admin/dashboard" className="nav-icon" title="Admin Dashboard">🛡️</Link>
                    )}
                    <Link to={user ? `/profile/${user.id}` : '/auth'} className="nav-icon" title="Profile">
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#cbd5e1', overflow: 'hidden' }}>
                            {user?.avatarUrl && <img src={`${API_URL}/${user.avatarUrl}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                    </Link>
                </div>

                {/* Mobile - Just show create button */}
                <Link to="/create" className="mobile-only" style={{
                    background: '#a855f7',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                }}>
                    Create
                </Link>
            </div>
        </header>
    );
};

export default Header;
