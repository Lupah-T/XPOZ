import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const Profile = () => {
    const { id } = useParams();
    const { user: currentUser, token } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [stats, setStats] = useState({ followers: 0, following: 0 });

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
            const data = await res.json();
            setProfileUser({ ...profileUser, avatarUrl: data.avatarUrl });
            alert('Profile updated!');
        } catch (err) {
            console.error(err);
            alert('Failed to update avatar');
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
                            <img src={`${API_URL}/${profileUser.avatarUrl}`} alt="Avatar" style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'linear-gradient(45deg, #6d28d9, #ec4899)' }}></div>
                        )}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 300 }}>{profileUser.pseudoName}</h2>
                            {currentUser && currentUser.id !== profileUser._id && (
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
                                        className="btn"
                                        onClick={() => document.getElementById('avatarInput').click()}
                                        style={{ background: 'transparent', border: '1px solid var(--text-secondary)' }}
                                    >
                                        Edit Profile
                                    </button>
                                </>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '3rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                            <span><strong>{posts.length}</strong> posts</span>
                            <span><strong>{stats.followers}</strong> followers</span>
                            <span><strong>{stats.following}</strong> following</span>
                        </div>

                        <div>
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{profileUser.pseudoName}</div>
                            <div style={{ color: '#94a3b8' }}>Member of X-POZ Resistance. Exposure is our currency.</div>
                        </div>
                    </div>
                </div>

                {/* Post Grid - Instagram Style */}
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        {posts.map(post => (
                            <div key={post._id} style={{ aspectRatio: '1/1', background: '#334155', borderRadius: '4px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
                                {post.evidenceType === 'image' ? (
                                    <img src={`${API_URL}/${post.evidenceUrl}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : post.evidenceType === 'video' ? (
                                    <video src={`${API_URL}/${post.evidenceUrl}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

            </main>
            <Footer />
        </>
    );
};

export default Profile;
