import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import Header from '../components/Header';


const Chats = () => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchChats();
        // Refresh chat list every 10 seconds
        const interval = setInterval(fetchChats, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchChats = async () => {
        try {
            const res = await fetch(`${API_URL}/api/chats`, {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            setChats(data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch chats:', err);
            setLoading(false);
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Today - show time
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

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
                    <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Chats</h1>
                </div>

                {/* Chat List */}
                <div>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                            Loading chats...
                        </div>
                    ) : chats.length === 0 ? (
                        <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                            <h3 style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>No chats yet</h3>
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                Join a group to start chatting
                            </p>
                            <button
                                onClick={() => navigate('/groups')}
                                className="btn"
                                style={{ marginTop: '1rem', background: '#a855f7' }}
                            >
                                Browse Groups
                            </button>
                        </div>
                    ) : (
                        chats.map((chat) => (
                            <div
                                key={chat._id}
                                onClick={() => navigate(`/groups/${chat._id}/chat`)}
                                style={{
                                    padding: '1rem',
                                    borderBottom: '1px solid var(--glass-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                    background: chat.unreadCount > 0 ? 'rgba(168,85,247,0.05)' : 'transparent'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = chat.unreadCount > 0 ? 'rgba(168,85,247,0.05)' : 'transparent'}
                            >
                                {/* Avatar */}
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem',
                                    flexShrink: 0
                                }}>
                                    {chat.type === 'group' ? '👥' : '👤'}
                                </div>

                                {/* Chat Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                                        <h3 style={{
                                            margin: 0,
                                            fontSize: '1.05rem',
                                            fontWeight: chat.unreadCount > 0 ? '600' : '500',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {chat.name}
                                        </h3>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            color: chat.unreadCount > 0 ? '#a855f7' : '#64748b',
                                            flexShrink: 0,
                                            marginLeft: '0.5rem'
                                        }}>
                                            {chat.lastMessage?.timestamp && formatTime(chat.lastMessage.timestamp)}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '0.9rem',
                                            color: '#94a3b8',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            flex: 1
                                        }}>
                                            {chat.lastMessage ? (
                                                <>
                                                    <span style={{ fontWeight: '500' }}>{chat.lastMessage.sender}: </span>
                                                    {chat.lastMessage.text}
                                                </>
                                            ) : (
                                                <span style={{ fontStyle: 'italic' }}>No messages yet</span>
                                            )}
                                        </p>

                                        {/* Unread Badge */}
                                        {chat.unreadCount > 0 && (
                                            <div style={{
                                                background: '#a855f7',
                                                color: '#fff',
                                                borderRadius: '12px',
                                                padding: '0.15rem 0.5rem',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                marginLeft: '0.5rem',
                                                minWidth: '20px',
                                                textAlign: 'center'
                                            }}>
                                                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
};

export default Chats;
