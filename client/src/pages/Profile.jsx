import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { getMediaUrl } from '../utils/media';

const Profile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, token } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [stats, setStats] = useState({ followers: 0, following: 0 });
    const [editingBio, setEditingBio] = useState(false);
    const [bioText, setBioText] = useState('');

    useEffect(() => {
        fetchProfile();
        fetchPosts();
    }, [id]);

    useEffect(() => {
        if (profileUser && currentUser) {
            setIsFollowing(profileUser.followers.includes(currentUser.id));
            // Also check internal tracking if we just followed
        }
    }, [profileUser, currentUser]);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${API_URL}/api/users/${id}`);
            const data = await res.json();
            setProfileUser(data);
            setBioText(data.bio || '');
            setStats({ followers: data.followers.length, following: data.following.length });
        } catch (err) {
            console.error(err);
        }
    };

    const fetchPosts = async () => {
        try {
            const res = await fetch(`${API_URL}/api/reports?author=${id}`);
            const data = await res.json();
            setPosts(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleFollowToggle = async () => {
        if (!token || !currentUser) return;
        try {
            const res = await fetch(`${API_URL}/api/users/${id}/follow`, {
                method: 'POST',
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();

            setIsFollowing(data.isFollowing);
            setStats(prev => ({
                ...prev,
                followers: data.isFollowing ? prev.followers + 1 : prev.followers - 1
            }));

        } catch (err) {
            console.error(err);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const res = await fetch(`${API_URL}/api/users/${id}/avatar`, {
                method: 'POST',
                headers: { 'x-auth-token': token },
                body: formData
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error('[Profile] Avatar upload failed:', errorText);
                try {
                    const errorJson = JSON.parse(errorText);
                    alert(`Upload failed: ${errorJson.message}`);
                } catch (e) {
                    alert(`Upload failed: Server returned ${res.status}`);
                }
                return;
            }

            const data = await res.json();
            setProfileUser({ ...profileUser, avatarUrl: data.avatarUrl });
            alert('Profile updated!');
        } catch (err) {
            console.error(err);
            alert('Failed to update avatar');
        }
    };

    const handleBioSave = async () => {
        try {
            const res = await fetch(`${API_URL}/api/users/bio`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ bio: bioText })
            });
            const data = await res.json();
            setProfileUser({ ...profileUser, bio: bioText });
            setEditingBio(false);
            alert('Bio updated!');
        } catch (err) {
            console.error(err);
            alert('Failed to update bio');
        }
    };

    if (!profileUser) return <div>Loading...</div>;

    return (
        <>
            <Header />
            <main className="container" style={{ flex: 1, paddingBottom: '3rem', maxWidth: '935px' }}>
                {/* Profile Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', marginBottom: '3rem', padding: '0 2rem' }}>

                    <div style={{ flexShrink: 0 }}>
                        {profileUser.avatarUrl ? (
                            <img src={getMediaUrl(profileUser.avatarUrl)} alt="Avatar" style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'linear-gradient(45deg, #6d28d9, #ec4899)' }}></div>
                        )}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 300 }}>{profileUser.pseudoName}</h2>
                            {currentUser && currentUser.id !== profileUser._id && (
                                <>
                                    <button
                                        className="btn"
                                        onClick={handleFollowToggle}
                                        style={{
                                            padding: '0.4rem 1.2rem',
                                            fontWeight: '600',
                                            background: isFollowing ? 'transparent' : 'var(--primary-color)',
                                            border: isFollowing ? '1px solid var(--text-secondary)' : 'none',
                                            color: isFollowing ? 'var(--text-primary)' : 'white'
                                        }}
                                    >
                                        {isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                    <button
                                        className="btn"
                                        onClick={() => navigate('/messages', {
                                            state: {
                                                userId: profileUser._id,
                                                pseudoName: profileUser.pseudoName,
                                                avatarUrl: profileUser.avatarUrl
                                            }
                                        })}
                                        style={{
                                            padding: '0.4rem 1.2rem',
                                            fontWeight: '600',
                                            background: 'transparent',
                                            border: '1px solid var(--text-secondary)',
                                            color: 'white'
                                        }}
                                    >
                                        Message
                                    </button>
                                </>
                            )}
                            {currentUser && currentUser.id === profileUser._id && (
                                <>
                                    <input
                                        type="file"
                                        id="avatarInput"
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                    />
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => document.getElementById('avatarInput').click()}
                                        style={{
                                            padding: '0.5rem 1.25rem',
                                            fontSize: '0.9rem',
                                            boxShadow: '0 4px 12px rgba(168, 85, 247, 0.4)'
                                        }}
                                    >
                                        📸 Edit Profile
                                    </button>
                                </>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '3rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                            <span><strong>{posts.length}</strong> posts</span>
                            <span><strong>{stats.followers}</strong> followers</span>
                            <span><strong>{stats.following}</strong> following</span>
                        </div>

                        {/* Bio Section */}
                        <div>
                            <div style={{ fontWeight: '600', marginBottom: '0.2rem' }}>{profileUser.pseudoName}</div>
                            <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>@{profileUser.handle}</div>
                            {currentUser && currentUser.id === profileUser._id ? (
                                editingBio ? (
                                    <div>
                                        <textarea
                                            value={bioText}
                                            onChange={(e) => setBioText(e.target.value)}
                                            maxLength={150}
                                            placeholder="Write a short bio..."
                                            className="textarea"
                                            style={{ width: '100%', minHeight: '60px', marginBottom: '0.5rem', fontSize: '16px' }}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                {bioText.length}/150
                                            </span>
                                            <div style={{ gap: '0.5rem', display: 'flex' }}>
                                                <button
                                                    className="btn"
                                                    onClick={() => {
                                                        setBioText(profileUser.bio || '');
                                                        setEditingBio(false);
                                                    }}
                                                    style={{ background: 'transparent', border: '1px solid var(--text-secondary)', padding: '0.4rem 1rem' }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="btn"
                                                    onClick={handleBioSave}
                                                    style={{ background: '#a855f7', padding: '0.4rem 1rem' }}
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>
                                            {profileUser.bio || 'No bio yet'}
                                        </div>
                                        <button
                                            className="btn"
                                            onClick={() => setEditingBio(true)}
                                            style={{
                                                background: 'rgba(168, 85, 247, 0.2)',
                                                border: '1px solid var(--primary)',
                                                color: 'var(--primary)',
                                                padding: '0.4rem 1rem',
                                                fontSize: '0.85rem',
                                                marginTop: '0.5rem'
                                            }}
                                        >
                                            ✏️ Edit Bio
                                        </button>
                                    </div>
                                )
                            ) : (
                                <div style={{ color: '#94a3b8' }}>
                                    {profileUser.bio || 'No bio'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Post Grid - Instagram Style */}
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        {posts.map(post => (
                            <div key={post._id} style={{ aspectRatio: '1/1', background: '#334155', borderRadius: '4px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
                                {post.evidenceType === 'image' ? (
                                    <img src={getMediaUrl(post.evidenceUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : post.evidenceType === 'video' ? (
                                    <video src={getMediaUrl(post.evidenceUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center', color: '#94a3b8', background: 'rgba(255,255,255,0.05)' }}>
                                        {post.title}
                                    </div>
                                )}

                                <div className="overlay" style={{
                                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: '1.5rem', opacity: 0, transition: 'opacity 0.2s'
                                }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                    onMouseLeave={e => e.currentTarget.style.opacity = 0}
                                >
                                    <span style={{ fontWeight: 'bold' }}>❤️ {post.likes.length}</span>
                                    <span style={{ fontWeight: 'bold' }}>💬 {post.comments.length}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </main >

        </>
    );
};

export default Profile;
