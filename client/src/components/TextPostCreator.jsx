import React, { useState } from 'react';

const TextPostCreator = ({ onSave, onCancel }) => {
    const backgrounds = [
        { id: 1, bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#ffffff', name: 'Purple Dream' },
        { id: 2, bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', text: '#ffffff', name: 'Pink Sunset' },
        { id: 3, bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', text: '#ffffff', name: 'Ocean Blue' },
        { id: 4, bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', text: '#1a1a1a', name: 'Mint Fresh' },
        { id: 5, bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', text: '#1a1a1a', name: 'Sunrise' },
        { id: 6, bg: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', text: '#ffffff', name: 'Deep Ocean' },
        { id: 7, bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', text: '#1a1a1a', name: 'Pastel Dream' },
        { id: 8, bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', text: '#1a1a1a', name: 'Cotton Candy' },
        { id: 9, bg: '#1e293b', text: '#ffffff', name: 'Dark Mode' },
        { id: 10, bg: '#ffffff', text: '#1e293b', name: 'Light Mode' }
    ];

    const fonts = [
        'Inter',
        'Roboto',
        'Playfair Display',
        'Pacifico',
        'Dancing Script',
        'Montserrat',
        'Lora'
    ];

    const [text, setText] = useState('');
    const [selectedBg, setSelectedBg] = useState(backgrounds[0]);
    const [fontSize, setFontSize] = useState(28);
    const [fontFamily, setFontFamily] = useState('Inter');

    const handleSave = () => {
        if (!text.trim()) {
            alert('Please write some text');
            return;
        }

        onSave({
            text: text.trim(),
            style: {
                backgroundColor: selectedBg.bg,
                textColor: selectedBg.text,
                fontSize: `${fontSize}px`,
                fontFamily
            }
        });
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.95)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto'
        }}>
            {/* Header */}
            <div style={{
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.8)',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <button
                    onClick={onCancel}
                    className="btn"
                    style={{ background: 'transparent', padding: '0.5rem 1rem' }}
                >
                    Cancel
                </button>
                <h3 style={{ margin: 0 }}>Create Text Post</h3>
                <button
                    onClick={handleSave}
                    className="btn"
                    style={{ background: '#a855f7', padding: '0.5rem 1.5rem' }}
                >
                    Create
                </button>
            </div>

            {/* Preview Area */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem 1rem',
                minHeight: '400px'
            }}>
                <div
                    style={{
                        width: '100%',
                        maxWidth: '500px',
                        aspectRatio: '1/1',
                        background: selectedBg.bg,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                        position: 'relative',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                    }}
                >
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="What's on your mind?"
                        maxLength={200}
                        style={{
                            width: '100%',
                            height: '100%',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: selectedBg.text,
                            fontSize: `${fontSize}px`,
                            fontFamily: fontFamily,
                            textAlign: 'center',
                            resize: 'none',
                            fontWeight: '500',
                            lineHeight: '1.4'
                        }}
                    />

                    {/* Character Count */}
                    <div style={{
                        position: 'absolute',
                        bottom: '1rem',
                        right: '1rem',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        color: selectedBg.text,
                        opacity: 0.7
                    }}>
                        {text.length}/200
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div style={{
                padding: '1.5rem',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.8)',
                maxHeight: '50vh',
                overflow: 'auto'
            }}>
                {/* Background Selector */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '0.75rem',
                        fontSize: '0.9rem',
                        color: '#94a3b8',
                        fontWeight: '600'
                    }}>
                        Background
                    </label>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                        gap: '0.75rem'
                    }}>
                        {backgrounds.map(bg => (
                            <div
                                key={bg.id}
                                onClick={() => setSelectedBg(bg)}
                                style={{
                                    aspectRatio: '1/1',
                                    background: bg.bg,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    border: selectedBg.id === bg.id ? '3px solid #a855f7' : '2px solid rgba(255,255,255,0.1)',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem',
                                    color: bg.text,
                                    fontWeight: '600',
                                    textAlign: 'center',
                                    padding: '0.5rem'
                                }}
                                title={bg.name}
                            >
                                {selectedBg.id === bg.id && '✓'}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Font Family */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem',
                        color: '#94a3b8',
                        fontWeight: '600'
                    }}>
                        Font
                    </label>
                    <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="select"
                        style={{ width: '100%', fontSize: '16px' }}
                    >
                        {fonts.map(font => (
                            <option key={font} value={font} style={{ fontFamily: font }}>
                                {font}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Font Size Slider */}
                <div>
                    <label style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem',
                        color: '#94a3b8',
                        fontWeight: '600'
                    }}>
                        <span>Text Size</span>
                        <span>{fontSize}px</span>
                    </label>
                    <input
                        type="range"
                        min="18"
                        max="48"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                    />
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: '#64748b',
                        marginTop: '0.25rem'
                    }}>
                        <span>Small</span>
                        <span>Large</span>
                    </div>
                </div>

                {/* Tips */}
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(168, 85, 247, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(168, 85, 247, 0.3)'
                }}>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                        💡 <strong>Tip:</strong> Keep it short and impactful! Text posts work best with 20-50 words.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TextPostCreator;
