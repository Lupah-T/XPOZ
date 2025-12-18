import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import MessageBubble from './MessageBubble';

const ChatWindow = ({ selectedUser, onBack }) => {
    const { user, token } = useAuth();
    const { socket } = useSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Fetch message history
    useEffect(() => {
        if (!selectedUser) return;

        const fetchMessages = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/api/messages/${selectedUser._id}`, {
                    headers: { 'x-auth-token': token }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data);
                    scrollToBottom();
                }
            } catch (err) {
                console.error('Error fetching messages:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [selectedUser, token]);

    // Handle real-time messages
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (message) => {
            console.log('Received message:', message);
            // Only add if it belongs to current conversation
            if (message.sender === selectedUser._id || message.recipient === selectedUser._id) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();
            }
        };

        const handleMessageSent = (message) => {
            // Only add if it matches current conversation (it should)
            if (message.recipient === selectedUser._id) {
                setMessages(prev => [...prev, message]);
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
    }, [socket, selectedUser]);

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

        // Clear input (optimistic update could happen here but we wait for 'message-sent' event for simplicity and ID sync)
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e293b' }}>
            {/* Header */}
            <div style={{
                padding: '1rem',
                borderBottom: '1px solid var(--glass-border)',
                background: 'var(--glass-bg)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#cbd5e1',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        display: window.innerWidth < 768 ? 'block' : 'none'
                    }}
                >
                    ←
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img
                        src={selectedUser.avatarUrl || 'https://via.placeholder.com/40'}
                        alt={selectedUser.pseudoName}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>{selectedUser.pseudoName}</h3>
                        {/* Status (Online/Typing) */}
                        <div style={{ fontSize: '0.8rem', color: '#a855f7', height: '1.2em' }}>
                            {isTyping ? 'Typing...' : (
                                selectedUser.isOnline ? 'Online' : '' // 'Last seen...'
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column'
            }}>
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

            {/* Input Area */}
            <form
                onSubmit={handleSendMessage}
                style={{
                    padding: '1rem',
                    borderTop: '1px solid var(--glass-border)',
                    background: 'var(--glass-bg)',
                    display: 'flex',
                    gap: '0.5rem'
                }}
            >
                <input
                    type="text"
                    value={newMessage}
                    onChange={handleInput}
                    placeholder="Type a message..."
                    style={{
                        flex: 1,
                        padding: '10px 16px',
                        borderRadius: '24px',
                        border: '1px solid #334155',
                        background: '#0f172a',
                        color: 'white',
                        outline: 'none'
                    }}
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '24px',
                        border: 'none',
                        background: newMessage.trim() ? '#a855f7' : '#475569',
                        color: 'white',
                        cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                        transition: 'background 0.2s'
                    }}
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
