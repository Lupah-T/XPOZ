import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';

const ConversationList = ({ conversations, selectedUser, onSelectUser, onlineUsers }) => {
    const navigate = useNavigate();
    const { unreadCounts } = useSocket();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        // If less than 24 hours
        if (diff < 86400000) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        // If less than 7 days
        if (diff < 604800000) {
            return date.toLocaleDateString([], { weekday: 'short' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            height: '100%'
        }}>
            {conversations.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    <p style={{ marginBottom: '1rem' }}>No conversations yet.</p>
                    <button
                        onClick={() => navigate('/users')}
                        style={{
                            padding: '0.6rem 1.2rem',
                            background: '#a855f7',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        Start a Chat
                    </button>
                </div>
            ) : (
                conversations.map((conv) => {
                    const isSelected = selectedUser && selectedUser._id === conv._id;
                    const isOnline = onlineUsers.has(conv._id) && onlineUsers.get(conv._id).isOnline;

                    return (
                        <div
                            key={conv._id}
                            onClick={() => onSelectUser(conv)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '1rem',
                                cursor: 'pointer',
                                backgroundColor: isSelected ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                                borderLeft: isSelected ? '3px solid #a855f7' : '3px solid transparent',
                                transition: 'all 0.2s ease',
                                borderBottom: '1px solid var(--glass-border)'
                            }}
                        >
                            <div style={{ position: 'relative', marginRight: '1rem' }}>
                                <img
                                    src={conv.avatarUrl || 'https://via.placeholder.com/40'}
                                    alt={conv.pseudoName}
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        objectFit: 'cover'
                                    }}
                                />
                                {isOnline && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '2px',
                                        right: '2px',
                                        width: '12px',
                                        height: '12px',
                                        backgroundColor: '#22c55e',
                                        borderRadius: '50%',
                                        border: '2px solid #0f172a'
                                    }} />
                                )}
                            </div>

                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <h4 style={{ margin: 0, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {conv.pseudoName}
                                    </h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                            {conv.lastMessage && formatDate(conv.lastMessage.createdAt)}
                                        </span>
                                        {/* Unread Badge */}
                                        {(unreadCounts.get(conv._id) > 0) && (
                                            <div style={{
                                                background: '#ef4444',
                                                color: 'white',
                                                fontSize: '0.7rem',
                                                fontWeight: 'bold',
                                                minWidth: '18px',
                                                height: '18px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '0 4px'
                                            }}>
                                                {unreadCounts.get(conv._id)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <p style={{
                                    margin: 0,
                                    fontSize: '0.9rem',
                                    color: conv.lastMessage?.read ? '#94a3b8' : '#e2e8f0',
                                    fontWeight: conv.lastMessage?.read ? 'normal' : 'bold',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {conv.lastMessage ? (
                                        <>
                                            {conv.lastMessage.sender === conv._id ? '' : 'You: '}
                                            {conv.lastMessage.content}
                                        </>
                                    ) : (
                                        'Start a conversation'
                                    )}
                                </p>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default ConversationList;
