import React, { useRef, useEffect } from 'react';

const VideoPlayer = ({ src, poster, startTime, endTime }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            // If we have an end time (and it's not 0 or very close to start), loop when reached
            if (endTime && endTime > (startTime || 0)) {
                if (video.currentTime >= endTime) {
                    video.currentTime = startTime || 0;
                    video.play();
                }
            }
        };

        const handleLoadedMetadata = () => {
            if (startTime) {
                video.currentTime = startTime;
            }
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);

        // Also force start time on initial play/seek if needed?
        // Usually loadedmetadata is enough for initial set.

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, [startTime, endTime]);

    return (
        <video
            ref={videoRef}
            src={src}
            poster={poster}
            controls
            style={{ width: '100%', maxHeight: '600px' }}
        />
    );
};

export default VideoPlayer;
