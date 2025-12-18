import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import MessageBubble from './MessageBubble';

const ChatWindow = ({ selectedUser, onBack }) => {
    const { user, token } = useAuth();
    const { socket } = useSocket();

    // State
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isTyping, setIsTyping] = useState(false);

    // Refs
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const typingTimeoutRef = useRef(null);

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
            console.log('Received message:', message);
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
            console.log('Message sent confirmed:', message);
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

        socket.on('receive-message', handleReceiveMessage);
        socket.on('message-sent', handleMessageSent);
        socket.on('typing-start', handleTypingStart);
        socket.on('typing-stop', handleTypingStop);

        return () => {
            socket.off('receive-message', handleReceiveMessage);
            socket.off('message-sent', handleMessageSent);
            socket.off('typing-start', handleTypingStart);
            socket.off('typing-stop', handleTypingStop);
        };
    }, [socket, selectedUser, user.id]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        // Emit through socket
        socket.emit('private-message', {
            senderId: user.id,
            recipientId: selectedUser._id,
            content: newMessage
        });

        // Clear input
        setNewMessage('');
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
                justifyContent: 'center'
            }}>
                <form
                    onSubmit={handleSendMessage}
                    style={{
                        width: '100%',
                        maxWidth: '800px', // Constrain width like the example
                        background: '#334155', // Lighter gray than bg
                        borderRadius: '24px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        border: '1px solid #475569'
                    }}
                >
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleInput}
                        placeholder={`Message ${selectedUser.pseudoName}...`}
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
                        disabled={!newMessage.trim()}
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
                        <span style={{ fontSize: '1.2rem', marginTop: '-2px' }}>↑</span>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
