import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';

const ConversationList = ({ conversations, selectedUser, onSelectUser, onlineUsers, onDeleteConversation }) => {
    const navigate = useNavigate();
    const { unreadCounts } = useSocket();
    const [longPressedConv, setLongPressedConv] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState(null);
    const longPressTimer = useRef(null);
    const pressStartTime = useRef(null);

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

    const handlePressStart = (conv, e) => {
        e.preventDefault();
        pressStartTime.current = Date.now();
        setLongPressedConv(conv._id);

        longPressTimer.current = setTimeout(() => {
            // Long press detected
            setConversationToDelete(conv);
            setShowDeleteModal(true);
            setLongPressedConv(null);
        }, 500); // 500ms for long press
    };

    const handlePressEnd = (conv, e) => {
        const pressDuration = Date.now() - pressStartTime.current;

        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }

        // If it was a short press (less than 500ms), treat as normal click
        if (pressDuration < 500) {
            setLongPressedConv(null);
            onSelectUser(conv);
        } else {
            // Long press completed, modal will show
            setLongPressedConv(null);
        }
    };

    const handleDeleteConfirm = () => {
        if (conversationToDelete && onDeleteConversation) {
            onDeleteConversation(conversationToDelete._id);
        }
        setShowDeleteModal(false);
        setConversationToDelete(null);
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setConversationToDelete(null);
    };

    return (
        <>
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
                        const isLongPressed = longPressedConv === conv._id;

                        return (
                            <div
                                key={conv._id}
                                onMouseDown={(e) => handlePressStart(conv, e)}
                                onMouseUp={(e) => handlePressEnd(conv, e)}
                                onMouseLeave={() => {
                                    if (longPressTimer.current) {
                                        clearTimeout(longPressTimer.current);
                                        setLongPressedConv(null);
                                    }
                                }}
                                onTouchStart={(e) => handlePressStart(conv, e)}
                                onTouchEnd={(e) => handlePressEnd(conv, e)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    cursor: 'pointer',
                                    backgroundColor: isLongPressed
                                        ? 'rgba(239, 68, 68, 0.2)'
                                        : isSelected
                                            ? 'rgba(168, 85, 247, 0.1)'
                                            : 'transparent',
                                    borderLeft: isSelected ? '3px solid #a855f7' : '3px solid transparent',
                                    transition: 'all 0.2s ease',
                                    borderBottom: '1px solid var(--glass-border)',
                                    userSelect: 'none',
                                    WebkitUserSelect: 'none'
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
                                            objectFit: 'cover',
                                            pointerEvents: 'none'
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

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        borderRadius: '16px',
                        padding: '2rem',
                        maxWidth: '400px',
                        width: '100%',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                    }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1.5rem' }}>
                            Delete Conversation?
                        </h3>
                        <p style={{ margin: '0 0 2rem 0', color: '#cbd5e1', lineHeight: '1.6' }}>
                            Are you sure you want to delete this conversation with <strong>{conversationToDelete?.pseudoName}</strong>?
                            This will remove all messages from your view only.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleDeleteCancel}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: 'transparent',
                                    color: '#cbd5e1',
                                    border: '1px solid #475569',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.95rem',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(71, 85, 105, 0.3)';
                                    e.target.style.borderColor = '#64748b';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.borderColor = '#475569';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.95rem',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#dc2626';
                                    e.target.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = '#ef4444';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ConversationList;

