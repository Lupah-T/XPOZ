import React, { useEffect, useState } from 'react';
import { getMediaUrl } from '../utils/media';

const NotificationToast = ({ notification, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setIsVisible(true));

        // Auto close after 5 seconds
        const timer = setTimeout(() => {
            handleClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        // Wait for exit animation
        setTimeout(onClose, 300);
    };

    return (
        <div style={{
            position: 'relative',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--glass-stroke)',
            borderRadius: '12px',
            padding: '1rem',
            width: '300px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            transform: isVisible ? 'translateX(0)' : 'translateX(120%)',
            opacity: isVisible ? 1 : 0,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            pointerEvents: 'auto'
        }}>
            {notification.data?.followerAvatar ? (
                <img
                    src={getMediaUrl(notification.data.followerAvatar)}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    alt=""
                />
            ) : (
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem'
                }}>
                    🔔
                </div>
            )}

            <div style={{ flex: 1, overflow: 'hidden' }}>
                <h4 style={{
                    margin: '0 0 0.25rem 0',
                    fontSize: '0.95rem',
                    color: 'var(--text-main)',
                    fontWeight: '600'
                }}>
                    New Notification
                </h4>
                <p style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    lineHeight: '1.3'
                }}>
                    {notification.message}
                </p>
            </div>

            <button
                onClick={handleClose}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    fontSize: '1.2rem',
                    lineHeight: 1
                }}
            >
                ×
            </button>
        </div>
    );
};

export default NotificationToast;
