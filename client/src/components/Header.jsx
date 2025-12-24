import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { API_URL } from '../config';
import { getMediaUrl } from '../utils/media';


const Header = () => {
    const { user, logout } = useAuth();
    const { totalUnreadCount } = useSocket();
    const navigate = useNavigate();
    const [showAnnouncements, setShowAnnouncements] = React.useState(false);
    const [AnnouncementModal, setAnnouncementModal] = React.useState(null);
    const [hasNewAnnouncements, setHasNewAnnouncements] = React.useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'default');
    const menuRef = useRef(null);

    useEffect(() => {
        // Appy theme
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark-theme');
            root.classList.remove('light-theme');
        } else if (theme === 'light') {
            root.classList.add('light-theme');
            root.classList.remove('dark-theme');
        } else {
            root.classList.remove('dark-theme');
            root.classList.remove('light-theme');
            // Check system preference
            if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                // Technically the default is dark based on index.css, so we only add light if system is light
                // But simpler: just let default be default (dark)
            }
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    React.useEffect(() => {
        // Check for new announcements
        const checkAnnouncements = async () => {
            try {
                const res = await fetch(`${API_URL}/api/announcements`);
                const data = await res.json();
                if (data && data.length > 0) {
                    const lastCount = parseInt(localStorage.getItem('announcementCount') || '0');
                    if (data.length > lastCount) {
                        setHasNewAnnouncements(true);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        checkAnnouncements();
    }, []);

    const handleOpenAnnouncements = () => {
        setShowAnnouncements(true);
        setHasNewAnnouncements(false);
        fetch(`${API_URL}/api/announcements`)
            .then(res => res.json())
            .then(data => {
                localStorage.setItem('announcementCount', data.length.toString());
            });
    };

    // Lazy load modal
    React.useEffect(() => {
        if (showAnnouncements && !AnnouncementModal) {
            import('./AnnouncementModal').then(module => {
                setAnnouncementModal(() => module.default);
            });
        }
    }, [showAnnouncements, AnnouncementModal]);

    const navIconStyle = {
        fontSize: '1.4rem',
        textDecoration: 'none',
        color: 'var(--text-main)',
        cursor: 'pointer',
        padding: '0.5rem',
        borderRadius: '50%',
        transition: 'background 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none'
    };

    return (
        <>
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderBottom: '1px solid var(--glass-stroke)',
                padding: '0.6rem 1rem'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    <Link to="/" style={{
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        letterSpacing: '-0.05em',
                        background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textDecoration: 'none'
                    }}>
                        X-POZ
                    </Link>

                    {/* Horizontal Navigation Icons */}
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center'
                    }}>
                        <Link to="/" style={navIconStyle} title="Home">🏠</Link>
                        <Link to="/users" style={navIconStyle} title="Users">👥</Link>
                        <Link to="/messages" style={{ ...navIconStyle, position: 'relative' }} title="Messages">
                            💬
                            {totalUnreadCount > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-4px',
                                    minWidth: '18px',
                                    height: '18px',
                                    background: '#ef4444',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid var(--glass-bg)',
                                    padding: '0 4px'
                                }}>
                                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                                </span>
                            )}
                        </Link>
                        <Link to="/create" style={navIconStyle} title="New Post">➕</Link>
                        <button
                            onClick={handleOpenAnnouncements}
                            style={{ ...navIconStyle, position: 'relative' }}
                            title="Announcements"
                        >
                            📢
                            {hasNewAnnouncements && (
                                <span style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    width: '8px',
                                    height: '8px',
                                    background: '#ef4444',
                                    borderRadius: '50%',
                                    border: '1.5px solid var(--glass-bg)'
                                }}></span>
                            )}
                        </button>

                        {/* 3-dot Menu */}
                        <div style={{ position: 'relative' }} ref={menuRef}>
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                style={navIconStyle}
                                title="Menu"
                            >
                                ⋯
                            </button>

                            {showMenu && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '0.5rem',
                                    background: 'var(--surface)',
                                    border: '1px solid var(--glass-stroke)',
                                    borderRadius: '12px',
                                    minWidth: '180px',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                                    zIndex: 1001,
                                    padding: '0.5rem 0'
                                }}>
                                    {user && (
                                        <>
                                            <div style={{
                                                padding: '0.75rem 1rem',
                                                borderBottom: '1px solid var(--glass-stroke)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                marginBottom: '0.25rem'
                                            }}>
                                                <img
                                                    src={getMediaUrl(user.avatarUrl) || 'https://via.placeholder.com/32'}
                                                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                                                    alt=""
                                                />
                                                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)' }}>
                                                    {user.pseudoName}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { navigate(`/profile/${user.id}`); setShowMenu(false); }}
                                                className="menu-item"
                                            >
                                                👤 View Profile
                                            </button>
                                            {user.role === 'admin' && (
                                                <button
                                                    onClick={() => { navigate('/admin/dashboard'); setShowMenu(false); }}
                                                    className="menu-item"
                                                >
                                                    🛡️ Admin Portal
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {/* Theme Selector */}
                                    <div style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>THEME</div>
                                    <div style={{ display: 'flex', padding: '0.25rem 0.5rem', gap: '0.25rem' }}>
                                        {['Default', 'Light', 'Dark'].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setTheme(t.toLowerCase())}
                                                style={{
                                                    flex: 1,
                                                    fontSize: '0.75rem',
                                                    padding: '0.4rem',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    background: theme === t.toLowerCase() ? 'var(--primary)' : 'var(--surface-hover)',
                                                    color: theme === t.toLowerCase() ? 'white' : 'var(--text-main)',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>

                                    <div style={{ borderTop: '1px solid var(--glass-stroke)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                                        {user ? (
                                            <button
                                                onClick={() => { logout(); setShowMenu(false); }}
                                                className="menu-item"
                                                style={{ color: '#ef4444' }}
                                            >
                                                🚪 Logout
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => { navigate('/auth'); setShowMenu(false); }}
                                                className="menu-item"
                                            >
                                                🔑 Login / Register
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <style>{`
                .menu-item {
                    display: block;
                    width: 100%;
                    text-align: left;
                    padding: 0.75rem 1rem;
                    background: none;
                    border: none;
                    color: var(--text-main);
                    cursor: pointer;
                    font-size: 0.95rem;
                    font-family: inherit;
                    transition: background 0.2s;
                }
                .menu-item:hover {
                    background: var(--surface-hover);
                }
                .nav-icon:hover {
                    background: var(--surface-hover) !important;
                }
            `}</style>

            {showAnnouncements && AnnouncementModal && (
                <AnnouncementModal onClose={() => setShowAnnouncements(false)} />
            )}
        </>
    );
};

export default Header;
