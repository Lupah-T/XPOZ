export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Log configuration on load for debugging
console.log('[Config] VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('[Config] Using API_URL:', API_URL);

// Warn if using localhost in production
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && API_URL.includes('localhost')) {
    console.warn('[Config] ⚠️ WARNING: Using localhost API URL in production! Check VITE_API_URL environment variable.');
}
