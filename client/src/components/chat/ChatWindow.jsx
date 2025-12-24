import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import MessageBubble from './MessageBubble';
import { getMediaUrl } from '../../utils/media';
import VoiceRecorder from './VoiceRecorder';

const ChatWindow = ({ selectedUser, onBack }) => {
    const { user, token } = useAuth();
    const { socket, markLocalAsRead, startCall } = useSocket();

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
    const [isRecordingVoice, setIsRecordingVoice] = useState(false);

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

        const handleMessageSent = (data) => {
            // Check if data is object with message and tempId or just message (backward compatibility)
            const message = data.message || data;
            const tempId = data.tempId;

            // Ensure it's for the current conversation
            if (message.recipient === selectedUser._id || message.sender === selectedUser._id) {
                setMessages(prev => {
                    // If we have a tempId, find the temporary message and replace it
                    if (tempId) {
                        return prev.map(m => m._id === tempId ? message : m);
                    }

                    // Fallback: check exists by _id
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

        // New Message Logic with Optimistic UI
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const optimisticMessage = {
            _id: tempId,
            sender: user.id,
            recipient: selectedUser._id,
            content: newMessage,
            createdAt: new Date().toISOString(),
            read: false,
            delivered: false,
            status: 'sending', // Custom flag for UI if needed
            replyTo: replyingTo ? replyingTo : null
        };

        // 1. Add to UI immediately
        setMessages(prev => [...prev, optimisticMessage]);
        scrollToBottom();

        // 2. Emit to server
        socket.emit('private-message', {
            senderId: user.id,
            recipientId: selectedUser._id,
            content: newMessage,
            replyTo: replyingTo ? replyingTo._id : null,
            tempId // Send tempId to server
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

    const handleVoiceNoteSend = async (audioBlob, duration) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', audioBlob, `voice-note-${Date.now()}.webm`);

        try {
            const res = await fetch(`${API_URL}/api/messages/upload`, {
                method: 'POST',
                headers: { 'x-auth-token': token },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                socket.emit('private-message', {
                    senderId: user.id,
                    recipientId: selectedUser._id,
                    content: '',
                    attachments: [{
                        url: data.url,
                        type: 'audio',
                        name: data.name,
                        size: data.size,
                        mimeType: data.mimeType || 'audio/webm',
                        duration: duration
                    }],
                    replyTo: replyingTo ? replyingTo._id : null
                });
                setReplyingTo(null);
                setIsRecordingVoice(false);
            }
        } catch (err) {
            console.error('Voice note upload error:', err);
            alert('Failed to send voice note');
        } finally {
            setIsUploading(false);
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
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: 'var(--bg-main)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--glass-stroke)',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                zIndex: 10
            }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-main)',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        display: window.innerWidth < 768 ? 'block' : 'none',
                        padding: '0 0.5rem'
                    }}
                >
                    ←
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <div style={{ position: 'relative' }}>
                        <img
                            src={getMediaUrl(selectedUser.avatarUrl) || 'https://via.placeholder.com/40'}
                            alt={selectedUser.pseudoName}
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
                        />
                        {selectedUser.isOnline && (
                            <div style={{
                                position: 'absolute',
                                bottom: '2px',
                                right: '2px',
                                width: '10px',
                                height: '10px',
                                backgroundColor: '#22c55e',
                                borderRadius: '50%',
                                border: '2px solid var(--glass-bg)'
                            }} />
                        )}
                    </div>

                    <div style={{ overflow: 'hidden' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {selectedUser.pseudoName}
                        </h3>
                        <div style={{ fontSize: '0.75rem', color: isTyping ? 'var(--primary)' : 'var(--text-muted)', height: '1.2em', transition: 'color 0.3s' }}>
                            {isTyping ? 'Typing...' : (
                                selectedUser.isOnline ? 'Active now' : (
                                    selectedUser.lastSeen ? `Last seen ${new Date(selectedUser.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ` : ''
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Optional: Add video/audio call icons placeholder like WhatsApp */}
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <button
                        onClick={() => startCall(selectedUser, 'voice')}
                        style={{ background: 'rgba(139, 92, 246, 0.15)', border: 'none', width: '38px', height: '38px', borderRadius: '50%', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                        title="Voice Call"
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.25)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'}
                    >📞</button>
                    <button
                        onClick={() => startCall(selectedUser, 'video')}
                        style={{ background: 'rgba(139, 92, 246, 0.15)', border: 'none', width: '38px', height: '38px', borderRadius: '50%', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                        title="Video Call"
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.25)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'}
                    >📹</button>
                </div>
            </div>

            {/* Messages Area - Internal Scroll */}
            <div
                onScroll={handleScroll}
                ref={messagesContainerRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'var(--bg-main)',
                    WebkitOverflowScrolling: 'touch'
                }}
            >
                <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column' }}>
                    {loadingMore && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem' }}>Loading older messages...</div>}

                    {loading ? (
                        <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)' }}>
                            <div className="loader" style={{ margin: '0 auto 1rem' }}></div>
                            Loading chat...
                        </div>
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

            <div style={{
                padding: '0.75rem 1rem',
                paddingBottom: 'env(safe-area-inset-bottom, 0.75rem)', // Handle mobile safe areas
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderTop: '1px solid var(--glass-stroke)',
                display: 'flex',
                justifyContent: 'center',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 10,
                boxShadow: '0 -4px 12px rgba(0,0,0,0.1)'
            }}>
                {/* Reply/Edit Preview */}
                {(replyingTo || editingMessage) && (
                    <div style={{
                        width: '100%', maxWidth: '800px',
                        background: 'var(--surface)', padding: '10px 16px',
                        borderRadius: '16px 16px 0 0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        marginBottom: '0', zIndex: 1, border: '1px solid var(--glass-stroke)',
                        borderBottom: 'none',
                        animation: 'fadeInUp 0.3s ease'
                    }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', borderLeft: '3px solid var(--primary)', paddingLeft: '10px' }}>
                            {editingMessage ? (
                                <strong style={{ color: 'var(--primary)' }}>Editing Message</strong>
                            ) : (
                                <span>Replying to <strong style={{ color: 'var(--primary)' }}>{replyingTo.sender === user.id ? 'yourself' : selectedUser.pseudoName}</strong></span>
                            )}
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px', marginTop: '2px' }}>
                                {editingMessage ? editingMessage.content : (replyingTo.content || 'Media file')}
                            </div>
                        </div>
                        <button
                            onClick={() => { setReplyingTo(null); setEditingMessage(null); setNewMessage(''); }}
                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            ×
                        </button>
                    </div>
                )}

                <form
                    onSubmit={handleSendMessage}
                    style={{
                        width: '100%',
                        maxWidth: '800px',
                        background: 'var(--surface-hover)',
                        borderRadius: replyingTo || editingMessage ? '0 0 20px 20px' : '20px',
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'flex-end', // Align items to bottom for growing textarea
                        gap: '10px',
                        border: '1px solid var(--glass-stroke)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                        transition: 'all 0.3s ease'
                    }}
                >
                    {/* File Upload Button */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        style={{
                            background: 'none', border: 'none', color: 'var(--text-muted)',
                            fontSize: '1.4rem', cursor: 'pointer', padding: '8px 4px',
                            display: 'flex', alignItems: 'center', transition: 'transform 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {isUploading ? '⌛' : '📎'}
                    </button>

                    {/* Microphone Button */}
                    <button
                        type="button"
                        onClick={() => setIsRecordingVoice(true)}
                        disabled={isUploading || isRecordingVoice}
                        style={{
                            background: 'none', border: 'none', color: 'var(--text-muted)',
                            fontSize: '1.4rem', cursor: 'pointer', padding: '8px 4px',
                            display: 'flex', alignItems: 'center', transition: 'transform 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        title="Record Voice Note"
                    >
                        🎤
                    </button>

                    <textarea
                        id="chat-input"
                        value={newMessage}
                        onChange={(e) => {
                            handleInput(e);
                            // Auto-expand
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                                e.target.style.height = 'auto';
                            }
                        }}
                        placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                        rows={1}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-main)',
                            outline: 'none',
                            fontSize: '0.95rem',
                            padding: '10px 4px',
                            resize: 'none',
                            maxHeight: '150px',
                            minHeight: '24px',
                            lineHeight: '1.4',
                            fontFamily: 'inherit'
                        }}
                    />

                    <button
                        type="submit"
                        disabled={!newMessage.trim() && !editingMessage}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            border: 'none',
                            background: newMessage.trim() || editingMessage ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                            color: newMessage.trim() || editingMessage ? 'white' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: newMessage.trim() || editingMessage ? 'pointer' : 'default',
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            transform: newMessage.trim() || editingMessage ? 'scale(1)' : 'scale(0.9)',
                            fontSize: '1.2rem',
                            marginBottom: '4px' // Align with text
                        }}
                    >
                        {editingMessage ? '✓' : '🚀'}
                    </button>
                </form>
            </div>

            {/* Voice Recorder Overlay */}
            {isRecordingVoice && (
                <VoiceRecorder
                    onSend={handleVoiceNoteSend}
                    onCancel={() => setIsRecordingVoice(false)}
                />
            )}

            <style>{`
    .loader {
    width: 24px;
    height: 24px;
    border: 3px solid var(--glass-stroke);
    border-top: 3px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`}</style>
        </div>
    );
};

export default ChatWindow;
