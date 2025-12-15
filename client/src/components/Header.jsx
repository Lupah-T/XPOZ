import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
    const { user } = useAuth();
    return (
        <header className="navbar container">
            <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '-0.05em', background: 'linear-gradient(45deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                X-POZ
            </Link>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <Link to="/" className="nav-icon" title="Home">🏠</Link>
                <Link to="/groups" className="nav-icon" title="Groups">👥</Link>
                <Link to="/create" className="nav-icon" title="New Post">➕</Link>
                {/* Admin Link - Only visible to Admins */}
                {user && user.role === 'admin' && (
                    <Link to="/admin/dashboard" className="nav-icon" title="Admin Dashboard">🛡️</Link>
                )}
                {/* Profile Icon - using a generic avatar or user's if available */}
                <Link to={user ? `/profile/${user.id}` : '/auth'} className="nav-icon" title="Profile">
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#cbd5e1', overflow: 'hidden' }}>
                        {user?.avatarUrl && <img src={`http://localhost:5000/${user.avatarUrl}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                </Link>
            </div>
        </header>
    );
};

export default Header;
