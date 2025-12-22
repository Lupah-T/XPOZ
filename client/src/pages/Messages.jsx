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
        <div style={{ maxHeight: '100vh', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', paddingBottom: '60px' }}>
            <Header />

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', maxWidth: '1200px', margin: '0 auto', width: '100%', position: 'relative' }}>

                {/* Left Side: Conversation List */}
                <div style={{
                    flexDirection: 'column',
                    // Responsive hiding: show list only if no user selected or on wide screens
                    display: window.innerWidth < 768 && selectedUser ? 'none' : 'flex',
                    width: window.innerWidth < 768 ? '100%' : '350px',
                    borderRight: '1px solid var(--glass-border)',
                    background: 'var(--glass-bg)'
                }}>
                    <div style={{ padding: '1.5rem 1rem', borderBottom: '1px solid var(--glass-border)' }}>
                        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Messages</h1>
                    </div>

                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading conversations...</div>
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

                {/* Right Side: Chat Window */}
                <div style={{
                    flex: 1,
                    flexDirection: 'column',
                    // Responsive hiding: show chat window only if user selected or on wide screens
                    display: window.innerWidth < 768 && !selectedUser ? 'none' : 'flex'
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
                            color: '#64748b',
                            background: 'rgba(0,0,0,0.2)'
                        }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>💬</div>
                            <p style={{ fontSize: '1.2rem' }}>Select a conversation to start messaging</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;

