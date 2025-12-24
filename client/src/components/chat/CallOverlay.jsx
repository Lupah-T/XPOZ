import React, { useState, useEffect, useRef } from 'react';

const CallOverlay = ({ call, onAccept, onReject, onEnd, localStream, remoteStream, isUserOnline }) => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    if (!call) return null;

    const isIncoming = call.status === 'incoming';
    const isActive = call.status === 'active';
    const isRinging = call.status === 'ringing';

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(2, 6, 23, 0.95)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            backdropFilter: 'blur(20px)',
            animation: 'fadeIn 0.3s ease'
        }}>
            {/* Header Info */}
            <div style={{ textAlign: 'center', marginBottom: '2rem', animation: 'fadeInDown 0.5s ease' }}>
                <div style={{
                    width: '120px', height: '120px', borderRadius: '50%',
                    background: 'linear-gradient(45deg, var(--primary), #ec4899)',
                    margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '3rem', boxShadow: '0 0 30px var(--primary-glow)'
                }}>
                    👤
                </div>
                <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '700' }}>{call.otherUser?.pseudoName || 'User'}</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
                    {isIncoming ? 'Incoming Call...' : isRinging ? (isUserOnline ? 'Ringing...' : 'Calling...') : 'Active Call'}
                </p>
            </div>

            {/* Video Area */}
            {call.type === 'video' && (
                <div style={{ position: 'relative', width: '90%', maxWidth: '800px', aspectRatio: '16/9', background: '#0f172a', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--glass-stroke)', marginBottom: '2rem' }}>
                    {/* Remote Video */}
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {/* Local Video - PiP style */}
                    <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '160px', aspectRatio: '16/9', background: '#1e293b', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--primary)', boxShadow: '0 8px 16px rgba(0,0,0,0.5)' }}>
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                </div>
            )}

            {/* Call Controls */}
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                {isIncoming ? (
                    <>
                        <button
                            onClick={onReject}
                            style={{ width: '70px', height: '70px', borderRadius: '50%', border: 'none', background: '#ef4444', color: 'white', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 15px rgba(239, 68, 68, 0.3)' }}
                        >
                            ✖
                        </button>
                        <button
                            onClick={onAccept}
                            style={{ width: '70px', height: '70px', borderRadius: '50%', border: 'none', background: '#22c55e', color: 'white', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 15px rgba(34, 197, 94, 0.3)', animation: 'pulse-glow 1.5s infinite' }}
                        >
                            📞
                        </button>
                    </>
                ) : (
                    <button
                        onClick={onEnd}
                        style={{ width: '70px', height: '70px', borderRadius: '50%', border: 'none', background: '#ef4444', color: 'white', fontSize: '1.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 15px rgba(239, 68, 68, 0.3)' }}
                    >
                        📵
                    </button>
                )}
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse-glow {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
                    70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                }
            `}</style>
        </div>
    );
};

export default CallOverlay;
