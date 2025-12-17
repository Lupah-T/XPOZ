import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import VideoPlayer from '../components/VideoPlayer';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const Home = () => {
    const [reports, setReports] = useState([]);
    const [lightboxMedia, setLightboxMedia] = useState(null); // { url, type }
    const { user, token } = useAuth();

    const fetchReports = async () => {
        try {
            const res = await fetch(`${API_URL}/api/reports`);
            const data = await res.json();
            setReports(data);
        } catch (err) {
            console.error("Failed to fetch reports", err);
        }
    };

    useEffect(() => {
        fetchReports();
        // Poll for new reports every 5 seconds for live feel
        const interval = setInterval(fetchReports, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleFollow = async (authorId) => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/users/${authorId}/follow`, {
                method: 'POST',
                headers: {
                    'x-auth-token': token
                }
            });
            const data = await res.json();
            alert(data.message); // Simple feedback for now
        } catch (err) {
            alert('Error following user');
        }
    };

    const handleLike = async (reportId) => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/reports/${reportId}/like`, {
                method: 'POST',
                headers: { 'x-auth-token': token }
            });
            const updatedLikes = await res.json();
            setReports(reports.map(r => r._id === reportId ? { ...r, likes: updatedLikes } : r));
        } catch (err) {
            console.error(err);
        }
    };

    const handleComment = async (reportId, text) => {
        if (!token || !text.trim()) return;
        try {
            const res = await fetch(`${API_URL}/api/reports/${reportId}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ text })
            });
            const updatedComments = await res.json();
            setReports(reports.map(r => r._id === reportId ? { ...r, comments: updatedComments } : r));
        } catch (err) {
            console.error(err);
        }
    };

    const handleReply = async (reportId, commentId, text) => {
        if (!token || !text.trim()) return;
        try {
            // We need a backend route for replies, but for now we will just re-use the comment logic or simple alert 
            // since I added the route in the backend step, let's try to use it if I remember the path.
            // Route: /:id/comment/:commentId/reply
            const res = await fetch(`${API_URL}/api/reports/${reportId}/comment/${commentId}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ text })
            });
            const updatedComments = await res.json();
            setReports(reports.map(r => r._id === reportId ? { ...r, comments: updatedComments } : r));
        } catch (err) {
            console.error(err);
        }
    };

    // Helper to constructing media URLs
    const getMediaUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        // removing leading slash if present to avoid double slashes with API_URL which usually lacks trailing slash, 
        // or ensure join is clean. 
        // Assuming API_URL has no trailing slash.
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return `${API_URL}/${cleanPath}`;
    };

    const handleDelete = async (reportId, isAdminMod = false) => {
        let reason = null;
        if (isAdminMod) {
            // Admin Action: Soft Delete (Moderation)
            reason = prompt('Reason for removing this post (Visible to users):', 'Irrelevant content');
            if (reason === null) return; // Cancelled
        } else {
            // User Action: Hard Delete
            if (!window.confirm('Are you sure you want to delete this post instantly? This action cannot be undone.')) {
                return;
            }
        }

        try {
            let res;
            if (isAdminMod) {
                // Soft Delete (Moderate) via PUT
                res = await fetch(`${API_URL}/api/reports/${reportId}/moderate`, {
                    method: 'PUT',
                    headers: {
                        'x-auth-token': token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ reason })
                });
            } else {
                // Hard Delete via DELETE
                res = await fetch(`${API_URL}/api/reports/${reportId}`, {
                    method: 'DELETE',
                    headers: { 'x-auth-token': token }
                });
            }

            if (res.ok) {
                if (isAdminMod) {
                    const data = await res.json();
                    setReports(reports.map(r => r._id === reportId ? { ...r, status: 'moderated', moderationReason: data.report?.moderationReason || reason } : r));
                    // alert('Post moderated successfully'); // Optional: user saw the update
                } else {
                    setReports(reports.filter(r => r._id !== reportId));
                    alert('Post deleted successfully');
                }
            } else {
                const error = await res.json();
                alert(error.message || 'Failed to delete/moderate post');
            }
        } catch (err) {
            console.error(err);
            alert('Error processing request');
        }
    };

    return (
        <>
            <Header />
            <main className="container" style={{ flex: 1, paddingBottom: '3rem', maxWidth: '600px', margin: '0 auto' }}>

                {/* Stories / Groups Quick Access (Horizontal Scroll) */}
                <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
                    {/* Mock Story Circles */}
                    {['#Vigilantes', '#Nature', '#Traffic', '#Corruption'].map((tag, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', minWidth: '70px', cursor: 'pointer' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(45deg, #eab308, #ef4444)', padding: '2px' }}>
                                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                    {['🛡️', '🌿', '🚗', '💰'][i]}
                                </div>
                            </div>
                            <span style={{ fontSize: '0.75rem' }}>{tag}</span>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {reports.length === 0 ? (
                        <p style={{ textAlign: 'center' }}>No posts yet. <a href="/create">Create one?</a></p>
                    ) : (
                        reports.map(report => {
                            if (report.status === 'moderated') {
                                return (
                                    <div key={report._id} className="card" style={{
                                        padding: '3rem 2rem',
                                        textAlign: 'center',
                                        background: '#fee2e2',
                                        border: '2px solid #ef4444',
                                        borderRadius: '12px',
                                        color: '#b91c1c'
                                    }}>
                                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>Post Removed</h3>
                                        <p style={{ fontSize: '1.2rem', fontWeight: '500' }}>
                                            "{report.moderationReason || 'This post has been removed by the moderators.'}"
                                        </p>
                                        <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
                                            -- Admin Team
                                        </p>
                                    </div>
                                );
                            }

                            return (
                                <div key={report._id} className="card" style={{ padding: '0', overflow: 'hidden', animation: 'fadeIn 0.5s' }}>
                                    {/* Header */}
                                    <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <a href={`/profile/${report.author?._id}`}>
                                                {report.author?.avatarUrl ? (
                                                    <img src={`${API_URL}/${report.author.avatarUrl}`} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#334155' }}></div>
                                                )}
                                            </a>
                                            <div style={{ lineHeight: '1.2' }}>
                                                <a href={`/profile/${report.author?._id}`} style={{ fontWeight: '600', color: 'inherit', textDecoration: 'none' }}>
                                                    {report.author ? report.author.pseudoName : 'Anonymous'}
                                                </a>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{report.location}</div>
                                            </div>
                                        </div>
                                        {/* Delete Button (for author or admin) */}
                                        {user && (report.author?._id === user.id || user.role === 'admin') && (
                                            <button
                                                onClick={() => handleDelete(report._id, user.role === 'admin' && report.author?._id !== user.id)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    fontSize: '1.2rem',
                                                    padding: '0.25rem 0.5rem'
                                                }}
                                                title={user.role === 'admin' ? "Moderate Post" : "Delete Post"}
                                            >
                                                🗑️
                                            </button>
                                        )}    </div>

                                    {/* Media */}
                                    <div style={{ width: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                        {report.postType === 'text' ? (
                                            <div style={{
                                                width: '100%',
                                                minHeight: '200px', // Smaller min-height for short text
                                                background: report.textStyle?.backgroundColor || '#667eea',
                                                color: report.textStyle?.textColor || '#fff',
                                                fontFamily: report.textStyle?.fontFamily || 'Inter',
                                                fontSize: report.textStyle?.fontSize || '24px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '2rem',
                                                textAlign: 'center',
                                                whiteSpace: 'pre-wrap'
                                            }}>
                                                {report.description}
                                            </div>
                                        ) : report.postType === 'media' && report.media && report.media.length > 0 ? (
                                            // Carousel for multiple media
                                            <div style={{ width: '100%', overflowX: 'auto', display: 'flex', scrollSnapType: 'x mandatory' }}>
                                                {report.media.map((item, idx) => (
                                                    <div key={idx} style={{ minWidth: '100%', scrollSnapAlign: 'center', position: 'relative', display: 'flex', justifyContent: 'center' }}>
                                                        {item.type === 'video' ? (
                                                            <VideoPlayer
                                                                src={getMediaUrl(item.url)}
                                                                poster={item.thumbnail ? getMediaUrl(item.thumbnail) : undefined}
                                                                startTime={item.metadata?.startTime}
                                                                endTime={item.metadata?.endTime}
                                                            />
                                                        ) : (
                                                            <img
                                                                src={getMediaUrl(item.url)}
                                                                alt="Post content"
                                                                onClick={() => setLightboxMedia({ url: getMediaUrl(item.url), type: 'image' })}
                                                                style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain', cursor: 'zoom-in' }}
                                                            />
                                                        )}
                                                        {report.media.length > 1 && (
                                                            <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '12px', fontSize: '0.8rem', pointerEvents: 'none' }}>
                                                                {idx + 1}/{report.media.length}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            // Legacy Support
                                            <>
                                                {report.evidenceType === 'image' && (
                                                    <img
                                                        src={getMediaUrl(report.evidenceUrl)}
                                                        alt="Evidence"
                                                        onClick={() => setLightboxMedia({ url: getMediaUrl(report.evidenceUrl), type: 'image' })}
                                                        style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain', cursor: 'zoom-in' }}
                                                    />
                                                )}
                                                {report.evidenceType === 'video' && (
                                                    <video controls src={`${API_URL}/${report.evidenceUrl}`} style={{ width: '100%', maxHeight: '80vh' }} />
                                                )}
                                                {report.evidenceType === 'audio' && (
                                                    <audio controls src={`${API_URL}/${report.evidenceUrl}`} style={{ width: '90%' }} />
                                                )}
                                                {(report.evidenceType === 'none' || (!report.evidenceType && !report.media)) && (
                                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>
                                                        <h3 style={{ marginTop: 0 }}>{report.title}</h3>
                                                        <p>{report.description}</p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <button onClick={() => handleLike(report._id)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: 0 }}>
                                                    {report.likes && report.likes.includes(user?.id) ? '❤️' : '🤍'}
                                                </button>
                                                <button onClick={() => document.getElementById(`comment-${report._id}`).focus()} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: 0 }}>💬</button>
                                                <button style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: 0 }}>🚀</button>
                                            </div>
                                            <button style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: 0 }}>🔖</button>
                                        </div>

                                        <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{report.likes ? report.likes.length : 0} likes</div>

                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: '600', marginRight: '0.5rem' }}>{report.author ? report.author.pseudoName : 'Anon'}</span>
                                            {report.description}
                                        </div>

                                        {/* Comments Section */}
                                        {report.comments && report.comments.length > 0 && (
                                            <div style={{ marginBottom: '1rem' }}>
                                                <div style={{ color: '#94a3b8', fontSize: '0.9rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                                                    View all {report.comments.length} comments
                                                </div>
                                                {report.comments.slice(0, 2).map((comment, idx) => (
                                                    <div key={idx} style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                                                        <span style={{ fontWeight: '600', marginRight: '0.5rem' }}>{comment.pseudoName}</span>
                                                        {comment.text}
                                                        {/* Simple Reply Button */}
                                                        <span
                                                            style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '0.5rem', cursor: 'pointer' }}
                                                            onClick={() => {
                                                                const reply = prompt(`Reply to ${comment.pseudoName}:`);
                                                                if (reply) handleReply(report._id, comment._id, reply);
                                                            }}
                                                        >
                                                            Reply
                                                        </span>
                                                        {/* Show replies if any */}
                                                        {comment.replies && comment.replies.map((r, ri) => (
                                                            <div key={ri} style={{ marginLeft: '1.5rem', marginTop: '0.25rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                                                                <span style={{ fontWeight: '600', marginRight: '0.5rem' }}>{r.pseudoName}</span>
                                                                {r.text}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem' }}>
                                            {new Date(report.timestamp).toLocaleDateString()}
                                        </div>

                                        {/* Add Comment Input */}
                                        <div style={{ display: 'flex', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                                            <button style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', marginRight: '0.5rem', cursor: 'pointer' }}>😀</button>
                                            <input
                                                id={`comment-${report._id}`}
                                                type="text"
                                                placeholder="Add a comment..."
                                                style={{ background: 'transparent', border: 'none', color: '#fff', flex: 1, outline: 'none' }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleComment(report._id, e.target.value);
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />
                                            <button
                                                style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', fontWeight: '600', cursor: 'pointer' }}
                                                onClick={() => {
                                                    const input = document.getElementById(`comment-${report._id}`);
                                                    handleComment(report._id, input.value);
                                                    input.value = '';
                                                }}
                                            >
                                                Post
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

            </main>

            {/* Lightbox Modal */}
            {lightboxMedia && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.95)',
                        zIndex: 99999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'zoom-out'
                    }}
                    onClick={() => setLightboxMedia(null)}
                >
                    <img
                        src={lightboxMedia.url}
                        style={{ maxWidth: '100%', maxHeight: '100vh', objectFit: 'contain' }}
                        alt="Full view"
                    />
                </div>
            )}
        </>
    );
};

export default Home;
