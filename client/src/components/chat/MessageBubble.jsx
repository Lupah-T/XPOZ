import React, { useState } from 'react';

const MessageBubble = ({ message, isOwn, previousMessage, onReply, onEdit, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false);

    const showHeader = !previousMessage ||
        previousMessage.sender !== message.sender ||
        new Date(message.createdAt) - new Date(previousMessage.createdAt) > 300000; // 5 min gap

    const isDeleted = message.content === 'This message was deleted';

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setShowMenu(false);
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isOwn ? 'flex-end' : 'flex-start',
                marginBottom: '4px',
                marginTop: showHeader ? '12px' : '0',
                position: 'relative',
                width: '100%'
            }}
            onMouseLeave={() => setShowMenu(false)}
        >
            <div
                style={{
                    maxWidth: '70%',
                    padding: '8px 12px',
                    borderRadius: '16px',
                    // Sent: rounded pill, Received: rounded pill (darker)
                    backgroundColor: isOwn ? '#374151' : '#1e293b',
                    color: '#f8fafc',
                    wordWrap: 'break-word',
                    // Remove shadow for cleaner look
                    boxShadow: 'none',
                    position: 'relative'
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    setShowMenu(!showMenu);
                }}
            >
                {/* Reply Quote */}
                {message.replyTo && (
                    <div style={{
                        borderLeft: '4px solid #a855f7',
                        background: 'rgba(0, 0, 0, 0.2)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        marginBottom: '4px',
                        fontSize: '0.85rem',
                        color: '#cbd5e1'
                    }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#a855f7' }}>
                            Replying to...
                        </div>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {message.replyTo.content || 'Media'}
                        </div>
                    </div>
                )}

                {/* Attachments */}
                {message.attachments && message.attachments.map((att, idx) => (
                    <div key={idx} style={{ marginBottom: message.content ? '8px' : '0' }}>
                        {att.type === 'image' || att.url.match(/\.(jpeg|jpg|gif|png|webp)$/) ? (
                            <img
                                src={att.url}
                                alt="attachment"
                                style={{ maxWidth: '100%', borderRadius: '8px', cursor: 'pointer' }}
                                onClick={() => window.open(att.url, '_blank')}
                            />
                        ) : (
                            <div style={{ position: 'relative' }}>
                                <video
                                    src={att.url}
                                    controls
                                    style={{ maxWidth: '100%', borderRadius: '8px' }}
                                />
                            </div>
                        )}
                    </div>
                ))}

                {/* Content */}
                {message.content && (
                    <div style={{
                        fontSize: '1rem',
                        lineHeight: '1.6',
                        fontStyle: isDeleted ? 'italic' : 'normal',
                        color: isDeleted ? '#94a3b8' : '#f8fafc'
                    }}>
                        {message.content}
                        {message.isEdited && !isDeleted && <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '4px' }}>(edited)</span>}
                    </div>
                )}

                {/* Footer (Time & Ticks) */}
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
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '0.4', fontSize: '0.6rem', marginLeft: '2px' }}>
                            {message.read ? (
                                <>
                                    <span style={{ color: '#a855f7' }}>✓</span>
                                    <span style={{ color: '#a855f7' }}>✓</span>
                                </>
                            ) : message.delivered ? (
                                <>
                                    <span style={{ color: '#94a3b8' }}>✓</span>
                                    <span style={{ color: '#94a3b8' }}>✓</span>
                                </>
                            ) : (
                                <span style={{ color: '#94a3b8', lineHeight: '1' }}>✓</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Context Menu */}
                {showMenu && !isDeleted && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: isOwn ? '0' : 'auto',
                        left: isOwn ? 'auto' : '0',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        zIndex: 10,
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        <button onClick={() => { onReply(message); setShowMenu(false); }} style={menuButtonStyle}>Reply</button>
                        <button onClick={handleCopy} style={menuButtonStyle}>Copy</button>
                        {isOwn && <button onClick={() => { onEdit(message); setShowMenu(false); }} style={menuButtonStyle}>Edit</button>}
                        <button onClick={() => { onDelete(message._id, 'self'); setShowMenu(false); }} style={menuButtonStyle}>Delete for me</button>
                        {isOwn && <button onClick={() => { onDelete(message._id, 'everyone'); setShowMenu(false); }} style={{ ...menuButtonStyle, color: '#ef4444' }}>Delete for everyone</button>}
                    </div>
                )}
            </div>
            {/* Quick action button (3 dots) on hover for desktop could be good, but context menu is sufficient for mobile feel */}
        </div>
    );
};

const menuButtonStyle = {
    display: 'block',
    width: '100%',
    padding: '8px 16px',
    background: 'transparent',
    border: 'none',
    color: '#cbd5e1',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap'
};

export default MessageBubble;
