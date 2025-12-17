import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [pseudoName, setPseudoName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const [securityQuestion, setSecurityQuestion] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await login(pseudoName, password);
            } else {
                await register(pseudoName, password, { securityQuestion, securityAnswer });
            }
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    {isLogin ? 'Login to X-POZ' : 'Join the Resistance'}
                </h2>

                {error && <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="label">Pseudo-Name</label>
                        <input
                            type="text"
                            className="input"
                            value={pseudoName}
                            onChange={(e) => setPseudoName(e.target.value)}
                            placeholder="e.g. NeonGhost"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="label">Password</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {!isLogin && (
                        <>
                            <div className="input-group">
                                <label className="label">Security Question (For Recovery)</label>
                                <select
                                    className="input"
                                    value={securityQuestion}
                                    onChange={(e) => setSecurityQuestion(e.target.value)}
                                    required
                                >
                                    <option value="">Select a question...</option>
                                    <option value="What is your first pet's name?">What is your first pet's name?</option>
                                    <option value="What city were you born in?">What city were you born in?</option>
                                    <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                                    <option value="What was your favorite school teacher's name?">What was your favorite school teacher's name?</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="label">Answer</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={securityAnswer}
                                    onChange={(e) => setSecurityAnswer(e.target.value)}
                                    required
                                />
                            </div>
                        </>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        {isLogin ? 'Enter' : 'Create Identity'}
                    </button>

                    {isLogin && (
                        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
                            <a href="/recover" style={{ color: '#94a3b8' }}>Forgot Password?</a>
                        </p>
                    )}
                </form>

                <p style={{ textAlign: 'center', marginTop: '1rem', cursor: 'pointer', color: 'var(--primary-color)' }} onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? "Don't have a mask? Join" : "Already have an alias? Login"}
                </p>
            </div>
        </div>
    );
};

export default Auth;
