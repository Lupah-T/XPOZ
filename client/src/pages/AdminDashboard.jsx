import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { token, user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ users: 0, reports: 0, groups: 0 });
    const [users, setUsers] = useState([]);
    const [reports, setReports] = useState([]); // If we add report management later
    const [activeTab, setActiveTab] = useState('users');

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            // Check role or redirect? The API will fail anyway.
            // But better UX to redirect.
            // For now, let's assume if the API fails with 403, we redirect.
        }
        fetchStats();
        fetchUsers();
        fetchReports();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/stats', {
                headers: { 'x-auth-token': token }
            });
            if (res.status === 403) return navigate('/admin/login');
            const data = await res.json();
            setStats(data);
        } catch (err) { console.error(err); }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/users', {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            setUsers(data);
        } catch (err) { console.error(err); }
    };

    const fetchReports = async () => {
        try {
            // Reusing the public reports route but filtering? Or new specific admin route?
            // "GET /api/reports" returns all reports sorted by time, which is fine for now.
            // But we might want 'flagged' or 'all' without limits.
            // Let's use the public one for now, or create a specific one if needed.
            // Actually, let's create a specific one to ensure we get ALL reports efficiently or reuse existing if pagination fits.
            // For now, reuse public GET /api/reports
            const res = await fetch('http://localhost:5000/api/reports', {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            setReports(data);
        } catch (err) { console.error(err); }
    };

    const handleFreeze = async (userId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/freeze`, {
                method: 'PUT',
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            setUsers(users.map(u => u._id === userId ? { ...u, isActive: data.isActive } : u));
        } catch (err) { console.error(err); }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure? This deletes the user and ALL their reports.')) return;
        try {
            await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
            setUsers(users.filter(u => u._id !== userId));
        } catch (err) { console.error(err); }
    };

    const handleDeleteReport = async (reportId) => {
        if (!window.confirm('Delete this report permanently?')) return;
        try {
            await fetch(`http://localhost:5000/api/admin/reports/${reportId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
            setReports(reports.filter(r => r._id !== reportId));
            setStats({ ...stats, reports: stats.reports - 1 });
        } catch (err) { console.error(err); }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header user={user} />
            <main className="container" style={{ flex: 1, paddingBottom: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ color: '#ef4444' }}>Admin Dashboard</h1>
                    <button onClick={logout} className="btn" style={{ background: '#334155' }}>Logout</button>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                    <div className="card" style={{ textAlign: 'center', borderTop: '4px solid #3b82f6' }}>
                        <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stats.users}</h3>
                        <div style={{ color: '#94a3b8' }}>Total Users</div>
                    </div>
                    <div className="card" style={{ textAlign: 'center', borderTop: '4px solid #ef4444' }}>
                        <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stats.reports}</h3>
                        <div style={{ color: '#94a3b8' }}>Total Reports</div>
                    </div>
                    <div className="card" style={{ textAlign: 'center', borderTop: '4px solid #10b981' }}>
                        <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stats.groups}</h3>
                        <div style={{ color: '#94a3b8' }}>Active Groups</div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <button
                        onClick={() => setActiveTab('users')}
                        style={{ padding: '0.5rem 1rem', background: 'transparent', border: 'none', color: activeTab === 'users' ? '#fff' : '#94a3b8', borderBottom: activeTab === 'users' ? '2px solid #ef4444' : 'none', cursor: 'pointer' }}
                    >
                        User Management
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        style={{ padding: '0.5rem 1rem', background: 'transparent', border: 'none', color: activeTab === 'reports' ? '#fff' : '#94a3b8', borderBottom: activeTab === 'reports' ? '2px solid #ef4444' : 'none', cursor: 'pointer' }}
                    >
                        Report Moderation
                    </button>
                </div>

                {/* User Table */}
                {activeTab === 'users' && (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>User</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Role</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 'bold' }}>{u.pseudoName}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ID: {u._id}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', background: u.role === 'admin' ? '#ef4444' : '#3b82f6', fontSize: '0.75rem' }}>{u.role.toUpperCase()}</span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {u.isActive ? <span style={{ color: '#10b981' }}>Active</span> : <span style={{ color: '#ef4444' }}>Frozen</span>}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleFreeze(u._id)}
                                                style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #94a3b8', background: 'transparent', color: '#fff', cursor: 'pointer' }}
                                            >
                                                {u.isActive ? 'Freeze' : 'Activate'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(u._id)}
                                                style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #ef4444', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer' }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Reports Table */}
                {activeTab === 'reports' && (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Report</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Author</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map(r => (
                                    <tr key={r._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 'bold' }}>{r.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{r.description?.substring(0, 50)}...</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ fontSize: '0.9rem' }}>{r.author?.pseudoName || 'Anonymous'}</span>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                                            {new Date(r.timestamp).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleDeleteReport(r._id)}
                                                style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #ef4444', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer' }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </main>
            <Footer />
        </div>
    );
};

export default AdminDashboard;
