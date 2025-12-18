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
    const { token, user } = useAuth();

    // Notification Audio (Simple beep)
    // You could replace this with a nice message.mp3 in public/ folder
    const notificationSound = new Audio('/notification.mp3');

    useEffect(() => {
        // Request notification permission
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        let newSocket;
        if (token && user) {
            // Initialize socket
            newSocket = io(API_URL);

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);

                // Authenticate / announce presence
                newSocket.emit('user-online', { token });

                // Join personal room
                newSocket.emit('join-room', user.id);
            });

            newSocket.on('user-status-change', ({ userId, isOnline, lastSeen }) => {
                setOnlineUsers(prev => {
                    const newMap = new Map(prev);
                    newMap.set(userId, { isOnline, lastSeen });
                    return newMap;
                });
            });

            // Global Message Listener for Notifications
            newSocket.on('receive-message', (message) => {
                // Play sound
                notificationSound.play().catch(e => console.log('Audio play failed', e));

                // Show system notification if hidden
                if (document.hidden && Notification.permission === 'granted') {
                    new Notification('New Message', {
                        body: message.content || 'Sent a media file',
                        icon: '/vite.svg' // Placeholder icon
                    });
                }
            });

            setSocket(newSocket);
        }

        return () => {
            if (newSocket) newSocket.disconnect();
        };
    }, [token, user]);

    const value = {
        socket,
        onlineUsers
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
