import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_URL } from '../config';
import CallOverlay from '../components/chat/CallOverlay';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(new Map()); // Map of userId -> status
    const [unreadCounts, setUnreadCounts] = useState(new Map()); // Map of senderId -> count

    // Call State
    const [call, setCall] = useState(null); // { status: 'idle'|'ringing'|'incoming'|'active', type: 'voice'|'video', otherUser: {}, signal: null }
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const peerConnection = useRef(null);

    const { token, user } = useAuth();

    // Notification Audio
    const notificationSound = new Audio('/notification.mp3');

    useEffect(() => {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
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
                if (document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
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

            // Call Listeners
            newSocket.on('incoming-call', ({ from, signal, type }) => {
                // Fetch user info for the overlay (pseudoName, etc)
                // For now, we'll assume we might need to fetch it or it's passed
                // Simplification for this task: assume we can find the user in our contacts or just show ID
                setCall({
                    status: 'incoming',
                    type,
                    otherUser: { _id: from, pseudoName: 'Incoming Caller' },
                    signal
                });
            });

            newSocket.on('call-accepted', async ({ signal }) => {
                if (peerConnection.current) {
                    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
                    setCall(prev => ({ ...prev, status: 'active' }));
                }
            });

            newSocket.on('ice-candidate', async ({ candidate }) => {
                if (peerConnection.current && candidate) {
                    try {
                        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (e) {
                        console.error('Error adding ice candidate', e);
                    }
                }
            });

            newSocket.on('call-rejected', () => {
                cleanupCall();
            });

            newSocket.on('call-ended', () => {
                cleanupCall();
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

    // WebRTC Methods
    const cleanupCall = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        setCall(null);
        setLocalStream(null);
        setRemoteStream(null);
    };

    const startCall = async (otherUser, type) => {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: type === 'video',
            audio: true
        });
        setLocalStream(stream);

        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', { to: otherUser._id, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('call-user', {
            to: otherUser._id,
            from: user.id,
            signal: offer,
            type
        });

        peerConnection.current = pc;
        setCall({ status: 'ringing', type, otherUser });
    };

    const acceptCall = async () => {
        if (!call || !call.signal) return;

        const stream = await navigator.mediaDevices.getUserMedia({
            video: call.type === 'video',
            audio: true
        });
        setLocalStream(stream);

        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', { to: call.otherUser._id, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        await pc.setRemoteDescription(new RTCSessionDescription(call.signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('answer-call', {
            to: call.otherUser._id,
            signal: answer
        });

        peerConnection.current = pc;
        setCall(prev => ({ ...prev, status: 'active' }));
    };

    const rejectCall = () => {
        if (call) {
            socket.emit('reject-call', { to: call.otherUser._id });
            cleanupCall();
        }
    };

    const endCall = () => {
        if (call) {
            socket.emit('end-call', { to: call.otherUser._id });
            cleanupCall();
        }
    };

    const value = {
        socket,
        onlineUsers,
        unreadCounts,
        markLocalAsRead,
        totalUnreadCount: Array.from(unreadCounts.values()).reduce((a, b) => a + b, 0),
        call,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        localStream,
        remoteStream
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
            <CallOverlay
                call={call}
                onAccept={acceptCall}
                onReject={rejectCall}
                onEnd={endCall}
                localStream={localStream}
                remoteStream={remoteStream}
            />
        </SocketContext.Provider>
    );
};
