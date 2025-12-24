import React, { useState, useRef, useEffect } from 'react';

const VoiceNotePlayer = ({ url, duration = 0, name, isOwn }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [audioDuration, setAudioDuration] = useState(duration || 0);
    const audioRef = useRef(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setAudioDuration(audio.duration);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e) => {
        const audio = audioRef.current;
        if (!audio) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        audio.currentTime = percentage * audioDuration;
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds === 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 12px',
            background: isOwn ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.05)',
            borderRadius: '20px',
            minWidth: '250px',
            maxWidth: '300px'
        }}>
            <audio ref={audioRef} src={url} preload="metadata" />

            {/* Play/Pause Button */}
            <button
                onClick={togglePlay}
                style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'var(--primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    flexShrink: 0,
                    transition: 'transform 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                {isPlaying ? '⏸' : '▶'}
            </button>

            {/* Waveform / Progress Bar */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* Progress Bar */}
                <div
                    onClick={handleSeek}
                    style={{
                        height: '4px',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${progress}%`,
                        background: 'var(--primary)',
                        transition: 'width 0.1s linear'
                    }} />
                </div>

                {/* Time Display */}
                <div style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255,255,255,0.6)',
                    display: 'flex',
                    justifyContent: 'space-between'
                }}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(audioDuration)}</span>
                </div>
            </div>

            {/* Microphone Icon for Voice Notes */}
            <div style={{
                fontSize: '1.2rem',
                opacity: 0.5,
                flexShrink: 0
            }}>
                🎤
            </div>
        </div>
    );
};

export default VoiceNotePlayer;
