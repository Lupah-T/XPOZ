import React, { useState, useCallback, useRef, useEffect } from 'react';
import getCroppedImg from '../utils/cropImage';

// ============================================
// MANUAL CROPPER COMPONENT
// Draggable edge and corner handles for precise cropping
// ============================================
const ManualCropper = ({ imageSrc, onCropChange, filter = '' }) => {
    const containerRef = useRef(null);
    const imageRef = useRef(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

    // Crop area as percentages (0-100)
    const [cropArea, setCropArea] = useState({ top: 10, left: 10, right: 90, bottom: 90 });
    const [dragging, setDragging] = useState(null); // 'top', 'bottom', 'left', 'right', 'tl', 'tr', 'bl', 'br', 'move'
    const dragStart = useRef({ x: 0, y: 0, cropArea: null });

    const handleImageLoad = (e) => {
        const { naturalWidth, naturalHeight, width, height } = e.target;
        setImageDimensions({
            width,
            height,
            naturalWidth,
            naturalHeight
        });
        setImageLoaded(true);
        // Initialize crop to full image
        setCropArea({ top: 5, left: 5, right: 95, bottom: 95 });
    };

    // Convert percentage crop to pixels for output
    useEffect(() => {
        if (!imageLoaded || !imageDimensions.naturalWidth) return;

        const pixelCrop = {
            x: Math.round((cropArea.left / 100) * imageDimensions.naturalWidth),
            y: Math.round((cropArea.top / 100) * imageDimensions.naturalHeight),
            width: Math.round(((cropArea.right - cropArea.left) / 100) * imageDimensions.naturalWidth),
            height: Math.round(((cropArea.bottom - cropArea.top) / 100) * imageDimensions.naturalHeight)
        };
        onCropChange(pixelCrop);
    }, [cropArea, imageDimensions, imageLoaded, onCropChange]);

    const handleMouseDown = (handle) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(handle);
        dragStart.current = {
            x: e.clientX,
            y: e.clientY,
            cropArea: { ...cropArea }
        };
    };

    const handleTouchStart = (handle) => (e) => {
        e.stopPropagation();
        const touch = e.touches[0];
        setDragging(handle);
        dragStart.current = {
            x: touch.clientX,
            y: touch.clientY,
            cropArea: { ...cropArea }
        };
    };

    useEffect(() => {
        if (!dragging) return;

        const handleMove = (clientX, clientY) => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const deltaX = ((clientX - dragStart.current.x) / rect.width) * 100;
            const deltaY = ((clientY - dragStart.current.y) / rect.height) * 100;
            const start = dragStart.current.cropArea;

            let newCrop = { ...start };
            const minSize = 10; // Minimum 10% size

            switch (dragging) {
                case 'top':
                    newCrop.top = Math.max(0, Math.min(start.bottom - minSize, start.top + deltaY));
                    break;
                case 'bottom':
                    newCrop.bottom = Math.min(100, Math.max(start.top + minSize, start.bottom + deltaY));
                    break;
                case 'left':
                    newCrop.left = Math.max(0, Math.min(start.right - minSize, start.left + deltaX));
                    break;
                case 'right':
                    newCrop.right = Math.min(100, Math.max(start.left + minSize, start.right + deltaX));
                    break;
                case 'tl':
                    newCrop.top = Math.max(0, Math.min(start.bottom - minSize, start.top + deltaY));
                    newCrop.left = Math.max(0, Math.min(start.right - minSize, start.left + deltaX));
                    break;
                case 'tr':
                    newCrop.top = Math.max(0, Math.min(start.bottom - minSize, start.top + deltaY));
                    newCrop.right = Math.min(100, Math.max(start.left + minSize, start.right + deltaX));
                    break;
                case 'bl':
                    newCrop.bottom = Math.min(100, Math.max(start.top + minSize, start.bottom + deltaY));
                    newCrop.left = Math.max(0, Math.min(start.right - minSize, start.left + deltaX));
                    break;
                case 'br':
                    newCrop.bottom = Math.min(100, Math.max(start.top + minSize, start.bottom + deltaY));
                    newCrop.right = Math.min(100, Math.max(start.left + minSize, start.right + deltaX));
                    break;
                case 'move':
                    const width = start.right - start.left;
                    const height = start.bottom - start.top;
                    let newLeft = start.left + deltaX;
                    let newTop = start.top + deltaY;

                    // Clamp to boundaries
                    newLeft = Math.max(0, Math.min(100 - width, newLeft));
                    newTop = Math.max(0, Math.min(100 - height, newTop));

                    newCrop = {
                        left: newLeft,
                        top: newTop,
                        right: newLeft + width,
                        bottom: newTop + height
                    };
                    break;
            }

            setCropArea(newCrop);
        };

        const handleMouseMove = (e) => handleMove(e.clientX, e.clientY);
        const handleTouchMove = (e) => {
            const touch = e.touches[0];
            handleMove(touch.clientX, touch.clientY);
        };

        const handleEnd = () => setDragging(null);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleEnd);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [dragging]);

    const handleStyle = {
        position: 'absolute',
        background: '#fff',
        border: '2px solid #a855f7',
        borderRadius: '50%',
        width: '20px',
        height: '20px',
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    };

    const edgeHandleStyle = (vertical) => ({
        position: 'absolute',
        background: '#a855f7',
        borderRadius: '4px',
        cursor: vertical ? 'ns-resize' : 'ew-resize',
        zIndex: 9,
        ...(vertical
            ? { width: '40px', height: '6px', transform: 'translateX(-50%)' }
            : { width: '6px', height: '40px', transform: 'translateY(-50%)' }
        )
    });

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                background: '#000'
            }}
        >
            {/* Image */}
            <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={handleImageLoad}
                style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    filter: filter,
                    userSelect: 'none',
                    pointerEvents: 'none'
                }}
            />

            {imageLoaded && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {/* Darkened overlay outside crop area */}
                    <svg
                        style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                    >
                        <defs>
                            <mask id="cropMask">
                                <rect x="0" y="0" width="100" height="100" fill="white" />
                                <rect
                                    x={cropArea.left}
                                    y={cropArea.top}
                                    width={cropArea.right - cropArea.left}
                                    height={cropArea.bottom - cropArea.top}
                                    fill="black"
                                />
                            </mask>
                        </defs>
                        <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.6)" mask="url(#cropMask)" />
                    </svg>

                    {/* Crop border */}
                    <div style={{
                        position: 'absolute',
                        left: `${cropArea.left}%`,
                        top: `${cropArea.top}%`,
                        width: `${cropArea.right - cropArea.left}%`,
                        height: `${cropArea.bottom - cropArea.top}%`,
                        border: '2px solid #a855f7',
                        boxSizing: 'border-box',
                        pointerEvents: 'none'
                    }}>
                        {/* Grid lines (rule of thirds) */}
                        <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.3)' }} />
                        <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.3)' }} />
                        <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.3)' }} />
                        <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.3)' }} />
                    </div>

                    {/* Move area (center of crop) */}
                    <div
                        style={{
                            position: 'absolute',
                            left: `${cropArea.left + 5}%`,
                            top: `${cropArea.top + 5}%`,
                            width: `${cropArea.right - cropArea.left - 10}%`,
                            height: `${cropArea.bottom - cropArea.top - 10}%`,
                            cursor: 'move'
                        }}
                        onMouseDown={handleMouseDown('move')}
                        onTouchStart={handleTouchStart('move')}
                    />

                    {/* Corner handles */}
                    <div style={{ ...handleStyle, left: `${cropArea.left}%`, top: `${cropArea.top}%`, cursor: 'nwse-resize' }}
                        onMouseDown={handleMouseDown('tl')} onTouchStart={handleTouchStart('tl')} />
                    <div style={{ ...handleStyle, left: `${cropArea.right}%`, top: `${cropArea.top}%`, cursor: 'nesw-resize' }}
                        onMouseDown={handleMouseDown('tr')} onTouchStart={handleTouchStart('tr')} />
                    <div style={{ ...handleStyle, left: `${cropArea.left}%`, top: `${cropArea.bottom}%`, cursor: 'nesw-resize' }}
                        onMouseDown={handleMouseDown('bl')} onTouchStart={handleTouchStart('bl')} />
                    <div style={{ ...handleStyle, left: `${cropArea.right}%`, top: `${cropArea.bottom}%`, cursor: 'nwse-resize' }}
                        onMouseDown={handleMouseDown('br')} onTouchStart={handleTouchStart('br')} />

                    {/* Edge handles */}
                    <div style={{ ...edgeHandleStyle(true), left: `${(cropArea.left + cropArea.right) / 2}%`, top: `${cropArea.top}%` }}
                        onMouseDown={handleMouseDown('top')} onTouchStart={handleTouchStart('top')} />
                    <div style={{ ...edgeHandleStyle(true), left: `${(cropArea.left + cropArea.right) / 2}%`, top: `${cropArea.bottom}%` }}
                        onMouseDown={handleMouseDown('bottom')} onTouchStart={handleTouchStart('bottom')} />
                    <div style={{ ...edgeHandleStyle(false), left: `${cropArea.left}%`, top: `${(cropArea.top + cropArea.bottom) / 2}%` }}
                        onMouseDown={handleMouseDown('left')} onTouchStart={handleTouchStart('left')} />
                    <div style={{ ...edgeHandleStyle(false), left: `${cropArea.right}%`, top: `${(cropArea.top + cropArea.bottom) / 2}%` }}
                        onMouseDown={handleMouseDown('right')} onTouchStart={handleTouchStart('right')} />
                </div>
            )}
        </div>
    );
};


