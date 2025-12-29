import React, { useState } from 'react';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import PasswordValidator from '../components/PasswordValidator';

const RecoverPassword = () => {
    const [step, setStep] = useState(1); // 1: Pseudo, 2: Question/Answer
    const [pseudoName, setPseudoName] = useState('');
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const fetchQuestion = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch(`${API_URL}/api/auth/security-question/${pseudoName}`);
            const data = await res.json();
            if (res.ok) {
                setQuestion(data.question);
                setStep(2);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch security question');
        }
    };

    const handleRecover = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch(`${API_URL}/api/auth/recover`, {
                method: 'POST', // Corrected from PUT to POST based on backend route
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pseudoName, securityAnswer: answer, newPassword })
            });
            const data = await res.json();

            if (res.ok) {
                setSuccess('Password reset successfully! Redirecting...');
                setTimeout(() => navigate('/auth'), 2000);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to reset password');
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Recover Access</h2>

                {error && <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                {success && <div style={{ color: '#10b981', marginBottom: '1rem', textAlign: 'center' }}>{success}</div>}

                {step === 1 ? (
                    <form onSubmit={fetchQuestion}>
                        <div className="input-group">
                            <label className="label">Enter your Pseudo-Name</label>
                            <input
                                type="text"
                                className="input"
                                value={pseudoName}
                                onChange={(e) => setPseudoName(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Find Account</button>
                        <button type="button" className="btn" style={{ width: '100%', marginTop: '1rem', background: 'transparent', color: '#94a3b8' }} onClick={() => navigate('/auth')}>Back to Login</button>
                    </form>
                ) : (
                    <form onSubmit={handleRecover}>
                        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="label" style={{ color: '#a855f7' }}>Security Question:</label>
                            <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>{question}</div>
                        </div>

                        <div className="input-group">
                            <label className="label">Your Answer</label>
                            <input
                                type="text"
                                className="input"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="label">New Password</label>
                            <input
                                type="password"
                                className="input"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <PasswordValidator password={newPassword} />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Reset Password</button>
                        <button type="button" className="btn" style={{ width: '100%', marginTop: '1rem', background: 'transparent', color: '#94a3b8' }} onClick={() => setStep(1)}>Back</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default RecoverPassword;
