import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const AnnouncementModal = ({ onClose }) => {
    const { user, token } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    // Admin Create State
    const [showCreate, setShowCreate] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'info',
        externalLink: ''
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch(`${API_URL}/api/announcements`);
            const data = await res.json();
            setAnnouncements(data);
        } catch (err) {
            console.error('Error fetching announcements:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) return;

        try {
            await fetch(`${API_URL}/api/announcements/${id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
            setAnnouncements(prev => prev.filter(a => a._id !== id));
        } catch (err) {
            console.error('Error deleting:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('content', formData.content);
            data.append('type', formData.type);
            if (formData.externalLink) data.append('externalLink', formData.externalLink);
            if (formData.version) data.append('version', formData.version);
            if (formData.file) data.append('file', formData.file);

            const res = await fetch(`${API_URL}/api/announcements`, {
                method: 'POST',
                headers: {
                    'x-auth-token': token
                    // Content-Type must be undefined for FormData to set boundary
                },
                body: data
            });

            if (res.ok) {
                const newAnnouncement = await res.json();
                setAnnouncements([newAnnouncement, ...announcements]);
                setShowCreate(false);
                setFormData({ title: '', content: '', type: 'info', externalLink: '', version: '', file: null });
            } else {
                alert('Failed to create announcement');
            }
        } catch (err) {
            console.error(err);
            alert('Error creating announcement');
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
        }} onClick={onClose}>
            <div style={{
                background: '#1e293b',
                width: '100%',
                maxWidth: '600px',
                borderRadius: '12px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#0f172a'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>📢 Announcements</h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
                    >
                        &times;
                    </button>
                </div>

                {/* Content */}
                <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>

                    {/* Admin Actions */}
                    {user && user.role === 'admin' && (
                        <div style={{ marginBottom: '2rem' }}>
                            {!showCreate ? (
                                <button
                                    className="btn"
                                    onClick={() => setShowCreate(true)}
                                    style={{
                                        background: '#a855f7',
                                        color: 'white',
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    + New Announcement
                                </button>
                            ) : (
                                <form onSubmit={handleSubmit} style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <h4 style={{ margin: '0 0 1rem 0' }}>Create New Announcement</h4>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <input
                                            type="text"
                                            placeholder="Title"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: '#0f172a',
                                                border: '1px solid #334155',
                                                color: 'white',
                                                borderRadius: '6px'
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <select
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: '#0f172a',
                                                border: '1px solid #334155',
                                                color: 'white',
                                                borderRadius: '6px'
                                            }}
                                        >
                                            <option value="info">ℹ️ Info</option>
                                            <option value="alert">⚠️ Alert</option>
                                            <option value="success">✅ Success</option>
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <textarea
                                            placeholder="Message content..."
                                            value={formData.content}
                                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                                            required
                                            rows="3"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: '#0f172a',
                                                border: '1px solid #334155',
                                                color: 'white',
                                                borderRadius: '6px',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>Attachment (APK/Image)</label>
                                            <input
                                                type="file"
                                                onChange={e => setFormData({ ...formData, file: e.target.files[0] })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem',
                                                    background: '#0f172a',
                                                    border: '1px solid #334155',
                                                    color: 'white',
                                                    borderRadius: '6px'
                                                }}
                                            />
                                        </div>
                                        <div style={{ width: '120px' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>Version (e.g 1.4)</label>
                                            <input
                                                type="text"
                                                placeholder="v1.0"
                                                value={formData.version || ''}
                                                onChange={e => setFormData({ ...formData, version: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    background: '#0f172a',
                                                    border: '1px solid #334155',
                                                    color: 'white',
                                                    borderRadius: '6px'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <input
                                            type="url"
                                            placeholder="External Link (optional, e.g. for updates)"
                                            value={formData.externalLink}
                                            onChange={e => setFormData({ ...formData, externalLink: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: '#0f172a',
                                                border: '1px solid #334155',
                                                color: 'white',
                                                borderRadius: '6px'
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            type="submit"
                                            className="btn"
                                            style={{
                                                flex: 1,
                                                background: '#a855f7',
                                                color: 'white',
                                                padding: '0.5rem',
                                                borderRadius: '6px',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Post
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowCreate(false)}
                                            className="btn"
                                            style={{
                                                background: 'transparent',
                                                color: '#94a3b8',
                                                padding: '0.5rem',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* List */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading...</div>
                    ) : announcements.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                            No announcements yet
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {announcements.map(announcement => (
                                <div key={announcement._id} style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        padding: '1rem',
                                        borderLeft: `4px solid ${announcement.type === 'alert' ? '#ef4444' :
                                            announcement.type === 'success' ? '#10b981' :
                                                '#3b82f6'
                                            }`
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>
                                                {announcement.type === 'alert' && '⚠️ '}
                                                {announcement.type === 'success' && '✅ '}
                                                {announcement.type === 'info' && 'ℹ️ '}
                                                {announcement.title}
                                            </h3>
                                            {user && user.role === 'admin' && (
                                                <button
                                                    onClick={() => handleDelete(announcement._id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#ef4444',
                                                        cursor: 'pointer',
                                                        opacity: 0.7,
                                                        padding: '0.25rem'
                                                    }}
                                                    title="Delete Announcement"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                        <p style={{ margin: '0 0 1rem 0', color: '#cbd5e1', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                                            {announcement.content}
                                        </p>

                                        {announcement.attachment && (
                                            <div style={{ marginBottom: '1rem' }}>
                                                <a
                                                    href={announcement.attachment.url} // Cloudinary URL
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        background: announcement.attachment.type === 'apk' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.1)',
                                                        color: 'white',
                                                        padding: '0.75rem 1.2rem',
                                                        borderRadius: '8px',
                                                        textDecoration: 'none',
                                                        fontWeight: '600',
                                                        fontSize: '0.95rem',
                                                        border: announcement.attachment.type === 'apk' ? 'none' : '1px solid rgba(255,255,255,0.2)'
                                                    }}
                                                >
                                                    {announcement.attachment.type === 'apk' ? '🚀 Install Update' : '📎 Download Attachment'}
                                                    {announcement.version && <span style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', marginLeft: '5px' }}>v{announcement.version}</span>}
                                                </a>
                                            </div>
                                        )}

                                        {announcement.externalLink && (
                                            <a
                                                href={announcement.externalLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'inline-block',
                                                    background: 'var(--primary)',
                                                    color: 'white',
                                                    padding: '0.6rem 1.2rem',
                                                    borderRadius: '8px',
                                                    textDecoration: 'none',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '700',
                                                    marginBottom: '1rem',
                                                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                                                }}
                                            >
                                                🔗 Learn More
                                            </a>
                                        )}
                                        <small style={{ color: '#64748b' }}>
                                            Posted by {announcement.author?.pseudoName || 'Admin'} • {new Date(announcement.createdAt).toLocaleDateString()}
                                        </small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnnouncementModal;
