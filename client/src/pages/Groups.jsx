import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const Groups = () => {
    const [groups, setGroups] = useState([]);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const { token, user } = useAuth();
    const [message, setMessage] = useState('');

    const fetchGroups = async () => {
        try {
            const res = await fetch(`${API_URL}/api/groups`);
            const data = await res.json();
            setGroups(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/groups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ name: newGroupName, description: newGroupDesc })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage('Group created!');
                setNewGroupName('');
                setNewGroupDesc('');
                fetchGroups();
            } else {
                setMessage(data.message);
            }
        } catch (err) {
            setMessage('Error creating group');
        }
    };

    const handleJoinGroup = async (groupId) => {
        try {
            const res = await fetch(`${API_URL} / api / groups / ${groupId} / join`, {
                method: 'POST',
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            alert(data.message);
            // Ideally update local user state or re-fetch groups to show "Joined" status
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <Header />
            <main className="container" style={{ flex: 1, paddingBottom: '3rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '3rem' }}>

                    <div>
                        <div className="card">
                            <h3>Create a Community</h3>
                            {message && <p style={{ color: 'var(--primary-color)' }}>{message}</p>}
                            <form onSubmit={handleCreateGroup}>
                                <div className="input-group">
                                    <label className="label">Group Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="label">Description</label>
                                    <textarea
                                        className="textarea"
                                        value={newGroupDesc}
                                        onChange={(e) => setNewGroupDesc(e.target.value)}
                                    ></textarea>
                                </div>
                                <button className="btn btn-primary" style={{ width: '100%' }}>Create Group</button>
                            </form>
                        </div>
                    </div>

                    <div>
                        <h2 style={{ marginBottom: '1.5rem' }}>Explore Groups</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {groups.map(group => (
                                <div key={group._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ margin: 0 }}>{group.name}</h3>
                                        <p style={{ margin: '0.5rem 0', color: '#94a3b8' }}>{group.description}</p>
                                        <small>{group.members.length} members</small>
                                    </div>
                                    <button
                                        className="btn"
                                        onClick={() => handleJoinGroup(group._id)}
                                        style={{ background: 'rgba(255,255,255,0.1)' }}
                                    >
                                        Join
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </main>
            <Footer />
        </>
    );
};

export default Groups;
