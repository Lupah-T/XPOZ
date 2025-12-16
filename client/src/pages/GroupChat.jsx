import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { initializeSocket, getSocket } from '../socket';
import Header from '../components/Header';
import Footer from '../components/Footer';

const GroupChat = () => {
    const { id: groupId } = useParams();
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [group, setGroup] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        fetchGroupDetails();
        fetchMessages();

        // Initialize socket
        const socket = initializeSocket(token);
        socket.connect();

        // Join group room
        socket.emit('join-group', { groupId, token });

        // Listen for new messages
        socket.on('new-message', (message) => {
            setMessages(prev => [...prev, message]);
        });

        // Listen for typing indicators
        socket.on('user-typing', ({ userId, isTyping }) => {
            setTypingUsers(prev => {
                const newSet = new Set(prev);
                if (isTyping) {
                    newSet.add(userId);
                } else {
                    newSet.delete(userId);
                }
                return newSet;
            });
        });

        socket.on('joined-group', () => {
            console.log('[Chat] Joined group successfully');
        });

        // Cleanup
        return () => {
            socket.emit('leave-group', { groupId });
            socket.off('new-message');
            socket.off('user-typing');
            socket.off('joined-group');
        };
    }, [groupId, token]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchGroupDetails = async () => {
        try {
            const res = await fetch(`${API_URL}/api/groups/${groupId}`, {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            setGroup(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMessages = async () => {
        try {
            const res = await fetch(`${API_URL}/api/groupMessages/${groupId}`, {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            setMessages(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const socket = getSocket();
        socket.emit('send-message', {
            groupId,
            text: newMessage
        });

        setNewMessage('');
        handleTyping(false);
    };

    const handleTyping = (typing) => {
        const socket = getSocket();
        socket.emit('typing', { groupId, isTyping: typing });

        if (typing) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                handleTyping(false);
            }, 3000);
        }
    };

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        if (e.target.value && !isTyping) {
            setIsTyping(true);
            handleTyping(true);
        } else if (!e.target.value && isTyping) {
            setIsTyping(false);
            handleTyping(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                {/* Chat Header */}
                <div style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    background: 'var(--glass-bg)'
                }}>
                    <button
                        onClick={() => navigate('/groups')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#fff',
                            fontSize: '1.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        ←
                    </button>
                    <div>
                        <h2 style={{ margin: 0 }}>{group?.name || 'Loading...'}</h2>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                            {group?.members?.length || 0} members
                        </div>
                    </div>
                </div>

                {/* Messages Container */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    {messages.map((msg, idx) => {
                        const isOwnMessage = msg.sender?._id === user?.id;
                        return (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    justifyContent: isOwnMessage ? 'flex-end' : 'flex-start'
                                }}
                            >
                                <div style={{
                                    maxWidth: '70%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
                                }}>
                                    {!isOwnMessage && (
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                                            {msg.sender?.pseudoName || 'Unknown'}
                                        </span>
                                    )}
                                    <div style={{
                                        padding: '0.75rem 1rem',
                                        borderRadius: '12px',
                                        background: isOwnMessage ? '#a855f7' : 'var(--glass-bg)',
                                        color: '#fff',
                                        wordBreak: 'break-word'
                                    }}>
                                        {msg.text}
                                    </div>
                                    <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.25rem' }}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Typing Indicator */}
                    {typingUsers.size > 0 && (
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
                            Someone is typing...
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form
                    onSubmit={handleSendMessage}
                    style={{
                        padding: '1rem',
                        borderTop: '1px solid var(--glass-border)',
                        display: 'flex',
                        gap: '0.5rem',
                        background: 'var(--glass-bg)'
                    }}
                >
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        placeholder="Type a message..."
                        className="input"
                        style={{ flex: 1 }}
                    />
                    <button
                        type="submit"
                        className="btn"
                        style={{ background: '#a855f7', padding: '0.75rem 1.5rem' }}
                    >
                        Send
                    </button>
                </form>
            </main>

            <Footer />
        </div>
    );
};

export default GroupChat;
