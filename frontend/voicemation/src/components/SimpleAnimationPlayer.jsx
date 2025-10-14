import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const SimpleAnimationPlayer = ({ videoUrl, isFullscreenMode = false, onToggleFullscreen }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    console.log('SimpleAnimationPlayer: URL changed to:', videoUrl);
    if (videoUrl) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [videoUrl]);

  const handleVideoLoad = () => {
    console.log('SimpleAnimationPlayer: Video loaded successfully');
    setIsLoading(false);
    setHasError(false);
  };

  const handleVideoError = (e) => {
    console.error('SimpleAnimationPlayer: Video error:', e);
    setIsLoading(false);
    setHasError(true);
  };

  const handleVideoClick = () => {
    if (!isFullscreenMode && onToggleFullscreen) {
      onToggleFullscreen(videoUrl);
    }
  };

  if (!videoUrl) {
    return (
      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">No video available</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="w-full h-48 bg-red-50 rounded-lg flex items-center justify-center">
        <span className="text-red-600">Failed to load video</span>
      </div>
    );
  }

  return (
    <div className={`relative ${isFullscreenMode ? 'w-full h-full' : 'w-full h-48'} bg-black rounded-lg overflow-hidden`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center z-10">
          <span className="text-gray-600">Loading...</span>
        </div>
      )}

      <video
        ref={videoRef}
        className={`w-full h-full object-contain ${!isFullscreenMode ? 'cursor-pointer' : ''}`}
        onClick={handleVideoClick}
        onLoadedData={handleVideoLoad}
        onError={handleVideoError}
        playsInline={true}
        controls={isFullscreenMode}
        muted={!isFullscreenMode}
        preload="metadata"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {!isFullscreenMode && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/60 rounded-full p-3">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleAnimationPlayer;
