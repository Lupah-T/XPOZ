const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Check if credentials exist
if (process.env.FIREBASE_PRIVATE_KEY) {
    // Handle private key newlines possibly being escaped in .env
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });

    console.log('Firebase Admin Initialized');
} else {
    console.warn('WARNING: Firebase credentials not found in environment. File uploads will fail.');
}

const bucket = admin.storage().bucket();

module.exports = bucket;
