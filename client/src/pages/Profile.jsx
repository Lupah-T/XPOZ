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
            <main className="container" style={{ flex: 1, maxWidth: '935px', paddingTop: '1rem' }}>
                {/* Profile Header */}
                {/* Profile Header */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '3rem 1.5rem',
                    textAlign: 'center',
                    background: 'var(--surface)',
                    borderRadius: '24px',
                    border: '1px solid var(--glass-stroke)',
                    marginBottom: '3rem',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                }}>
                    {/* Avatar at Top */}
                    <div style={{
                        position: 'relative',
                        marginBottom: '1.5rem'
                    }}>
                        {profileUser.avatarUrl ? (
                            <img
                                src={getMediaUrl(profileUser.avatarUrl)}
                                alt="Avatar"
                                style={{
                                    width: '160px',
                                    height: '160px',
                                    borderRadius: '80px', // Circular
                                    objectFit: 'cover',
                                    border: '4px solid var(--primary)',
                                    boxShadow: '0 8px 30px rgba(139, 92, 246, 0.4)'
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '160px',
                                height: '160px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--primary), #ec4899)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '4rem'
                            }}>
                                {profileUser.pseudoName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        {/* Status Indicator inside avatar area or right below? Let's put it on the avatar */}
                        {profileUser.isOnline && (
                            <div style={{
                                position: 'absolute',
                                bottom: '10px',
                                right: '10px',
                                width: '24px',
                                height: '24px',
                                backgroundColor: '#22c55e',
                                borderRadius: '50%',
                                border: '4px solid var(--surface)',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                            }} />
                        )}
                    </div>

                    {/* Content Below */}
                    <div style={{ maxWidth: '600px', width: '100%' }}>
                        <h1 style={{
                            margin: '0 0 0.5rem 0',
                            fontSize: '2.5rem',
                            fontWeight: '800',
                            letterSpacing: '-1px'
                        }}>
                            {profileUser.pseudoName}
                        </h1>
                        <div style={{
                            fontSize: '1.1rem',
                            color: 'var(--primary)',
                            fontWeight: '600',
                            marginBottom: '1.5rem'
                        }}>
                            @{profileUser.handle}
                        </div>

                        {/* Action Buttons */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '1rem',
                            marginBottom: '2rem'
                        }}>
                            {currentUser && currentUser.id !== profileUser._id && (
                                <>
                                    <button
                                        onClick={handleFollowToggle}
                                        style={{
                                            padding: '0.8rem 2.5rem',
                                            fontWeight: '700',
                                            background: isFollowing ? 'transparent' : 'var(--primary)',
                                            border: isFollowing ? '2px solid var(--glass-stroke)' : 'none',
                                            color: 'white',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                    <button
                                        onClick={() => navigate('/messages', {
                                            state: {
                                                userId: profileUser._id,
                                                pseudoName: profileUser.pseudoName,
                                                avatarUrl: profileUser.avatarUrl
                                            }
                                        })}
                                        style={{
                                            padding: '0.8rem 2.5rem',
                                            fontWeight: '700',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '2px solid var(--glass-stroke)',
                                            color: 'white',
                                            borderRadius: '12px',
                                            cursor: 'pointer'
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
                                            padding: '0.8rem 2.5rem',
                                            fontSize: '1rem',
                                            fontWeight: '700',
                                            borderRadius: '12px',
                                            background: 'var(--primary)',
                                            boxShadow: '0 8px 20px rgba(139, 92, 246, 0.4)'
                                        }}
                                    >
                                        📸 Edit Profile
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Stats Panel */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            marginBottom: '2rem',
                            border: '1px solid var(--glass-stroke)'
                        }}>
                            <div>
                                <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{posts.length}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Posts</div>
                            </div>
                            <div style={{ borderLeft: '1px solid var(--glass-stroke)', borderRight: '1px solid var(--glass-stroke)' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{stats.followers}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Followers</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{stats.following}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Following</div>
                            </div>
                        </div>

                        {/* Bio / Description */}
                        <div style={{ padding: '0 1rem' }}>
                            {currentUser && currentUser.id === profileUser._id ? (
                                editingBio ? (
                                    <div style={{ textAlign: 'left' }}>
                                        <textarea
                                            value={bioText}
                                            onChange={(e) => setBioText(e.target.value)}
                                            maxLength={150}
                                            placeholder="Introduce yourself..."
                                            style={{
                                                width: '100%',
                                                minHeight: '100px',
                                                padding: '1rem',
                                                background: 'rgba(0,0,0,0.2)',
                                                border: '1px solid var(--primary)',
                                                borderRadius: '12px',
                                                color: 'white',
                                                fontSize: '1rem',
                                                resize: 'none',
                                                outline: 'none',
                                                marginBottom: '0.5rem'
                                            }}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {bioText.length}/150
                                            </span>
                                            <div style={{ gap: '0.5rem', display: 'flex' }}>
                                                <button
                                                    onClick={() => setEditingBio(false)}
                                                    style={{ background: 'transparent', border: '1px solid var(--glass-stroke)', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleBioSave}
                                                    style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                                                >
                                                    Save Changes
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <p style={{
                                            color: '#cbd5e1',
                                            fontSize: '1.1rem',
                                            lineHeight: '1.6',
                                            margin: '0 0 1.5rem 0',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {profileUser.bio || 'Your story starts here... click edit to add a bio.'}
                                        </p>
                                        <button
                                            onClick={() => setEditingBio(true)}
                                            style={{
                                                background: 'rgba(139, 92, 246, 0.1)',
                                                border: '1px solid var(--primary)',
                                                color: 'var(--primary)',
                                                padding: '0.6rem 1.5rem',
                                                borderRadius: '10px',
                                                fontSize: '0.9rem',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'white'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'; e.currentTarget.style.color = 'var(--primary)'; }}
                                        >
                                            ✏️ Update Bio
                                        </button>
                                    </div>
                                )
                            ) : (
                                <p style={{
                                    color: '#cbd5e1',
                                    fontSize: '1.1rem',
                                    lineHeight: '1.6',
                                    margin: 0,
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {profileUser.bio || 'No bio available.'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Post Grid - Instagram Style */}
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        {posts.map(post => (
                            <div key={post._id} style={{ aspectRatio: '1/1', background: '#334155', borderRadius: '4px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
                                {/* Multi-media/Single-media preview */}
                                {(post.postType === 'media' || post.postType === 'mixed' || post.evidenceType === 'image' || post.evidenceType === 'video') ? (
                                    <>
                                        {/* Determine which URL to show */}
                                        {post.media && post.media.length > 0 ? (
                                            post.media[0].type === 'image' ? (
                                                <img src={getMediaUrl(post.media[0].url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <video src={getMediaUrl(post.media[0].url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            )
                                        ) : (
                                            post.evidenceType === 'image' ? (
                                                <img src={getMediaUrl(post.evidenceUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <video src={getMediaUrl(post.evidenceUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            )
                                        )}
                                        {post.media && post.media.length > 1 && (
                                            <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                                                📁 {post.media.length}
                                            </div>
                                        )}
                                    </>
                                ) : post.postType === 'text' ? (
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        background: post.textStyle?.backgroundColor || '#667eea',
                                        color: post.textStyle?.textColor || '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '0.5rem',
                                        fontSize: '0.6rem', // Scaled down for thumbnail
                                        textAlign: 'center',
                                        fontWeight: '600',
                                        fontFamily: post.textStyle?.fontFamily || 'Inter',
                                        overflow: 'hidden'
                                    }}>
                                        {post.description}
                                    </div>
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem' }}>
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
