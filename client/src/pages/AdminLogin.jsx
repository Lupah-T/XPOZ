import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AdminLogin = () => {
    const [formData, setFormData] = useState({ pseudoName: '', password: '' });
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(formData.pseudoName, formData.password);
            // In a real app, we'd check role here or redirect to /admin/dashboard and let the guard hande it
            navigate('/admin/dashboard');
        } catch (err) {
            setError('Invalid credentials or access denied');
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <main className="container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#ef4444' }}>Admin Access</h2>
                    {error && <div style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input
                            type="text"
                            name="pseudoName"
                            placeholder="Admin User"
                            value={formData.pseudoName}
                            onChange={handleChange}
                            required
                            className="input"
                            style={{ borderColor: '#ef4444' }}
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="input"
                            style={{ borderColor: '#ef4444' }}
                        />
                        <button type="submit" className="btn" style={{ background: '#ef4444', color: 'white' }}>Login to System</button>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AdminLogin;
