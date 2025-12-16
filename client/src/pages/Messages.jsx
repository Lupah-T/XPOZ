import React from 'react';
import Header from '../components/Header';

const Messages = () => {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />

            <main style={{ flex: 1, maxWidth: '800px', margin: '0 auto', width: '100%', padding: '0' }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem 1rem',
                    borderBottom: '1px solid var(--glass-border)',
                    background: 'var(--glass-bg)'
                }}>
                    <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Messages</h1>
                </div>

                {/* Coming Soon */}
                <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>💬</div>
                    <h2 style={{ color: '#a855f7', marginBottom: '1rem' }}>Direct Messages Coming Soon!</h2>
                    <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
                        We're building an amazing messaging experience for you. Stay tuned!
                    </p>
                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '12px', maxWidth: '500px', margin: '2rem auto 0' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#a855f7' }}>Upcoming Features:</h3>
                        <ul style={{ textAlign: 'left', color: '#cbd5e1', lineHeight: '2' }}>
                            <li>📤 1-on-1 private messaging</li>
                            <li>✏️ Edit and delete messages</li>
                            <li>🟢 Real-time online status</li>
                            <li>⌨️ Typing indicators</li>
                            <li>📎 File sharing</li>
                            <li>✅ Read receipts</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Messages;
