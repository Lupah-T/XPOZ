import { io } from 'socket.io-client';
import { API_URL } from './config';

// Convert HTTP URL to WebSocket URL
const SOCKET_URL = API_URL;

let socket = null;

export const initializeSocket = (token) => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            auth: {
                token
            },
            autoConnect: false
        });

        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket.id);
            // Emit user-online event
            socket.emit('user-online', { token });
        });

        socket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
        });

        socket.on('error', (error) => {
            console.error('[Socket] Error:', error);
        });

        // Listen for user status changes
        socket.on('user-status-change', ({ userId, isOnline, lastSeen }) => {
            console.log(`[Socket] User ${userId} is now ${isOnline ? 'online' : 'offline'}`);
            // Emit custom event for components to listen
            window.dispatchEvent(new CustomEvent('userStatusChange', {
                detail: { userId, isOnline, lastSeen }
            }));
        });
    }

    return socket;
};

export const getSocket = () => {
    if (!socket) {
        throw new Error('Socket not initialized. Call initializeSocket first.');
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
