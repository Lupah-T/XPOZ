const bucket = require('../config/firebase');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Uploads a file buffer to Firebase Storage
 * @param {Buffer} buffer - File content
 * @param {string} destinationFolder - Folder path in bucket (e.g. 'avatars/')
 * @param {string} mimetype - File mime type
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
const uploadToFirebase = (buffer, destinationFolder, mimetype) => {
    return new Promise((resolve, reject) => {
        if (!bucket) {
            return reject(new Error('Firebase Storage bucket not initialized'));
        }

        const fileName = `${uuidv4()}_${Date.now()}`;
        const fileExtension = mimetype.split('/')[1] || '';
        const fullPath = `${destinationFolder}${fileName}.${fileExtension}`;

        const file = bucket.file(fullPath);
        const stream = file.createWriteStream({
            metadata: {
                contentType: mimetype,
            },
        });

        stream.on('error', (e) => {
            reject(e);
        });

        stream.on('finish', async () => {
            // Make the file public
            try {
                await file.makePublic();
                // Construct public URL
                // Format: https://storage.googleapis.com/BUCKET_NAME/PATH
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fullPath}`;
                resolve(publicUrl);
            } catch (err) {
                reject(err);
            }
        });

        stream.end(buffer);
    });
};

module.exports = { uploadToFirebase };
