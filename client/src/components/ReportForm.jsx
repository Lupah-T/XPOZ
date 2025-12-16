import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const ReportForm = () => {
    const { token, user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        category: 'Infrastructure',
        location: '',
        description: ''
    });
    const [evidence, setEvidence] = useState(null);
    const [status, setStatus] = useState(null); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setEvidence(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        const data = new FormData();
        data.append('title', formData.title);
        data.append('category', formData.category);
        data.append('location', formData.location);
        data.append('description', formData.description);
        if (evidence) {
            data.append('evidence', evidence);
        }

        try {
            const response = await fetch(`${API_URL}/api/reports`, {
                method: 'POST',
                headers: {
                    'x-auth-token': token
                },
                // Content-Type header is automatically set by browser for FormData
                body: data
            });

            if (!response.ok) {
                throw new Error('Failed to submit report');
            }

            setStatus('success');
            setMessage('Report submitted successfully! Your voice has been heard.');
            setFormData({
                title: '',
                category: 'Infrastructure',
                location: '',
                description: ''
            });
            setEvidence(null);
            // Reset file input manually if needed, or rely on form reset
            e.target.reset();
        } catch (err) {
            setStatus('error');
            setMessage('Error submitting report: ' + err.message);
        }
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Post an Exposure</h2>
                {user && <span style={{ color: 'var(--primary-color)', fontSize: '0.9rem' }}>Posting as <strong>{user.pseudoName}</strong></span>}
            </div>
            <p style={{ marginBottom: '2rem' }}>
                Share views, ideas, or expose bad actors.
            </p>

            {status === 'success' && (
                <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid currentColor' }}>
                    {message}
                </div>
            )}

            {status === 'error' && (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid currentColor' }}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label className="label" htmlFor="title">Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        className="input"
                        placeholder="e.g., Pothole on Main St"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="input-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label className="label" htmlFor="category">Category</label>
                        <select
                            id="category"
                            name="category"
                            className="select"
                            value={formData.category}
                            onChange={handleChange}
                        >
                            <option value="Infrastructure">Infrastructure</option>
                            <option value="Utility">Utility</option>
                            <option value="Safety">Safety</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="label" htmlFor="location">Location</label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            className="input"
                            placeholder="e.g., 123 4th Ave"
                            value={formData.location}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="input-group">
                    <label className="label" htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        className="textarea"
                        placeholder="Describe the issue in detail..."
                        value={formData.description}
                        onChange={handleChange}
                        required
                    ></textarea>
                </div>

                <div className="input-group">
                    <label className="label" htmlFor="evidence">Attach Evidence (Optional)</label>
                    <input
                        type="file"
                        id="evidence"
                        name="evidence"
                        className="input"
                        accept="image/*,video/*,audio/*"
                        onChange={handleFileChange}
                        style={{ padding: '0.5rem' }}
                    />
                    <small style={{ color: 'var(--text-secondary)' }}>Supported: Images, Video, Audio</small>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={status === 'loading'}>
                    {status === 'loading' ? 'Submitting...' : 'Submit Report'}
                </button>
            </form>
        </div>
    );
};

export default ReportForm;
