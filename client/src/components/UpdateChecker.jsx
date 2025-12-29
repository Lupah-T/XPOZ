import React, { useEffect, useState } from 'react';
import { API_URL } from '../config';

// Hardcoded for now, but in a real app would be imported from package.json or Capacitor plugin
const CURRENT_VERSION = '1.3.0';

const UpdateChecker = () => {
    const [updateAvailable, setUpdateAvailable] = useState(null);

    useEffect(() => {
        const checkVersion = async () => {
            try {
                const res = await fetch(`${API_URL}/api/announcements`);
                const announcements = await res.json();

                // Find the latest announcement with an APK and version
                const latestUpdate = announcements.find(a =>
                    a.attachment &&
                    a.attachment.type === 'apk' &&
                    a.version &&
                    isNewerVersion(a.version, CURRENT_VERSION)
                );

                if (latestUpdate) {
                    setUpdateAvailable(latestUpdate);
                }
            } catch (err) {
                console.error("Update check failed", err);
            }
        };

        checkVersion();
    }, []);

    const isNewerVersion = (newVer, currentVer) => {
        // Simple semantic version comparison
        const v1 = newVer.split('.').map(Number);
        const v2 = currentVer.split('.').map(Number);

        for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
            const num1 = v1[i] || 0;
            const num2 = v2[i] || 0;
            if (num1 > num2) return true;
            if (num1 < num2) return false;
        }
        return false;
    };

    if (!updateAvailable) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <div style={{
                background: '#1e293b',
                padding: '2rem',
                borderRadius: '16px',
                maxWidth: '400px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'white' }}>Update Available!</h2>
                <p style={{ color: '#cbd5e1', marginBottom: '1.5rem' }}>
                    A new version of X-POZ is ready.<br />
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Version {updateAvailable.version} (Current: {CURRENT_VERSION})</span>
                </p>

                <p style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', color: '#e2e8f0', marginBottom: '1.5rem', textAlign: 'left', fontStyle: 'italic' }}>
                    "{updateAvailable.title}"
                </p>

                <a
                    href={updateAvailable.attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'block',
                        width: '100%',
                        padding: '1rem',
                        background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                        color: 'white',
                        textDecoration: 'none',
                        fontWeight: 'bold',
                        borderRadius: '8px',
                        fontSize: '1.1rem',
                        marginBottom: '1rem'
                    }}
                >
                    Install Update Now
                </a>

                <button
                    onClick={() => setUpdateAvailable(null)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    Remind me later
                </button>
            </div>
        </div>
    );
};

export default UpdateChecker;
