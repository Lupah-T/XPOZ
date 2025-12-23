import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ConversationList from '../components/chat/ConversationList';
import ChatWindow from '../components/chat/ChatWindow';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { API_URL } from '../config';
import { useLocation } from 'react-router-dom';

const Messages = () => {
    const { token } = useAuth();
    const { onlineUsers } = useSocket();
    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { state } = useLocation(); // To handle "Message" button from profile page

    // Fetch conversations
    useEffect(() => {
        if (!token) return;

        const fetchConversations = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/api/messages/conversations`, {
                    headers: { 'x-auth-token': token }
                });
                if (res.ok) {
                    const data = await res.json();
                    setConversations(data);
                }
            } catch (err) {
                console.error('Error fetching conversations:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
    }, [token]);

    // Handle navigation from other pages (Profile "Message" button)
    useEffect(() => {
        if (state?.userId && state?.pseudoName) {
            // Check if conversation already exists
            const existingConv = conversations.find(c => c._id === state.userId);
            if (existingConv) {
                setSelectedUser(existingConv);
            } else {
                // Temporary conversation object for new chat
                setSelectedUser({
                    _id: state.userId,
                    pseudoName: state.pseudoName,
                    avatarUrl: state.avatarUrl, // Optional
                    isNew: true
                });
            }
        }
    }, [state, conversations]);


    const handleSelectUser = (user) => {
        setSelectedUser(user);
    };

    const handleBack = () => {
        setSelectedUser(null);
    };

    const handleDeleteConversation = async (userId) => {
        try {
            const res = await fetch(`${API_URL}/api/messages/conversations/${userId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });

            if (res.ok) {
                // Remove conversation from local state
                setConversations(prevConv => prevConv.filter(conv => conv._id !== userId));

                // If the deleted conversation was selected, clear selection
                if (selectedUser && selectedUser._id === userId) {
                    setSelectedUser(null);
                }
            } else {
                console.error('Failed to delete conversation');
            }
        } catch (err) {
            console.error('Error deleting conversation:', err);
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'var(--bg-main)'
        }}>
            <Header />

            <div style={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden',
                maxWidth: '1400px',
                margin: '0 auto',
                width: '100%',
                position: 'relative'
            }}>

                {/* Left Side: Conversation List */}
                <div style={{
                    flexDirection: 'column',
                    display: window.innerWidth < 768 && selectedUser ? 'none' : 'flex',
                    width: window.innerWidth < 768 ? '100%' : '380px',
                    borderRight: '1px solid var(--glass-stroke)',
                    background: 'var(--surface)',
                    transition: 'all 0.3s ease'
                }}>
                    <div style={{
                        padding: '1.5rem',
                        borderBottom: '1px solid var(--glass-stroke)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>Messages</h1>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <div className="loader" style={{ margin: '0 auto 1rem' }}></div>
                                Loading conversations...
                            </div>
                        ) : (
                            <ConversationList
                                conversations={conversations}
                                selectedUser={selectedUser}
                                onSelectUser={handleSelectUser}
                                onlineUsers={onlineUsers}
                                onDeleteConversation={handleDeleteConversation}
                            />
                        )}
                    </div>
                </div>

                {/* Right Side: Chat Window */}
                <div style={{
                    flex: 1,
                    display: window.innerWidth < 768 && !selectedUser ? 'none' : 'flex',
                    flexDirection: 'column',
                    background: 'var(--bg-main)',
                    position: 'relative'
                }}>
                    {selectedUser ? (
                        <ChatWindow
                            selectedUser={selectedUser}
                            onBack={handleBack}
                        />
                    ) : (
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)',
                            background: 'var(--surface)',
                        }}>
                            <div style={{ fontSize: '5rem', marginBottom: '1.5rem', opacity: 0.2 }}>💬</div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>Your Messages</h2>
                            <p style={{ fontSize: '1rem', marginTop: '0.5rem', opacity: 0.8 }}>Select a conversation to start chatting</p>
                        </div>
                    )}
                </div>
            </div>

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

export default Messages;

