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
