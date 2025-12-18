import React from 'react';

const MessageBubble = ({ message, isOwn, previousMessage }) => {
    const showHeader = !previousMessage ||
        previousMessage.sender !== message.sender ||
        new Date(message.createdAt) - new Date(previousMessage.createdAt) > 300000; // 5 min gap

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: isOwn ? 'flex-end' : 'flex-start',
            marginBottom: '4px',
            marginTop: showHeader ? '12px' : '0'
        }}>
            <div style={{
                maxWidth: '70%',
                padding: '8px 12px',
                borderRadius: '16px',
                // Sent: rounded pill, Received: no bubble (transparent)
                backgroundColor: isOwn ? '#374151' : 'transparent',
                color: '#f8fafc',
                wordWrap: 'break-word',
                // Remove shadow for cleaner look
                boxShadow: 'none'
            }}>
                <div style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                    {message.content}
                </div>
                <div style={{
                    fontSize: '0.7rem',
                    color: isOwn ? 'rgba(255,255,255,0.7)' : '#94a3b8',
                    textAlign: 'right',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '4px'
                }}>
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isOwn && (
                        <span style={{ marginLeft: '4px', fontSize: '0.8rem' }}>
                            {message.read ? (
                                <span style={{ color: '#a855f7' }}>✓✓</span> // Purple double tick
                            ) : message.delivered ? (
                                <span style={{ color: '#94a3b8' }}>✓✓</span> // Grey double tick
                            ) : (
                                <span style={{ color: '#94a3b8' }}>✓</span> // Grey single tick
                            )}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
