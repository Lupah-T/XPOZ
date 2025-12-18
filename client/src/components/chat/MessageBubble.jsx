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
                borderTopRightRadius: isOwn ? '4px' : '16px',
                borderTopLeftRadius: isOwn ? '16px' : '4px',
                backgroundColor: isOwn ? '#a855f7' : '#334155',
                color: '#f8fafc',
                wordWrap: 'break-word',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
                <div style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
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
                        <span>
                            {message.read ? '✓✓' : '✓'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
