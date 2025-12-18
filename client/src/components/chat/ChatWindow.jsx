import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import MessageBubble from './MessageBubble';

const ChatWindow = ({ selectedUser, onBack }) => {
    const { user, token } = useAuth();
    const { socket, markLocalAsRead } = useSocket();

    // State
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isTyping, setIsTyping] = useState(false);

    // Advanced Features State
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Refs
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);

    // Fetch initial messages or load more
    const fetchMessages = async (before = null) => {
        if (!selectedUser) return;

        try {
            const url = `${API_URL}/api/messages/${selectedUser._id}?limit=20${before ? `&before=${before}` : ''}`;
            const res = await fetch(url, {
                headers: { 'x-auth-token': token }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.length < 20) setHasMore(false);

                if (before) {
                    setMessages(prev => [...data, ...prev]);
                    // Scroll position adjustment handled in handleScroll
                } else {
                    setMessages(data);
                    setHasMore(data.length === 20);
                }
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };

    // Initial load
    useEffect(() => {
        setLoading(true);
        fetchMessages().then(() => {
            setLoading(false);
            scrollToBottom();
        });
    }, [selectedUser, token]);

    // Scroll listener for infinite scroll
    const handleScroll = async (e) => {
        if (e.target.scrollTop === 0 && hasMore && !loadingMore && !loading) {
            const firstMsg = messages[0];
            if (firstMsg && firstMsg.createdAt) {
                setLoadingMore(true);
                // Save current height to adjust scroll later
                const oldHeight = e.target.scrollHeight;

                await fetchMessages(firstMsg.createdAt);

                // Adjust scroll so we don't jump to top
                // Need to use requestAnimationFrame or wait for DOM update
                requestAnimationFrame(() => {
                    const newHeight = e.target.scrollHeight;
                    e.target.scrollTop = newHeight - oldHeight;
                });

                setLoadingMore(false);
            }
        }
    };

    // Handle real-time messages
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (message) => {
            // Only add if it belongs to current conversation
            if ((message.sender === selectedUser._id && message.recipient === user.id) ||
                (message.sender === user.id && message.recipient === selectedUser._id)) {

                // Deduplicate based on _id if it exists
                setMessages(prev => {
                    const exists = prev.some(m => m._id === message._id);
                    if (exists) return prev;
                    return [...prev, message];
                });
                scrollToBottom();
            }
        };

        const handleMessageSent = (message) => {
            // Ensure it's for the current conversation
            if (message.recipient === selectedUser._id || message.sender === selectedUser._id) {
                setMessages(prev => {
                    const exists = prev.some(m => m._id === message._id);
                    if (exists) return prev;
                    return [...prev, message];
                });
                scrollToBottom();
            }
        };

        const handleTypingStart = ({ from }) => {
            if (from === selectedUser._id) setIsTyping(true);
        };

        const handleTypingStop = ({ from }) => {
            if (from === selectedUser._id) setIsTyping(false);
        };

        const handleMessagesRead = ({ recipientId }) => {
            if (recipientId === selectedUser._id) {
                setMessages(prev => prev.map(msg =>
                    msg.sender === user.id ? { ...msg, read: true, delivered: true } : msg
                ));
            }
        };

        socket.on('receive-message', handleReceiveMessage);
        socket.on('message-sent', handleMessageSent);
        socket.on('typing-start', handleTypingStart);
        socket.on('typing-stop', handleTypingStop);
        socket.on('messages-read', handleMessagesRead);

        return () => {
            socket.off('receive-message', handleReceiveMessage);
            socket.off('message-sent', handleMessageSent);
            socket.off('typing-start', handleTypingStart);
            socket.off('typing-stop', handleTypingStop);
            socket.off('messages-read', handleMessagesRead);
        };
    }, [socket, selectedUser, user.id]);

    // Mark as read explicitly when messages load or window is active
    useEffect(() => {
        if (!socket || !selectedUser || !messages.length) return;

        // Find unread messages from them
        const unreadExists = messages.some(m => m.sender === selectedUser._id && !m.read);

        if (unreadExists) {
            socket.emit('mark-read', {
                senderId: selectedUser._id,
                recipientId: user.id
            });
            // Update local state optimistically
            setMessages(prev => prev.map(msg =>
                msg.sender === selectedUser._id ? { ...msg, read: true } : msg
            ));
        }

        // Also clear local unread count badge
        markLocalAsRead(selectedUser._id);
    }, [messages, selectedUser, socket, user.id, markLocalAsRead]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !editingMessage && !replyingTo) || !socket) return;

        if (editingMessage) {
            // Edit Message
            try {
                const res = await fetch(`${API_URL}/api/messages/${editingMessage._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify({ content: newMessage })
                });

                if (res.ok) {
                    const updatedMsg = await res.json();
                    setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
                    setEditingMessage(null);
                    setNewMessage('');
                }
            } catch (err) {
                console.error('Edit error:', err);
            }
            return;
        }

        // New Message
        socket.emit('private-message', {
            senderId: user.id,
            recipientId: selectedUser._id,
            content: newMessage,
            replyTo: replyingTo ? replyingTo._id : null
        });

        // Clear input
        setNewMessage('');
        setReplyingTo(null);
    };

    const handleInput = (e) => {
        setNewMessage(e.target.value);

        if (!socket) return;

        socket.emit('typing-start', { to: selectedUser._id, from: user.id });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing-stop', { to: selectedUser._id, from: user.id });
        }, 1000);
    };

    // Actions
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_URL}/api/messages/upload`, {
                method: 'POST',
                headers: { 'x-auth-token': token },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                // Send message with attachment immediately (includes all metadata)
                socket.emit('private-message', {
                    senderId: user.id,
                    recipientId: selectedUser._id,
                    content: '', // Can be empty if just media
                    attachments: [{
                        url: data.url,
                        type: data.type,
                        name: data.name,
                        size: data.size,
                        mimeType: data.mimeType
                    }],
                    replyTo: replyingTo ? replyingTo._id : null
                });
                setReplyingTo(null);
            }
        } catch (err) {
            console.error('Upload error:', err);
            alert('Failed to upload file');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }
};

const onReply = (msg) => {
    setReplyingTo(msg);
    setEditingMessage(null);
    // Focus input
    document.getElementById('chat-input')?.focus();
};

const onEdit = (msg) => {
    setEditingMessage(msg);
    setNewMessage(msg.content);
    setReplyingTo(null);
    document.getElementById('chat-input')?.focus();
};

const onDelete = async (msgId, mode = 'self') => {
    if (!window.confirm(`Delete for ${mode === 'everyone' ? 'everyone' : 'me'}?`)) return;

    try {
        const res = await fetch(`${API_URL}/api/messages/${msgId}?mode=${mode}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });

        if (res.ok) {
            // If everyone, server updates content. Local update needs to happen
            // Ideally socket emits 'message-updated' or 'message-deleted', but for now manual local update
            if (mode === 'everyone') {
                const data = await res.json();
                setMessages(prev => prev.map(m => m._id === msgId ? data.updatedMessage : m));
            } else {
                // Self delete: remove from view locally
                setMessages(prev => prev.filter(m => m._id !== msgId));
            }
        }
    } catch (err) {
        console.error('Delete error:', err);
    }
};

return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0f172a' }}>
        {/* Header */}
        <div style={{
            padding: '1rem',
            borderBottom: '1px solid #334155',
            background: '#0f172a', // Darker header
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
        }}>
            <button
                onClick={onBack}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#f8fafc',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    display: window.innerWidth < 768 ? 'block' : 'none'
                }}
            >
                ←
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                    <img
                        src={selectedUser.avatarUrl || 'https://via.placeholder.com/40'}
                        alt={selectedUser.pseudoName}
                        style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    {selectedUser.isOnline && (
                        <div style={{
                            position: 'absolute',
                            bottom: '0',
                            right: '0',
                            width: '12px',
                            height: '12px',
                            backgroundColor: '#22c55e',
                            borderRadius: '50%',
                            border: '2px solid #0f172a'
                        }} />
                    )}
                </div>

                <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#f8fafc' }}>{selectedUser.pseudoName}</h3>
                    <div style={{ fontSize: '0.8rem', color: isTyping ? '#a855f7' : '#94a3b8', height: '1.2em', transition: 'color 0.3s' }}>
                        {isTyping ? 'Typing...' : (
                            selectedUser.isOnline ? 'Active now' : (
                                selectedUser.lastSeen ? `Last seen ${new Date(selectedUser.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Messages Area */}
        <div
            onScroll={handleScroll}
            ref={messagesContainerRef}
            style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center' // Center messages container
            }}
        >
            <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column' }}>
                {loadingMore && <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem', padding: '1rem' }}>Loading older messages...</div>}

                {loading ? (
                    <div style={{ textAlign: 'center', marginTop: '20px', color: '#94a3b8' }}>Loading chat...</div>
                ) : (
                    <>
                        {messages.map((msg, index) => (
                            <MessageBubble
                                key={msg._id || index}
                                message={msg}
                                isOwn={msg.sender === user.id}
                                previousMessage={index > 0 ? messages[index - 1] : null}
                                onReply={onReply}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>
        </div>

        {/* Input Area */}
        <div style={{
            padding: '1rem',
            // Transparent bg to show floating effect
            background: 'transparent',
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            {/* Reply/Edit Preview */}
            {(replyingTo || editingMessage) && (
                <div style={{
                    width: '100%', maxWidth: '800px',
                    background: '#1e293b', padding: '8px 16px',
                    borderRadius: '12px 12px 0 0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '-12px', zIndex: 1, border: '1px solid #334155'
                }}>
                    <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
                        {editingMessage ? (
                            <span>Edit message</span>
                        ) : (
                            <span>Replying to <strong>{replyingTo.sender === user.id ? 'yourself' : 'recipient'}</strong></span>
                        )}
                        <div style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                            {editingMessage ? editingMessage.content : replyingTo.content || 'Media'}
                        </div>
                    </div>
                    <button
                        onClick={() => { setReplyingTo(null); setEditingMessage(null); setNewMessage(''); }}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
                    >
                        ×
                    </button>
                </div>
            )}

            <form
                onSubmit={handleSendMessage}
                style={{
                    width: '100%',
                    maxWidth: '800px', // Constrain width like the example
                    background: '#334155', // Lighter gray than bg
                    borderRadius: replyingTo || editingMessage ? '0 0 24px 24px' : '24px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #475569'
                }}
            >
                {/* File Upload Button */}
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                // Accept all file types
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    style={{
                        background: 'none', border: 'none', color: '#94a3b8',
                        fontSize: '1.2rem', cursor: 'pointer', padding: '0 4px'
                    }}
                >
                    {isUploading ? '...' : '📎'}
                </button>

                <input
                    id="chat-input"
                    type="text"
                    value={newMessage}
                    onChange={handleInput}
                    placeholder={editingMessage ? "Edit message..." : `Message ${selectedUser.pseudoName}...`}
                    style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        outline: 'none',
                        fontSize: '1rem',
                        padding: '4px 8px'
                    }}
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim() && !editingMessage}
                    style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: 'none',
                        background: newMessage.trim() ? '#f8fafc' : '#475569',
                        color: newMessage.trim() ? 'black' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: newMessage.trim() ? 'pointer' : 'default',
                        transition: 'all 0.2s'
                    }}
                >
                    {editingMessage ? '✓' : <span style={{ fontSize: '1.2rem', marginTop: '-2px' }}>↑</span>}
                </button>
            </form>
        </div>
    </div>
);
};

export default ChatWindow;
