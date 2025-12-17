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

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            setProcessing(true);
            if (!croppedAreaPixels) {
                // If user clicks save too fast or there's an issue
                alert('Please adjust the crop area slightly before saving.');
                setProcessing(false);
                return;
            }

            const croppedImage = await getCroppedImg(
                URL.createObjectURL(file),
                croppedAreaPixels,
                rotation
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

    if (type === 'video') {
        // For videos, just show preview without crop
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.95)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <button
                        onClick={onCancel}
                        className="btn"
                        style={{ background: 'transparent', padding: '0.5rem 1rem' }}
                    >
                        Cancel
                    </button>
                    <h3 style={{ margin: 0 }}>Video Preview</h3>
                    <button
                        onClick={() => onSave(file)}
                        className="btn"
                        style={{ background: '#a855f7', padding: '0.5rem 1.5rem' }}
                    >
                        Use Video
                    </button>
                </div>

                {/* Video Preview */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }}>
                    <video
                        src={URL.createObjectURL(file)}
                        controls
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            borderRadius: '8px'
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.95)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <button
                    onClick={onCancel}
                    className="btn"
                    style={{ background: 'transparent', padding: '0.5rem 1rem' }}
                    disabled={processing}
                >
                    Cancel
                </button>
                <h3 style={{ margin: 0 }}>Edit Photo</h3>
                <button
                    onClick={handleSave}
                    className="btn"
                    style={{ background: '#a855f7', padding: '0.5rem 1.5rem' }}
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
                />
            </div>

            {/* Controls */}
            <div style={{
                padding: '1.5rem',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.8)'
            }}>
                {/* Zoom Slider */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        fontSize: '0.9rem',
                        color: '#94a3b8'
                    }}>
                        <span style={{ minWidth: '60px' }}>Zoom</span>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            onChange={(e) => setZoom(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <span style={{ minWidth: '40px', textAlign: 'right' }}>
                            {Math.round(zoom * 100)}%
                        </span>
                    </label>
                </div>

                {/* Rotation Slider */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        fontSize: '0.9rem',
                        color: '#94a3b8'
                    }}>
                        <span style={{ minWidth: '60px' }}>Rotate</span>
                        <input
                            type="range"
                            value={rotation}
                            min={0}
                            max={360}
                            step={1}
                            onChange={(e) => setRotation(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <span style={{ minWidth: '40px', textAlign: 'right' }}>
                            {rotation}°
                        </span>
                    </label>
                </div>

                {/* Aspect Ratio Controls */}
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    flexWrap: 'wrap'
                }}>
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

                {/* Quick Actions */}
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
            </div>
        </div>
    );
};

export default MediaPreview;
