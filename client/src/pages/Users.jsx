import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import Header from '../components/Header';

// Helper function to get the correct media URL
const getMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_URL}/${url}`;
};

const Users = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const { token, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = users.filter(u =>
                u.pseudoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (u.bio && u.bio.toLowerCase().includes(searchQuery.toLowerCase()))
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(users);
        }
    }, [searchQuery, users]);

    const fetchUsers = async () => {
        try {
            console.log('[Users] Fetching users from:', `${API_URL}/api/users/all/users`);
            console.log('[Users] Token:', token ? 'Present' : 'Missing');

            const res = await fetch(`${API_URL}/api/users/all/users`, {
                headers: { 'x-auth-token': token }
            });

            console.log('[Users] Response status:', res.status);

            if (!res.ok) {
                const errorText = await res.text();
                console.error('[Users] Error response:', errorText);
                setLoading(false);
                return;
            }

            const data = await res.json();
            console.log('[Users] Received users:', data.length, 'users');
            console.log('[Users] Users data:', data);

            setUsers(data);
            setFilteredUsers(data);
            setLoading(false);
        } catch (err) {
            console.error('[Users] Fetch error:', err);
            setLoading(false);
        }
    };

    const handleFollow = async (userId) => {
        try {
            const res = await fetch(`${API_URL}/api/users/${userId}/follow`, {
                method: 'POST',
                headers: { 'x-auth-token': token }
            });

            if (res.ok) {
                // Update local state
                setUsers(users.map(u =>
                    u._id === userId
                        ? { ...u, followers: [...u.followers, user.id] }
                        : u
                ));
            } else {
                const error = await res.json();
                alert(error.message);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleUnfollow = async (userId) => {
        try {
            const res = await fetch(`${API_URL}/api/users/${userId}/unfollow`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });

            if (res.ok) {
                // Update local state
                setUsers(users.map(u =>
                    u._id === userId
                        ? { ...u, followers: u.followers.filter(id => id !== user.id) }
                        : u
                ));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const isFollowing = (targetUser) => {
        return targetUser.followers && targetUser.followers.includes(user?.id);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />

            <main style={{ flex: 1, maxWidth: '800px', margin: '0 auto', width: '100%', paddingBottom: '80px' }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem 1rem',
                    borderBottom: '1px solid var(--glass-border)',
                    background: 'var(--glass-bg)'
                }}>
                    <h1 style={{ margin: '0 0 1rem 0', fontSize: '1.75rem' }}>Discover Users</h1>

                    {/* Search Bar */}
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="🔍 Search users..."
                        className="input"
                        style={{ width: '100%', fontSize: '16px' }}
                    />
                </div>

                {/* User List */}
                <div>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                            Loading users...
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                            <h3 style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>
                                {searchQuery ? 'No users found' : 'No users yet'}
                            </h3>
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                {searchQuery ? 'Try a different search' : 'Be the first to connect!'}
                            </p>
                        </div>
                    ) : (
                        filteredUsers.map((targetUser) => (
                            <div
                                key={targetUser._id}
                                style={{
                                    padding: '1.25rem',
                                    borderBottom: '1px solid var(--glass-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                onClick={() => navigate(`/profile/${targetUser._id}`)}
                            >
                                {/* Avatar */}
                                <div style={{ position: 'relative' }}>
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                        overflow: 'hidden',
                                        flexShrink: 0
                                    }}>
                                        {targetUser.avatarUrl ? (
                                            <img src={getMediaUrl(targetUser.avatarUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            '👤'
                                        )}
                                    </div>
                                    {/* Online status */}
                                    {targetUser.isOnline && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '2px',
                                            right: '2px',
                                            width: '14px',
                                            height: '14px',
                                            borderRadius: '50%',
                                            background: '#10b981',
                                            border: '2px solid var(--bg-color)'
                                        }} />
                                    )}
                                </div>

                                {/* User Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <h3 style={{
                                            margin: 0,
                                            fontSize: '1.05rem',
                                            fontWeight: '600',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {targetUser.pseudoName}
                                        </h3>
                                        {targetUser.handle && <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>@{targetUser.handle}</span>}
                                        {!targetUser.isOnline && targetUser.lastSeen && (
                                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                                {new Date(targetUser.lastSeen).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                    </div>

                                    {targetUser.bio && (
                                        <p style={{
                                            margin: '0 0 0.25rem 0',
                                            fontSize: '0.9rem',
                                            color: '#94a3b8',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {targetUser.bio}
                                        </p>
                                    )}

                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                        {targetUser.followers?.length || 0} followers · {targetUser.following?.length || 0} following
                                    </div>
                                </div>

                                {/* Follow Button */}
                                {isFollowing(targetUser) ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleUnfollow(targetUser._id);
                                        }}
                                        className="btn"
                                        style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            padding: '0.5rem 1.25rem',
                                            fontSize: '0.9rem',
                                            border: '1px solid rgba(255,255,255,0.2)'
                                        }}
                                    >
                                        Following
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleFollow(targetUser._id);
                                        }}
                                        className="btn"
                                        style={{
                                            background: '#a855f7',
                                            padding: '0.5rem 1.25rem',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        Follow
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
};

export default Users;
