import { API_URL } from '../config';

/**
 * Helper function to get the correct media URL
 * @param {string} url - Relative or absolute URL of the media
 * @returns {string|null} - Absolute URL
 */
export const getMediaUrl = (url) => {
    if (!url) return null;

    // If URL is already absolute (starts with http:// or https://), use it directly
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // Otherwise, prepend API_URL for relative paths
    // Ensure we don't have double slashes if it matters, but usually it doesn't.
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `${API_URL}/${cleanUrl}`;
};