// ============================================
// VIDEO TRIMMER COMPONENT
// Visual timeline with draggable handles
// ============================================
const VideoTrimmer = ({ file, onTimeChange, initialStart = 0, initialEnd = null }) => {
    const videoRef = useRef(null);
    const timelineRef = useRef(null);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [trimRange, setTrimRange] = useState({ start: initialStart, end: initialEnd || 0 });
    const [thumbnails, setThumbnails] = useState([]);
    const [dragging, setDragging] = useState(null); // 'start', 'end', 'playhead'
    const [isPlaying, setIsPlaying] = useState(false);

    const videoUrl = URL.createObjectURL(file);

    useEffect(() => {
        return () => URL.revokeObjectURL(videoUrl);
    }, []);

    const handleLoadedMetadata = (e) => {
        const dur = e.target.duration;
        setDuration(dur);
        setTrimRange({ start: 0, end: dur });
        onTimeChange({ start: 0, end: dur });
        generateThumbnails(e.target, dur);
    };

    const generateThumbnails = async (video, dur) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const thumbCount = 8;
        const thumbs = [];

        canvas.width = 80;
        canvas.height = 60;

        for (let i = 0; i < thumbCount; i++) {
            const time = (i / thumbCount) * dur;
            video.currentTime = time;

            await new Promise(resolve => {
                video.onseeked = () => {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    thumbs.push(canvas.toDataURL('image/jpeg', 0.5));
                    resolve();
                };
            });
        }

        setThumbnails(thumbs);
        video.currentTime = 0;
    };

    const handleTimeUpdate = (e) => {
        const time = e.target.currentTime;
        setCurrentTime(time);

        // Loop within trim range during preview
        if (isPlaying && time >= trimRange.end) {
            e.target.currentTime = trimRange.start;
        }
    };

    const handleTimelineMouseDown = (handle) => (e) => {
        e.preventDefault();
        setDragging(handle);
    };

    useEffect(() => {
        if (!dragging || !timelineRef.current) return;

        const handleMove = (clientX) => {
            const rect = timelineRef.current.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            const time = percent * duration;

            if (dragging === 'start') {
                const newStart = Math.min(time, trimRange.end - 0.5);
                setTrimRange(prev => ({ ...prev, start: Math.max(0, newStart) }));
                videoRef.current.currentTime = Math.max(0, newStart);
            } else if (dragging === 'end') {
                const newEnd = Math.max(time, trimRange.start + 0.5);
                setTrimRange(prev => ({ ...prev, end: Math.min(duration, newEnd) }));
            }
        };

        const handleMouseMove = (e) => handleMove(e.clientX);
        const handleTouchMove = (e) => handleMove(e.touches[0].clientX);

        const handleEnd = () => {
            setDragging(null);
            onTimeChange(trimRange);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleEnd);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [dragging, duration, trimRange]);

    const togglePlay = () => {
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.currentTime = trimRange.start;
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const trimDuration = trimRange.end - trimRange.start;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Video Preview */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                <video
                    ref={videoRef}
                    src={videoUrl}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    muted
                    style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }}
                />
            </div>

            {/* Controls */}
            <div style={{ padding: '1rem', background: 'rgba(20,20,20,0.95)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                {/* Time Display */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    <span>Start: {formatTime(trimRange.start)}</span>
                    <span style={{ color: '#a855f7', fontWeight: '600' }}>Duration: {formatTime(trimDuration)}</span>
                    <span>End: {formatTime(trimRange.end)}</span>
                </div>

                {/* Timeline with Thumbnails */}
                <div
                    ref={timelineRef}
                    style={{
                        position: 'relative',
                        height: '60px',
                        background: '#1e293b',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        marginBottom: '1rem'
                    }}
                >
                    {/* Thumbnail Strip */}
                    <div style={{ display: 'flex', height: '100%', opacity: 0.7 }}>
                        {thumbnails.map((thumb, i) => (
                            <img key={i} src={thumb} alt="" style={{ flex: 1, objectFit: 'cover' }} />
                        ))}
                    </div>

                    {/* Dimmed areas outside trim */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0,
                        width: `${(trimRange.start / duration) * 100}%`,
                        height: '100%',
                        background: 'rgba(0,0,0,0.7)'
                    }} />
                    <div style={{
                        position: 'absolute',
                        top: 0, right: 0,
                        width: `${((duration - trimRange.end) / duration) * 100}%`,
                        height: '100%',
                        background: 'rgba(0,0,0,0.7)'
                    }} />

                    {/* Trim Selection Border */}
                    <div style={{
                        position: 'absolute',
                        top: 0, bottom: 0,
                        left: `${(trimRange.start / duration) * 100}%`,
                        width: `${((trimRange.end - trimRange.start) / duration) * 100}%`,
                        border: '3px solid #a855f7',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                        pointerEvents: 'none'
                    }} />

                    {/* Start Handle */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0, bottom: 0,
                            left: `${(trimRange.start / duration) * 100}%`,
                            width: '16px',
                            transform: 'translateX(-50%)',
                            background: '#a855f7',
                            cursor: 'ew-resize',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px'
                        }}
                        onMouseDown={handleTimelineMouseDown('start')}
                        onTouchStart={handleTimelineMouseDown('start')}
                    >
                        <div style={{ width: '4px', height: '30px', background: 'white', borderRadius: '2px' }} />
                    </div>

                    {/* End Handle */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0, bottom: 0,
                            left: `${(trimRange.end / duration) * 100}%`,
                            width: '16px',
                            transform: 'translateX(-50%)',
                            background: '#a855f7',
                            cursor: 'ew-resize',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px'
                        }}
                        onMouseDown={handleTimelineMouseDown('end')}
                        onTouchStart={handleTimelineMouseDown('end')}
                    >
                        <div style={{ width: '4px', height: '30px', background: 'white', borderRadius: '2px' }} />
                    </div>

                    {/* Playhead */}
                    <div style={{
                        position: 'absolute',
                        top: 0, bottom: 0,
                        left: `${(currentTime / duration) * 100}%`,
                        width: '2px',
                        background: '#fff',
                        pointerEvents: 'none'
                    }} />
                </div>

                {/* Play Button */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                        onClick={togglePlay}
                        style={{
                            background: '#a855f7',
                            border: 'none',
                            color: 'white',
                            padding: '0.75rem 2rem',
                            borderRadius: '999px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '600'
                        }}
                    >
                        {isPlaying ? '⏸ Pause' : '▶ Preview Trim'}
                    </button>
                </div>

                {trimDuration > 30 && (
                    <p style={{ color: '#f59e0b', textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                        ⚠️ Tip: Keep videos under 30s to save storage
                    </p>
                )}
            </div>
        </div>
    );
};


// ============================================
// BUILT-IN MUSIC LIBRARY
// ============================================
const MUSIC_LIBRARY = [
    { id: 'upbeat1', name: 'Happy Vibes', category: 'Upbeat', duration: 15, color: '#f59e0b' },
    { id: 'upbeat2', name: 'Energy Boost', category: 'Upbeat', duration: 20, color: '#f59e0b' },
    { id: 'chill1', name: 'Sunset Dreams', category: 'Chill', duration: 20, color: '#3b82f6' },
    { id: 'chill2', name: 'Ocean Breeze', category: 'Chill', duration: 25, color: '#3b82f6' },
    { id: 'dramatic1', name: 'Epic Rise', category: 'Dramatic', duration: 15, color: '#ef4444' },
    { id: 'dramatic2', name: 'Tension', category: 'Dramatic', duration: 18, color: '#ef4444' },
    { id: 'fun1', name: 'Party Time', category: 'Fun', duration: 20, color: '#10b981' },
    { id: 'fun2', name: 'Playful', category: 'Fun', duration: 15, color: '#10b981' },
];

const MusicSelector = ({ selectedTrack, onSelectTrack, onVolumeChange, volume = 0.7 }) => {
    const [category, setCategory] = useState('All');
    const [previewTrack, setPreviewTrack] = useState(null);

    const categories = ['All', 'Upbeat', 'Chill', 'Dramatic', 'Fun'];
    const filteredTracks = category === 'All'
        ? MUSIC_LIBRARY
        : MUSIC_LIBRARY.filter(t => t.category === category);

    const handleTrackClick = (track) => {
        if (selectedTrack?.id === track.id) {
            onSelectTrack(null);
        } else {
            onSelectTrack(track);
        }
    };

    return (
        <div style={{ padding: '1rem' }}>
            {/* Category Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto' }}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        style={{
                            background: category === cat ? '#a855f7' : 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '999px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            fontSize: '0.85rem'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Track List */}
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {filteredTracks.map(track => (
                    <div
                        key={track.id}
                        onClick={() => handleTrackClick(track)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.75rem',
                            marginBottom: '0.5rem',
                            background: selectedTrack?.id === track.id ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.05)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: selectedTrack?.id === track.id ? '2px solid #a855f7' : '2px solid transparent',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{
                            width: '40px', height: '40px',
                            borderRadius: '8px',
                            background: track.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '0.75rem',
                            fontSize: '1.2rem'
                        }}>
                            🎵
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ color: 'white', fontWeight: '500' }}>{track.name}</div>
                            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                                {track.category} · {track.duration}s
                            </div>
                        </div>
                        {selectedTrack?.id === track.id && (
                            <span style={{ color: '#a855f7', fontSize: '1.2rem' }}>✓</span>
                        )}
                    </div>
                ))}
            </div>

            {/* Volume Control */}
            {selectedTrack && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                        <span>🔊 Music Volume</span>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                            style={{ flex: 1 }}
                        />
                        <span style={{ minWidth: '40px' }}>{Math.round(volume * 100)}%</span>
                    </label>
                </div>
            )}

            <p style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', marginTop: '1rem' }}>
                🎶 Royalty-free tracks. Music will play with your video.
            </p>
        </div>
    );
};


