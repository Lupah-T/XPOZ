import React, { useEffect, useState } from 'react';

const PasswordValidator = ({ password }) => {
    const [rules, setRules] = useState({
        length: false,
        upper: false,
        number: false,
        special: false
    });

    useEffect(() => {
        setRules({
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        });
    }, [password]);

    const RuleItem = ({ satisfied, text }) => (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            color: satisfied ? '#22c55e' : '#ef4444',
            marginBottom: '4px',
            transition: 'color 0.3s ease'
        }}>
            <span>{satisfied ? '✅' : '❌'}</span>
            <span>{text}</span>
        </div>
    );

    return (
        <div style={{
            marginTop: '0.5rem',
            padding: '0.75rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            border: '1px solid var(--glass-stroke)'
        }}>
            <RuleItem satisfied={rules.length} text="At least 8 characters" />
            <RuleItem satisfied={rules.upper} text="At least one uppercase letter" />
            <RuleItem satisfied={rules.number} text="At least one number" />
            <RuleItem satisfied={rules.special} text="At least one special character (!@#$%^&*)" />
        </div>
    );
};

export default PasswordValidator;
