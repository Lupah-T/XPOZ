import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_URL } from '../config';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(new Map()); // Map of userId -> status
    const [unreadCounts, setUnreadCounts] = useState(new Map()); // Map of senderId -> count

    const { token, user } = useAuth();

    // Notification Audio
    const notificationSound = new Audio('/notification.mp3');

    useEffect(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Fetch initial unread counts
    const fetchUnreadCounts = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/messages/conversations`, {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                const counts = new Map();
                data.forEach(conv => {
                    if (conv.unreadCount > 0) {
                        counts.set(conv._id, conv.unreadCount);
                    }
                });
                setUnreadCounts(counts);
            }
        } catch (err) {
            console.error('Failed to fetch unread counts', err);
        }
    };

    useEffect(() => {
        let newSocket;
        if (token && user) {
            // Initialize socket
            newSocket = io(API_URL);

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                newSocket.emit('user-online', { token });
                newSocket.emit('join-room', user.id);

                // Fetch unread counts on connect
                fetchUnreadCounts();
            });

            newSocket.on('user-status-change', ({ userId, isOnline, lastSeen }) => {
                setOnlineUsers(prev => {
                    const newMap = new Map(prev);
                    newMap.set(userId, { isOnline, lastSeen });
                    return newMap;
                });
            });

            // Global Message Listener
            newSocket.on('receive-message', (message) => {
                // Play sound
                notificationSound.play().catch(e => console.log('Audio play failed', e));

                // Show notification if hidden
                if (document.hidden && Notification.permission === 'granted') {
                    new Notification('New Message', {
                        body: message.content || 'Sent a media file',
                        icon: '/vite.svg'
                    });
                }

                // Update unread count if it's from someone else
                if (message.sender !== user.id) {
                    setUnreadCounts(prev => {
                        const newMap = new Map(prev);
                        const current = newMap.get(message.sender) || 0;
                        newMap.set(message.sender, current + 1);
                        return newMap;
                    });
                }
            });

            setSocket(newSocket);
        }

        return () => {
            if (newSocket) newSocket.disconnect();
        };
    }, [token, user]);

    const markLocalAsRead = (senderId) => {
        setUnreadCounts(prev => {
            const newMap = new Map(prev);
            newMap.delete(senderId);
            return newMap;
        });
    };

    const value = {
        socket,
        onlineUsers,
        unreadCounts,
        markLocalAsRead,
        totalUnreadCount: Array.from(unreadCounts.values()).reduce((a, b) => a + b, 0)
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
