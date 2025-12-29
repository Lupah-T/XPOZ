/**
 * Formats a date for "Last Seen" status.
 * e.g., "Today at 10:30 AM", "Yesterday at 5:00 PM", "Mon, 27 Dec, 10:30 AM"
 */
export const formatLastSeen = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
        return `Today at ${timeStr}`;
    } else if (isYesterday) {
        return `Yesterday at ${timeStr}`;
    } else {
        const options = { weekday: 'short', day: 'numeric', month: 'short' };
        return `${date.toLocaleDateString([], options)}, ${timeStr}`;
    }
};

/**
 * Formats a date for message bubbles.
 * e.g., "Today, 10:30 AM", "Yesterday, 5:00 PM", "Mon, 10:30 AM"
 */
export const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
        return timeStr;
    } else if (isYesterday) {
        return `Yesterday, ${timeStr}`;
    } else {
        const options = { weekday: 'short', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString([], options);
    }
};
