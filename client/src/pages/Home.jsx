import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import VideoPlayer from '../components/VideoPlayer';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const Home = () => {
    const [reports, setReports] = useState([]);
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

    const handleDelete = async (reportId) => {
        if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/reports/${reportId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });

            if (res.ok) {
                // Remove the report from state
                setReports(reports.filter(r => r._id !== reportId));
                alert('Post deleted successfully');
            } else {
                const error = await res.json();
                alert(error.message || 'Failed to delete post');
            }
        } catch (err) {
            console.error(err);
            alert('Error deleting post');
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
                        reports.map(report => (
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
                                    {/* Delete Button (only for author) */}
                                    {user && report.author && report.author._id === user.id && (
                                        <button
                                            onClick={() => handleDelete(report._id)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                fontSize: '1.2rem',
                                                padding: '0.25rem 0.5rem'
                                            }}
                                            title="Delete post"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>

                                {/* Media */}
                                <div style={{ width: '100%', background: '#000', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    {report.postType === 'text' ? (
                                        <div style={{
                                            width: '100%',
                                            minHeight: '300px',
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
                                                            src={`${API_URL}/${item.url}`}
                                                            poster={item.thumbnail ? `${API_URL}/${item.thumbnail}` : undefined}
                                                            startTime={item.metadata?.startTime}
                                                            endTime={item.metadata?.endTime}
                                                        />
                                                    ) : (
                                                        <img src={`${API_URL}/${item.url}`} alt="Post content" style={{ width: '100%', height: 'auto', maxHeight: '600px', objectFit: 'contain' }} />
                                                    )}
                                                    {report.media.length > 1 && (
                                                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '12px', fontSize: '0.8rem' }}>
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
                                                <img src={`${API_URL}/${report.evidenceUrl}`} alt="Evidence" style={{ width: '100%', height: 'auto', maxHeight: '600px', objectFit: 'contain' }} />
                                            )}
                                            {report.evidenceType === 'video' && (
                                                <video controls src={`${API_URL}/${report.evidenceUrl}`} style={{ width: '100%', maxHeight: '600px' }} />
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
                        ))
                    )}
                </div>

            </main>
        </>
    );
};

export default Home;
