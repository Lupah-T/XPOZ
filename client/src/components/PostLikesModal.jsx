import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getMediaUrl } from '../utils/media';

const PostLikesModal = ({ likes, onClose }) => {
    const navigate = useNavigate();

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
        }} onClick={onClose}>
            <div style={{
                background: '#1e293b',
                width: '100%',
                maxWidth: '400px',
                borderRadius: '12px',
                maxHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#0f172a'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'white' }}>Likes</h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
                    >
                        &times;
                    </button>
                </div>

                {/* Content */}
                <div style={{ overflowY: 'auto', padding: '0' }}>
                    {likes.length === 0 ? (
                        <div style={{ padding: '1.5rem', color: '#94a3b8', textAlign: 'center' }}>No likes yet.</div>
                    ) : (
                        likes.map(user => (
                            <div
                                key={user._id}
                                onClick={() => {
                                    navigate(`/profile/${user._id}`);
                                    onClose();
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem 1.5rem',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    background: '#334155'
                                }}>
                                    {user.avatarUrl ? (
                                        <img
                                            src={getMediaUrl(user.avatarUrl)}
                                            alt={user.pseudoName}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👤</div>
                                    )}
                                </div>
                                <span style={{ fontWeight: '500', color: 'white' }}>{user.pseudoName}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostLikesModal;