// ============================================
// MAIN MEDIA PREVIEW COMPONENT
// ============================================
const MediaPreview = ({ file, onSave, onCancel, type = 'image' }) => {
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [filter, setFilter] = useState('');

    // Video state
    const [videoTime, setVideoTime] = useState({ start: 0, end: 0 });
    const [selectedMusic, setSelectedMusic] = useState(null);
    const [musicVolume, setMusicVolume] = useState(0.7);
    const [activeTab, setActiveTab] = useState('trim'); // 'trim' or 'music'

    const containerStyle = {
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw'
    };

    const handleCropChange = useCallback((crop) => {
        setCroppedAreaPixels(crop);
    }, []);

    const handleSave = async () => {
        if (type === 'video') {
            onSave(file, {
                startTime: videoTime.start,
                endTime: videoTime.end,
                music: selectedMusic ? {
                    trackId: selectedMusic.id,
                    volume: musicVolume
                } : null
            });
            return;
        }

        try {
            setProcessing(true);
            if (!croppedAreaPixels || croppedAreaPixels.width === 0 || croppedAreaPixels.height === 0) {
                alert('Please adjust the crop area before saving.');
                setProcessing(false);
                return;
            }

            const croppedImage = await getCroppedImg(
                URL.createObjectURL(file),
                croppedAreaPixels,
                0, // rotation
                filter
            );

            const croppedFile = new File([croppedImage], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
            });

            onSave(croppedFile);
        } catch (e) {
            console.error('Error cropping image:', e);
            alert('Failed to crop image');
        } finally {
            setProcessing(false);
        }
    };

    // VIDEO EDITOR
    if (type === 'video') {
        return (
            <div style={containerStyle}>
                {/* Header */}
                <div style={{
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.8)'
                }}>
                    <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: 'white', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                        Cancel
                    </button>
                    <h3 style={{ margin: 0, color: 'white' }}>Edit Video</h3>
                    <button
                        onClick={handleSave}
                        style={{ background: '#a855f7', border: 'none', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Done
                    </button>
                </div>

                {/* Tab Switcher */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <button
                        onClick={() => setActiveTab('trim')}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: 'transparent',
                            border: 'none',
                            color: activeTab === 'trim' ? '#a855f7' : '#94a3b8',
                            borderBottom: activeTab === 'trim' ? '2px solid #a855f7' : 'none',
                            cursor: 'pointer',
                            fontSize: '0.95rem'
                        }}
                    >
                        ✂️ Trim
                    </button>
                    <button
                        onClick={() => setActiveTab('music')}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: 'transparent',
                            border: 'none',
                            color: activeTab === 'music' ? '#a855f7' : '#94a3b8',
                            borderBottom: activeTab === 'music' ? '2px solid #a855f7' : 'none',
                            cursor: 'pointer',
                            fontSize: '0.95rem'
                        }}
                    >
                        🎵 Music {selectedMusic && '✓'}
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                    {activeTab === 'trim' ? (
                        <VideoTrimmer
                            file={file}
                            onTimeChange={setVideoTime}
                        />
                    ) : (
                        <MusicSelector
                            selectedTrack={selectedMusic}
                            onSelectTrack={setSelectedMusic}
                            volume={musicVolume}
                            onVolumeChange={setMusicVolume}
                        />
                    )}
                </div>
            </div>
        );
    }

    // IMAGE EDITOR
    return (
        <div style={containerStyle}>
            {/* Header */}
            <div style={{
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.8)'
            }}>
                <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: 'white', padding: '0.5rem 1rem', cursor: 'pointer' }} disabled={processing}>
                    Cancel
                </button>
                <h3 style={{ margin: 0, color: 'white' }}>Crop Photo</h3>
                <button
                    onClick={handleSave}
                    style={{ background: '#a855f7', border: 'none', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '4px', cursor: 'pointer' }}
                    disabled={processing}
                >
                    {processing ? 'Saving...' : 'Done'}
                </button>
            </div>

            {/* Cropper Area */}
            <div style={{ flex: 1, position: 'relative', background: '#000' }}>
                <ManualCropper
                    imageSrc={URL.createObjectURL(file)}
                    onCropChange={handleCropChange}
                    filter={filter}
                />
            </div>

            {/* Filter Controls */}
            <div style={{ padding: '1rem', background: 'rgba(20,20,20,0.95)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Filters</p>
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {[
                        { label: 'Normal', value: '' },
                        { label: 'B&W', value: 'grayscale(1)' },
                        { label: 'Sepia', value: 'sepia(1)' },
                        { label: 'Vivid', value: 'saturate(1.5)' },
                        { label: 'Warm', value: 'sepia(0.3) saturate(1.3)' },
                        { label: 'Cool', value: 'hue-rotate(180deg) saturate(0.8)' },
                    ].map(f => (
                        <button
                            key={f.label}
                            onClick={() => setFilter(f.value)}
                            style={{
                                background: filter === f.value ? '#a855f7' : 'rgba(255,255,255,0.1)',
                                border: 'none',
                                color: 'white',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <p style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.75rem' }}>
                    Drag corners or edges to crop • Drag center to move
                </p>
            </div>
        </div>
    );
};

export default MediaPreview;
