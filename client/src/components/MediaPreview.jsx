import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';

const MediaPreview = ({ file, onSave, onCancel, type = 'image' }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [aspect, setAspect] = useState(null); // 'null' for Free/All-round crop
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [processing, setProcessing] = useState(false);

    // New Edit Modes
    const [mode, setMode] = useState('crop'); // 'crop', 'filters'
    const [filter, setFilter] = useState(''); // '', 'grayscale(1)', 'sepia(1)', 'contrast(1.5)'

    const [videoRange, setVideoRange] = useState({ start: 0, end: 100 }); // Percentage 0-100
    const [videoDuration, setVideoDuration] = useState(0);
    const [videoTime, setVideoTime] = useState({ start: 0, end: 0 }); // Actual seconds

    // Fix for "black screen" - ensure container has dimensions
    const containerStyle = {
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        zIndex: 99999, // High z-index to cover everything
        display: 'flex',
        flexDirection: 'column',
        height: '100vh', // Force full viewport height
        width: '100vw'
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (type === 'video') {
            // For video, we save the metadata (startTime, endTime)
            // We don't actually crop the file here to save performance
            onSave(file, {
                startTime: videoTime.start,
                endTime: videoTime.end
            });
            return;
        }

        try {
            setProcessing(true);
            if (!croppedAreaPixels || croppedAreaPixels.width === 0 || croppedAreaPixels.height === 0) {
                // If user clicks save too fast or there's an issue
                alert('Please adjust the crop area slightly before saving.');
                setProcessing(false);
                return;
            }

            const croppedImage = await getCroppedImg(
                URL.createObjectURL(file),
                croppedAreaPixels,
                rotation,
                filter // Pass css filter string
            );

            // Create a new File from the blob
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

    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    const handleVideoLoadedMetadata = (e) => {
        const duration = e.target.duration;
        setVideoDuration(duration);
        setVideoTime({ start: 0, end: duration });
    };

    const handleVideoTimeUpdate = (e) => {
        const currentTime = e.target.currentTime;
        if (currentTime < videoTime.start || currentTime > videoTime.end) {
            e.target.currentTime = videoTime.start;
        }
    };

    // Video Trimmer Render
    if (type === 'video') {
        const formatTime = (seconds) => {
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return `${m}:${s.toString().padStart(2, '0')}`;
        };

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
                    <button
                        onClick={onCancel}
                        className="btn"
                        style={{ background: 'transparent', padding: '0.5rem 1rem', color: 'white' }}
                    >
                        Cancel
                    </button>
                    <h3 style={{ margin: 0, color: 'white' }}>Trim Video</h3>
                    <button
                        onClick={handleSave}
                        className="btn"
                        style={{ background: '#a855f7', padding: '0.5rem 1.5rem', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                        Done
                    </button>
                </div>

                {/* Video Preview */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    overflow: 'hidden'
                }}>
                    <video
                        src={URL.createObjectURL(file)}
                        controls={false} // Custom controls
                        autoPlay
                        loop
                        muted
                        onLoadedMetadata={handleVideoLoadedMetadata}
                        onTimeUpdate={handleVideoTimeUpdate}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                        }}
                    />
                </div>

                {/* Trimmer Controls */}
                <div style={{
                    padding: '1.5rem',
                    background: 'rgba(20, 20, 20, 0.95)',
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        <span>Start: {formatTime(videoTime.start)}</span>
                        <span>End: {formatTime(videoTime.end)}</span>
                    </div>

                    {/* Simple Range Slider Simulation */}
                    <div style={{ position: 'relative', height: '40px', display: 'flex', alignItems: 'center' }}>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={videoRange.start}
                            onChange={(e) => {
                                const val = Math.min(Number(e.target.value), videoRange.end - 5);
                                setVideoRange(prev => ({ ...prev, start: val }));
                                setVideoTime(prev => ({ ...prev, start: (val / 100) * videoDuration }));
                            }}
                            style={{
                                position: 'absolute',
                                width: '100%',
                                zIndex: 2,
                                pointerEvents: 'none', // Allow clicking through? No, this is tricky in pure CSS/JS without a lib.
                                // We'll just do two full width sliders on top of each other
                                opacity: 0.5
                            }}
                        />
                        {/* 
                            Actually, dual range sliders are hard with default inputs. 
                            Let's use two distinct inputs: "Trim Start" and "Trim End" for MVP reliability.
                         */}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Start Time</label>
                            <input
                                type="range"
                                min="0"
                                max={videoDuration}
                                step="0.1"
                                value={videoTime.start}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (val < videoTime.end) setVideoTime({ ...videoTime, start: val });
                                }}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div>
                            <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>End Time</label>
                            <input
                                type="range"
                                min="0"
                                max={videoDuration}
                                step="0.1"
                                value={videoTime.end}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (val > videoTime.start) setVideoTime({ ...videoTime, end: val });
                                }}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    <small style={{ display: 'block', textAlign: 'center', marginTop: '1rem', color: '#64748b' }}>
                        Drag sliders to trim the video
                    </small>
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            {/* Header */}
            <div style={{
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.8)' // Consistent styling
            }}>
                <button
                    onClick={onCancel}
                    className="btn"
                    style={{ background: 'transparent', padding: '0.5rem 1rem', color: 'white' }}
                    disabled={processing}
                >
                    Cancel
                </button>
                <h3 style={{ margin: 0, color: 'white' }}>Edit Photo</h3>
                <button
                    onClick={handleSave}
                    className="btn"
                    style={{ background: '#a855f7', padding: '0.5rem 1.5rem', color: 'white', border: 'none', borderRadius: '4px' }}
                    disabled={processing}
                >
                    {processing ? 'Saving...' : 'Done'}
                </button>
            </div>

            {/* Cropper Area */}
            <div style={{ flex: 1, position: 'relative', background: '#000' }}>
                <Cropper
                    image={URL.createObjectURL(file)}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={aspect}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                    style={{ mediaStyle: { filter: filter } }}
                />
            </div>

            {/* Controls */}
            <div style={{
                padding: '1.5rem',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(20, 20, 20, 0.95)'
            }}>
                {/* Mode Switcher */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem' }}>
                    <button
                        onClick={() => setMode('crop')}
                        style={{ flex: 1, padding: '0.5rem', background: 'transparent', border: 'none', color: mode === 'crop' ? '#a855f7' : '#94a3b8', borderBottom: mode === 'crop' ? '2px solid #a855f7' : 'none', cursor: 'pointer' }}
                    >
                        Crop & Rotate
                    </button>
                    <button
                        onClick={() => setMode('filters')}
                        style={{ flex: 1, padding: '0.5rem', background: 'transparent', border: 'none', color: mode === 'filters' ? '#a855f7' : '#94a3b8', borderBottom: mode === 'filters' ? '2px solid #a855f7' : 'none', cursor: 'pointer' }}
                    >
                        Filters
                    </button>
                </div>

                {mode === 'crop' && (
                    <>
                        {/* Zoom Slider */}
                        <div style={{ marginBottom: '1rem' }}>
                            {/* ... existing zoom ... */}
                            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                                <span style={{ minWidth: '60px' }}>Zoom</span>
                                <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} style={{ flex: 1 }} />
                                <span style={{ minWidth: '40px', textAlign: 'right' }}>{Math.round(zoom * 100)}%</span>
                            </label>
                        </div>
                        {/* Rotation Slider */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                                <span style={{ minWidth: '60px' }}>Rotate</span>
                                <input type="range" value={rotation} min={0} max={360} step={1} onChange={(e) => setRotation(e.target.value)} style={{ flex: 1 }} />
                                <span style={{ minWidth: '40px', textAlign: 'right' }}>{rotation}°</span>
                            </label>
                        </div>
                        {/* Aspect Ratio Controls */}
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            {[
                                { label: 'Free', value: null },
                                { label: '1:1', value: 1 / 1 },
                                { label: '4:5', value: 4 / 5 },
                                { label: '16:9', value: 16 / 9 }
                            ].map((ratio) => (
                                <button
                                    key={ratio.label}
                                    onClick={() => setAspect(ratio.value)}
                                    className="btn"
                                    style={{
                                        background: aspect === ratio.value ? '#a855f7' : 'rgba(255,255,255,0.1)',
                                        padding: '0.4rem 0.8rem',
                                        fontSize: '0.8rem',
                                        border: 'none',
                                        color: 'white',
                                        borderRadius: '4px'
                                    }}
                                >
                                    {ratio.label}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {mode === 'filters' && (
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        {[
                            { label: 'Normal', value: '' },
                            { label: 'B&W', value: 'grayscale(1)' },
                            { label: 'Sepia', value: 'sepia(1)' },
                            { label: 'Contrast', value: 'contrast(1.5)' },
                            { label: 'Vivid', value: 'saturate(1.5)' },
                            { label: 'Warm', value: 'sepia(0.5) saturate(1.2)' },
                            { label: 'Cool', value: 'hue-rotate(180deg) opacity(0.8)' },
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
                                    cursor: 'pointer'
                                }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}

                {mode === 'crop' && (
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={handleRotate}
                            className="btn"
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                padding: '0.5rem 1rem',
                                fontSize: '0.9rem'
                            }}
                        >
                            🔄 Rotate 90°
                        </button>
                        <button
                            onClick={() => {
                                setZoom(1);
                                setRotation(0);
                                setAspect(null);
                                setFilter('');
                            }}
                            className="btn"
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                padding: '0.5rem 1rem',
                                fontSize: '0.9rem'
                            }}
                        >
                            ⟲ Reset All
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MediaPreview;
