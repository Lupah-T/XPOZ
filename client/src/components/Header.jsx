import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const Header = () => {
    const { user } = useAuth();
    const [showAnnouncements, setShowAnnouncements] = React.useState(false);
    const [AnnouncementModal, setAnnouncementModal] = React.useState(null);
    const [hasNewAnnouncements, setHasNewAnnouncements] = React.useState(false);

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
                    // We update the count ONLY when user opens the modal ideally, 
                    // but for simplicity, we treat "unseen count" as data.length > stored.
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
        // Update local storage to current count (we need to fetch or know count)
        // Re-fetching or just clearing badge. 
        // Better: Fetch again inside modal, but here we just clear badge.
        // We really need the count to save it. Let's assume user sees all.
        // Actually, let's fetch count again to save it.
        fetch(`${API_URL}/api/announcements`)
            .then(res => res.json())
            .then(data => {
                localStorage.setItem('announcementCount', data.length.toString());
            });
    };

    // Lazy load modal to avoid circular dependency or simple performance
    React.useEffect(() => {
        if (showAnnouncements && !AnnouncementModal) {
            import('./AnnouncementModal').then(module => {
                setAnnouncementModal(() => module.default);
            });
        }
    }, [showAnnouncements, AnnouncementModal]);

    return (
        <>
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
                        <Link to="/users" className="nav-icon" title="Users">👥</Link>
                        <Link to="/messages" className="nav-icon" title="Messages">💬</Link>
                        <Link to="/create" className="nav-icon" title="New Post">➕</Link>
                        {user && user.role === 'admin' && (
                            <Link to="/admin/dashboard" className="nav-icon" title="Admin Dashboard">🛡️</Link>
                        )}
                        <button
                            onClick={handleOpenAnnouncements}
                            className="nav-icon"
                            title="Announcements"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', position: 'relative' }}
                        >
                            📢
                            {hasNewAnnouncements && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-2px',
                                    right: '-2px',
                                    width: '10px',
                                    height: '10px',
                                    background: '#ef4444',
                                    borderRadius: '50%',
                                    border: '2px solid white'
                                }}></span>
                            )}
                        </button>
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
            {
                showAnnouncements && AnnouncementModal && (
                    <AnnouncementModal onClose={() => setShowAnnouncements(false)} />
                )
            }
        </>
    );
};

export default Header;
