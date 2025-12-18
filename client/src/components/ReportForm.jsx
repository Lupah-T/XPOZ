import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import MediaPreview from './MediaPreview';
import TextPostCreator from './TextPostCreator';

const ReportForm = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const [postMode, setPostMode] = useState('media'); // 'media' or 'text'
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });
    const [mediaFiles, setMediaFiles] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);
    const [showTextCreator, setShowTextCreator] = useState(false);
    const [textPostData, setTextPostData] = useState(null);
    const [status, setStatus] = useState(null);
    const [message, setMessage] = useState('');
    const [uploading, setUpload] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);

        // Validate total count
        if (mediaFiles.length + files.length > 6) {
            alert('Maximum 6 media files allowed per post');
            return;
        }

        // Add new files with preview URLs
        const newFiles = files.map((file, index) => ({
            file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith('image/') ? 'image' : 'video',
            order: mediaFiles.length + index,
            edited: false
        }));

        setMediaFiles([...mediaFiles, ...newFiles]);
        e.target.value = ''; // Reset input
    };

    const handleRemoveMedia = (index) => {
        const newFiles = mediaFiles.filter((_, i) => i !== index);
        // Reorder remaining files
        newFiles.forEach((file, i) => file.order = i);
        setMediaFiles(newFiles);
    };

    const handleEditMedia = (index) => {
        setEditingIndex(index);
    };

    const handleSaveEditedMedia = (editedFile, metadata = null) => {
        const newFiles = [...mediaFiles];
        newFiles[editingIndex] = {
            ...newFiles[editingIndex],
            file: editedFile,
            preview: URL.createObjectURL(editedFile),
            edited: true,
            metadata // Store metadata (e.g. video trim)
        };
        setMediaFiles(newFiles);
        setEditingIndex(null);
    };

    const handleTextPostSave = (data) => {
        setTextPostData(data);
        setShowTextCreator(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpload(true);
        setStatus('loading');
        setMessage('');

        // Validate based on mode
        if (postMode === 'media' && mediaFiles.length === 0) {
            alert('Please add at least 1 media file, or switch to text mode');
            setUpload(false);
            setStatus(null);
            return;
        }

        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);

        // Determine post type and add data
        if (postMode === 'text' && textPostData) {
            data.append('postType', 'text');
            data.append('textStyle', JSON.stringify(textPostData.style));
        } else if (mediaFiles.length >= 1) {
            data.append('postType', 'media');
            // Append all media files
            mediaFiles.forEach((item, index) => {
                data.append('media', item.file);
                if (item.metadata) {
                    data.append(`metadata_${index}`, JSON.stringify(item.metadata));
                }
            });
        } else {
            // Fallback for posts with 0 media files (if not text post)
            data.append('postType', 'legacy');
        }

        try {
            const response = await fetch(`${API_URL}/api/reports`, {
                method: 'POST',
                headers: {
                    'x-auth-token': token
                },
                body: data
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create post');
            }

            setStatus('success');
            setMessage('Post created successfully!');

            // Reset form
            setFormData({ title: '', description: '' });
            setMediaFiles([]);
            setTextPostData(null);

            // Redirect to home after 1.5s
            setTimeout(() => {
                navigate('/');
            }, 1500);

        } catch (err) {
            console.error('Submit error:', err);
            setStatus('error');
            setMessage('Error creating post: ' + err.message);
        } finally {
            setUpload(false);
        }
    };

    return (
        <>
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0 }}>Create Post</h2>
                    {user && <span style={{ color: 'var(--primary-color)', fontSize: '0.9rem' }}>
                        Posting as <strong>{user.pseudoName}</strong>
                    </span>}
                </div>

                {status === 'success' && (
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        border: '1px solid currentColor'
                    }}>
                        {message}
                    </div>
                )}

                {status === 'error' && (
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        border: '1px solid currentColor'
                    }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Mode Selector - Tabs */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '0.25rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <button
                            type="button"
                            onClick={() => setPostMode('media')}
                            style={{
                                padding: '0.75rem',
                                background: postMode === 'media' ? '#a855f7' : 'transparent',
                                border: 'none',
                                borderRadius: '6px',
                                color: postMode === 'media' ? 'white' : '#94a3b8',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                outline: 'none'
                            }}
                        >
                            📸 Media Post
                        </button>
                        <button
                            type="button"
                            onClick={() => setPostMode('text')}
                            style={{
                                padding: '0.75rem',
                                background: postMode === 'text' ? '#a855f7' : 'transparent',
                                border: 'none',
                                borderRadius: '6px',
                                color: postMode === 'text' ? 'white' : '#94a3b8',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                outline: 'none'
                            }}
                        >
                            ✨ Text Post
                        </button>
                    </div>
                    {/* Title */}
                    <div className="input-group">
                        <label className="label" htmlFor="title">Title</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            className="input"
                            placeholder="What's on your mind?"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            style={{ fontSize: '16px' }}
                        />
                    </div>

                    {/* Description */}
                    <div className="input-group">
                        <label className="label" htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            className="textarea"
                            placeholder="Share your thoughts..."
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={4}
                            style={{ fontSize: '16px' }}
                        />
                    </div>

                    {/* Media Upload - Only show in media mode */}
                    {postMode === 'media' && (
                        <div className="input-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label className="label" style={{ margin: 0 }}>
                                    Media ({mediaFiles.length}/6)
                                </label>
                                {mediaFiles.length < 6 && (
                                    <label
                                        htmlFor="media-input"
                                        className="btn"
                                        style={{
                                            background: '#a855f7',
                                            padding: '0.4rem 1rem',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        + Add Media
                                    </label>
                                )}
                            </div>

                            <input
                                type="file"
                                id="media-input"
                                accept="image/*,video/*"
                                multiple
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />

                            {/* Media Grid */}
                            {mediaFiles.length > 0 && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                    gap: '0.75rem',
                                    marginTop: '1rem'
                                }}>
                                    {mediaFiles.map((item, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                position: 'relative',
                                                aspectRatio: '1/1',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                background: '#1e293b',
                                                border: '2px solid rgba(168, 85, 247, 0.3)'
                                            }}
                                        >
                                            {/* Preview */}
                                            {item.type === 'image' ? (
                                                <img
                                                    src={item.preview}
                                                    alt={`Media ${index + 1}`}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                            ) : (
                                                <video
                                                    src={item.preview}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                            )}

                                            {/* Video Duration/Trim Badge */}
                                            {item.type === 'video' && item.metadata && (
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: '3rem',
                                                    right: '0.5rem',
                                                    background: 'rgba(0,0,0,0.6)',
                                                    color: 'white',
                                                    padding: '0.2rem 0.4rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.7rem'
                                                }}>
                                                    ✂️ {Math.round(item.metadata.startTime)}s - {Math.round(item.metadata.endTime)}s
                                                    {item.metadata.music && ' 🎵'}
                                                </div>
                                            )}

                                            {/* Order Badge */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '0.5rem',
                                                left: '0.5rem',
                                                background: 'rgba(0,0,0,0.7)',
                                                color: 'white',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600'
                                            }}>
                                                {index + 1}
                                            </div>

                                            {/* Edited Badge */}
                                            {item.edited && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '0.5rem',
                                                    right: '0.5rem',
                                                    background: '#10b981',
                                                    color: 'white',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.7rem'
                                                }}>
                                                    ✓ Edited
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                                                padding: '2rem 0.5rem 0.5rem',
                                                display: 'flex',
                                                gap: '0.5rem',
                                                justifyContent: 'center'
                                            }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditMedia(index)}
                                                    style={{
                                                        background: 'rgba(255,255,255,0.2)',
                                                        border: 'none',
                                                        padding: '0.4rem 0.75rem',
                                                        borderRadius: '4px',
                                                        color: 'white',
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer',
                                                        backdropFilter: 'blur(4px)'
                                                    }}
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveMedia(index)}
                                                    style={{
                                                        background: 'rgba(239, 68, 68, 0.8)',
                                                        border: 'none',
                                                        padding: '0.4rem 0.75rem',
                                                        borderRadius: '4px',
                                                        color: 'white',
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    🗑️ Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
                                {mediaFiles.length === 0 ? 'Add 1-6 images or videos' :
                                    `${mediaFiles.length} files selected`}
                            </small>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem' }}
                        disabled={uploading}
                    >
                        {uploading ? 'Posting...' : 'Create Post'}
                    </button>
                </form>
            </div>

            {/* Media Preview Modal */}
            {editingIndex !== null && (
                <MediaPreview
                    file={mediaFiles[editingIndex].file}
                    type={mediaFiles[editingIndex].type}
                    onSave={handleSaveEditedMedia}
                    onCancel={() => setEditingIndex(null)}
                />
            )}

            {/* Text Post Creator Modal */}
            {showTextCreator && (
                <TextPostCreator
                    onSave={handleTextPostSave}
                    onCancel={() => setShowTextCreator(false)}
                />
            )}
        </>
    );
};

export default ReportForm;
