import React, { useState, useRef, useEffect } from 'react';

const VoiceRecorder = ({ onSend, onCancel }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const audioRef = useRef(null);

    useEffect(() => {
        // Start recording immediately when component mounts
        startRecording();

        return () => {
            stopTimer();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            startTimer();
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Could not access microphone. Please grant permission.');
            onCancel();
        }
    };

    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setDuration(prev => {
                const newDuration = prev + 1;
                // Auto-stop at 5 minutes (300 seconds)
                if (newDuration >= 300) {
                    handleStopRecording();
                }
                return newDuration;
            });
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            stopTimer();
        }
    };

    const handleCancel = () => {
        handleStopRecording();
        onCancel();
    };

    const handleSend = () => {
        if (audioBlob) {
            onSend(audioBlob, duration);
        }
    };

    const togglePreview = () => {
        if (!audioRef.current) return;

        if (isPreviewing) {
            audioRef.current.pause();
            setIsPreviewing(false);
        } else {
            audioRef.current.play();
            setIsPreviewing(true);
        }
    };

    const handleAudioEnded = () => {
        setIsPreviewing(false);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: window.innerWidth < 768 ? 'calc(65px + env(safe-area-inset-bottom, 0rem))' : 0,
            left: 0,
            right: 0,
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '1.5rem',
            paddingBottom: window.innerWidth < 768 ? '1.5rem' : 'calc(1.5rem + env(safe-area-inset-bottom, 0rem))',
            borderTop: '1px solid var(--glass-stroke)',
            zIndex: 1100, // Higher than ChatWindow (1010) and MobileNav (1000)
            animation: 'slideUp 0.3s ease'
        }}>
            <div style={{
                maxWidth: '600px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                {/* Recording Indicator */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    justifyContent: 'center'
                }}>
                    {isRecording && (
                        <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: '#ef4444',
                            animation: 'pulse 1.5s ease-in-out infinite'
                        }} />
                    )}
                    <span style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: 'var(--text-main)',
                        fontVariantNumeric: 'tabular-nums'
                    }}>
                        {formatTime(duration)}
                    </span>
                </div>

                {/* Waveform Visualization Placeholder */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    height: '60px'
                }}>
                    {[...Array(30)].map((_, i) => (
                        <div
                            key={i}
                            style={{
                                width: '3px',
                                height: isRecording ? `${Math.random() * 60 + 10}px` : '10px',
                                background: isRecording ? 'var(--primary)' : 'var(--text-muted)',
                                borderRadius: '2px',
                                transition: 'all 0.1s',
                                animation: isRecording ? `wave ${0.5 + Math.random()}s ease-in-out infinite` : 'none',
                                animationDelay: `${i * 0.05}s`
                            }}
                        />
                    ))}
                </div>

                {/* Audio Preview Hidden Element */}
                {previewUrl && (
                    <audio
                        ref={audioRef}
                        src={previewUrl}
                        onEnded={handleAudioEnded}
                        onPause={() => setIsPreviewing(false)}
                        onPlay={() => setIsPreviewing(true)}
                        style={{ display: 'none' }}
                    />
                )}

                {/* Controls */}
                <div style={{
                    display: 'flex',
                    gap: '1.5rem',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    {/* Delete/Cancel Button */}
                    <button
                        onClick={handleCancel}
                        style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        title="Cancel"
                    >
                        🗑️
                    </button>

                    {/* Middle Action: Stop or Play Preview */}
                    {isRecording ? (
                        <button
                            onClick={handleStopRecording}
                            style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '50%',
                                border: 'none',
                                background: '#ef4444',
                                color: 'white',
                                fontSize: '1.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                                transition: 'transform 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            title="Stop Recording"
                        >
                            ⏹️
                        </button>
                    ) : (
                        previewUrl && (
                            <button
                                onClick={togglePreview}
                                style={{
                                    width: '70px',
                                    height: '70px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    fontSize: '1.8rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                title={isPreviewing ? "Pause" : "Play Preview"}
                            >
                                {isPreviewing ? '⏸️' : '▶️'}
                            </button>
                        )
                    )}

                    {/* Send Button */}
                    {!isRecording && audioBlob && (
                        <button
                            onClick={handleSend}
                            style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                border: 'none',
                                background: 'rgba(34, 197, 94, 0.1)',
                                color: '#22c55e',
                                fontSize: '1.2rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                animation: 'scaleIn 0.3s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)'}
                            title="Send"
                        >
                            🚀
                        </button>
                    )}
                </div>

                <p style={{
                    textAlign: 'center',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    margin: 0
                }}>
                    {isRecording ? 'Recording... click square to stop' : 'Preview your message before sending'}
                </p>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                }
                @keyframes wave {
                    0%, 100% { height: 10px; }
                    50% { height: 50px; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0); }
                    to { transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default VoiceRecorder;
