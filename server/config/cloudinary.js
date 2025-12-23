const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
console.log('[Cloudinary] Initializing with:');
console.log('  Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || '❌ NOT SET');
console.log('  API Key:', process.env.CLOUDINARY_API_KEY ? '✅ SET' : '❌ NOT SET');
console.log('  API Secret:', process.env.CLOUDINARY_API_SECRET ? `✅ SET (${process.env.CLOUDINARY_API_SECRET.length} chars)` : '❌ NOT SET');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage for post media (images and videos)
// Optimized for Cloudinary free tier - aggressive compression to save storage
const postStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        console.log('[Cloudinary] Processing post file:', file.originalname, file.mimetype);
        const isVideo = file.mimetype.startsWith('video/');

        if (isVideo) {
            // Video compression settings
            return {
                folder: 'xpoz/posts',
                resource_type: 'video',
                allowed_formats: ['mp4', 'mov', 'avi', 'webm'],
                // Compress videos: 720p max, lower bitrate, efficient codec
                transformation: [
                    { width: 1280, height: 720, crop: 'limit' },
                    { quality: 'auto:low' },
                    { video_codec: 'auto' }
                ]
            };
        }

        // Image compression settings
        return {
            folder: 'xpoz/posts',
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            format: 'webp', // Convert all images to WebP (60-80% smaller than JPEG)
            // Aggressive compression: limit width to 1200px, use low quality auto
            transformation: [
                { width: 1200, crop: 'limit' }, // Max 1200px wide, maintain aspect ratio
                { quality: 'auto:low' }, // Aggressive quality optimization
                { fetch_format: 'auto' } // Serve best format for browser
            ]
        };
    }
});

// Storage for avatars - small, heavily compressed
const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'xpoz/avatars',
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            format: 'webp',
            transformation: [
                { width: 200, height: 200, crop: 'fill', gravity: 'face' },
                { quality: 'auto:low' }
            ]
        };
    }
});

// Storage for chat attachments - supports all file types
const chatStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const isVideo = file.mimetype.startsWith('video/');
        const isImage = file.mimetype.startsWith('image/');
        const isAudio = file.mimetype.startsWith('audio/');

        if (isVideo) {
            return {
                folder: 'xpoz/chat',
                resource_type: 'video',
                allowed_formats: ['mp4', 'mov', 'avi', 'webm'],
                transformation: [{ width: 1280, crop: 'limit' }, { quality: 'auto:low' }]
            };
        }

        if (isImage) {
            return {
                folder: 'xpoz/chat',
                resource_type: 'image',
                allowed_formats: ['jpg', 'png', 'webp', 'gif'],
                format: 'webp',
                transformation: [{ width: 1200, crop: 'limit' }, { quality: 'auto:low' }]
            };
        }

        // For audio, documents, and all other file types
        return {
            folder: 'xpoz/chat',
            resource_type: 'raw', // Raw upload for non-media files
            allowed_formats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'mp3', 'wav', 'ogg', 'm4a', 'zip', 'rar']
        };
    }
});

module.exports = { cloudinary, postStorage, avatarStorage, chatStorage };
