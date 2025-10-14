import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AnimationPlayer({
  videoUrl,
  isFullscreenMode = false,
  onToggleFullscreen = null,
  onDownload = null,
  onShare = null,
  onReturnToChat = null  // New prop to handle returning to chat from any context
}) {
  // Add error boundary for this component
  const [componentError, setComponentError] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  // Early return if there's a component error
  if (componentError) {
    return (
      <div className="w-full h-full bg-gray-800 rounded-xl flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-red-400 mb-2">⚠️ Video Error</p>
          <p className="text-gray-400 text-sm mb-4">Failed to load animation</p>
          <button
            onClick={() => setComponentError(null)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Validate videoUrl early
  if (!videoUrl || typeof videoUrl !== 'string') {
    console.log('AnimationPlayer: Invalid videoUrl:', videoUrl);
    return (
      <div className="w-full h-full bg-gray-800 rounded-xl flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-gray-400">No video available</p>
        </div>
      </div>
    );
  }
  
  console.log('AnimationPlayer: Valid videoUrl received:', videoUrl);
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const progressBarRef = useRef(null);
  const volumeBarRef = useRef(null);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    if (!videoUrl) return;
    
    setIsLoading(true);
    setError(null);
    
    // Reset when URL changes
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [videoUrl]);

  // Track progress and duration
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const updateProgress = () => {
      setProgress(video.currentTime);
      setDuration(video.duration);
    };
    
    const updatePlayState = () => {
      setIsPlaying(!video.paused);
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('play', updatePlayState);
    video.addEventListener('pause', updatePlayState);
    video.addEventListener('durationchange', updateProgress);
    
    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('play', updatePlayState);
      video.removeEventListener('pause', updatePlayState);
      video.removeEventListener('durationchange', updateProgress);
    };
  }, [videoRef.current]);

  // Loop functionality
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.loop = isLooping;
    }
  }, [isLooping]);

  // Playback rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Volume control
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Auto-hide controls
  useEffect(() => {
    if (isPlaying && isFullscreenMode) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, isFullscreenMode]);

  const handleVideoLoaded = () => {
    try {
      setIsLoading(false);
      if (videoRef.current) {
        setDuration(videoRef.current.duration);
      }
    } catch (err) {
      console.error('Error in handleVideoLoaded:', err);
      setComponentError(err.message);
    }
  };

  const handleVideoClick = (e) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      togglePlayPause();
    } catch (err) {
      console.error('Error in handleVideoClick:', err);
      setComponentError(err.message);
    }
  };

  const handleVideoError = () => {
    try {
      setIsLoading(false);
      setError('Could not load the animation. Please try again.');
    } catch (err) {
      console.error('Error in handleVideoError:', err);
      setComponentError(err.message);
    }
  };
  
  const clearError = () => {
    setError(null);
    setIsLoading(false);
    
    // Reset any UI state that might have been affected during error display
    setIsFullscreen(false);
    setShowControls(true);
    
    // If in fullscreen mode, we should return to chat via onToggleFullscreen
    // This is handled by the specific button in the error state UI
  };
  
  // Format time as 0:00
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const togglePlayPause = () => {
    try {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play().catch(err => {
            console.error('Error playing video:', err);
            setError('Failed to play video');
          });
        }
        setIsPlaying(!isPlaying);
        setShowControls(true);
      }
    } catch (err) {
      console.error('Error in togglePlayPause:', err);
      setComponentError(err.message);
    }
  };

  const toggleMute = () => {
    try {
      setIsMuted(!isMuted);
      setShowControls(true);
    } catch (err) {
      console.error('Error in toggleMute:', err);
      setComponentError(err.message);
    }
  };

  const toggleLoop = () => {
    setIsLooping(!isLooping);
    setShowControls(true);
  };

  const toggleFullscreen = () => {
    if (onToggleFullscreen) {
      onToggleFullscreen();
    } else {
      // Fallback fullscreen handling if not in modal
      setIsFullscreen(!isFullscreen);
      
      if (!isFullscreen) {
        if (playerContainerRef.current.requestFullscreen) {
          playerContainerRef.current.requestFullscreen();
        } else if (playerContainerRef.current.webkitRequestFullscreen) {
          playerContainerRef.current.webkitRequestFullscreen();
        } else if (playerContainerRef.current.msRequestFullscreen) {
          playerContainerRef.current.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    }
    setShowControls(true);
  };

  const changePlaybackRate = (rate) => {
    setPlaybackRate(rate);
    setShowControls(true);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Fallback download logic
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `animation-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    setShowControls(true);
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      // Fallback share logic
      if (navigator.share) {
        navigator.share({
          title: 'Check out this animation',
          text: 'I created this animation with Voicemation',
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(window.location.href)
          .then(() => {
            alert('Link copied to clipboard!');
          });
      }
    }
    setShowControls(true);
  };

  const handleProgressBarClick = (e) => {
    if (!videoRef.current || !progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * videoRef.current.duration;
    setProgress(videoRef.current.currentTime);
    setShowControls(true);
  };

  const handleVolumeChange = (e) => {
    if (!volumeBarRef.current) return;
    
    const rect = volumeBarRef.current.getBoundingClientRect();
    const newVolume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    setShowControls(true);
  };

  const handleMouseMove = () => {
    if (isFullscreenMode) {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    }
  };

  return (
    <div 
      className={`relative w-full h-full rounded-xl overflow-hidden animation-player`} 
      ref={playerContainerRef}
      onMouseMove={handleMouseMove}
    >
      {videoUrl ? (
        <>
          <div className={`group relative h-full ${isFullscreenMode ? '' : 'rounded-xl'} overflow-hidden`}>
            <motion.video
              ref={videoRef}
              className={`${isFullscreenMode ? 'h-full w-full object-contain' : 'rounded-xl shadow-md w-full h-full object-cover'} cursor-pointer`}
              style={{ minHeight: '100%' }}
              onClick={handleVideoClick}
              onLoadedData={handleVideoLoaded}
              onError={handleVideoError}
              onEnded={() => setIsPlaying(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: isLoading ? 0.3 : 1 }}
              transition={{ duration: 0.5 }}
              controls={false}
              playsInline={true}
              preload="metadata"
              webkit-playsinline="true"
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support video playback.
            </motion.video>
            
            {/* Enhanced controls overlay - visible on hover or when controls are forced visible */}
            {(showControls || !isPlaying || !isFullscreenMode) && (
              <motion.div 
                className={`absolute inset-0 flex flex-col items-center justify-center ${
                  isFullscreenMode 
                    ? 'bg-gradient-to-b from-black/40 via-transparent to-black/80' 
                    : 'bg-gradient-to-b from-transparent via-transparent to-black/30 group-hover:to-black/50'
                } transition-all duration-300`}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Main play/pause control */}
                <motion.div className="flex-1 flex items-center justify-center w-full">
                  <motion.button
                    onClick={togglePlayPause}
                    className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-500/90 hover:to-indigo-500/90 text-white shadow-2xl backdrop-blur-sm border border-white/20"
                    whileHover={{ 
                      scale: 1.08, 
                      boxShadow: "0 0 30px rgba(37, 99, 235, 0.6)",
                      y: -2
                    }}
                    whileTap={{ 
                      scale: 0.95,
                      y: 0,
                      boxShadow: "0 0 15px rgba(37, 99, 235, 0.4)"
                    }}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    {isPlaying ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="4" height="16" rx="1" strokeWidth={2} />
                        <rect x="14" y="4" width="4" height="16" rx="1" strokeWidth={2} />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                    )}
                  </motion.button>
                </motion.div>
                
                {/* Fullscreen mode controls */}
                {isFullscreenMode && (
                  <div className="w-full px-4 pb-4">
                    {/* Progress bar */}
                    <div 
                      className="w-full h-1.5 bg-gray-700/50 rounded-full mb-3 cursor-pointer relative overflow-hidden"
                      ref={progressBarRef}
                      onClick={handleProgressBarClick}
                    >
                      <motion.div 
                        className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                        style={{ width: `${(progress / duration) * 100}%` }}
                        initial={{ width: "0%" }}
                        animate={{ width: `${(progress / duration) * 100}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                    
                    {/* Controls row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Play/Pause */}
                        <motion.button
                          onClick={togglePlayPause}
                          className="w-8 h-8 rounded-full bg-white/10 hover:bg-blue-500/30 transition-colors flex items-center justify-center border border-white/10"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {isPlaying ? (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <rect x="6" y="4" width="4" height="16" rx="1" strokeWidth={2} />
                              <rect x="14" y="4" width="4" height="16" rx="1" strokeWidth={2} />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            </svg>
                          )}
                        </motion.button>
                        
                        {/* Loop */}
                        <motion.button
                          onClick={toggleLoop}
                          className={`w-8 h-8 rounded-full flex items-center justify-center border border-white/10 ${isLooping ? 'bg-blue-500/30 text-white' : 'bg-white/10 hover:bg-blue-500/20 text-white'}`}
                          title={isLooping ? "Loop: On" : "Loop: Off"}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </motion.button>
                        
                        {/* Mute/Unmute */}
                        <motion.button
                          onClick={toggleMute}
                          className="w-8 h-8 rounded-full bg-white/10 hover:bg-blue-500/30 flex items-center justify-center border border-white/10"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title={isMuted ? "Unmute" : "Mute"}
                        >
                          {isMuted ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                          )}
                        </motion.button>
                        
                        {/* Volume slider */}
                        <div 
                          className="w-20 h-1.5 bg-gray-700/50 rounded-full cursor-pointer relative hidden sm:block"
                          ref={volumeBarRef}
                          onClick={handleVolumeChange}
                        >
                          <motion.div 
                            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                            style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                          />
                        </div>
                        
                        {/* Timestamp */}
                        <span className="text-xs text-white/70 ml-1">
                          {formatTime(progress)} / {formatTime(duration)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {/* Playback speed */}
                        <div className="relative group">
                          <motion.button 
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                              playbackRate !== 1 
                                ? 'bg-blue-500/30 text-blue-200 border border-blue-400/20' 
                                : 'bg-white/10 hover:bg-blue-500/30 text-white border border-white/10'
                            }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {playbackRate}x
                          </motion.button>
                          <div className="absolute bottom-full right-0 mb-2 bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 transform scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 origin-bottom-right py-1">
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                              <motion.button 
                                key={rate} 
                                onClick={() => changePlaybackRate(rate)}
                                className={`block w-full text-left px-4 py-1.5 text-xs font-medium ${
                                  playbackRate === rate 
                                    ? 'text-blue-300 bg-blue-900/50 border-l-2 border-blue-500' 
                                    : 'text-white hover:bg-gray-700/80'
                                }`}
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                {rate}x
                              </motion.button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Download */}
                        <motion.button
                          onClick={handleDownload}
                          className="w-8 h-8 rounded-full bg-white/10 hover:bg-blue-500/30 flex items-center justify-center border border-white/10"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Download"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </motion.button>
                        
                        {/* Share */}
                        <motion.button
                          onClick={handleShare}
                          className="w-8 h-8 rounded-full bg-white/10 hover:bg-blue-500/30 flex items-center justify-center border border-white/10"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Share"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </motion.button>
                        
                        {/* Only show fullscreen button in fullscreen mode */}
                        {isFullscreenMode && (
                          <motion.button
                            onClick={toggleFullscreen}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-blue-500/30 flex items-center justify-center border border-white/10"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Exit Fullscreen"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Basic title badge at bottom - only for non-fullscreen mode */}
                {!isFullscreenMode && (
                  <motion.div 
                    className="w-full py-2 px-4 flex items-center justify-start"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="text-sm text-white/90 font-medium backdrop-blur-sm bg-black/30 py-1 px-2 rounded-md">
                      Physics Animation
                    </span>
                    {/* Removed redundant fullscreen button - we use the "Play Fullscreen" button below instead */}
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
          
          {isLoading && (
            <motion.div 
              className="absolute inset-0 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="relative mb-4">
                  <motion.div 
                    className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }}
                  />
                  <motion.div 
                    className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full relative z-10"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                <motion.p 
                  className="text-base text-blue-200 font-medium"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Loading animation...
                </motion.p>
              </motion.div>
            </motion.div>
          )}
          
          {error && (
            <motion.div 
              className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-sm rounded-xl z-50 h-full"
              style={{ minHeight: '100%' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 }}
                className="flex flex-col items-center px-6 py-8 max-w-sm bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-800/50 w-full"
              >
                {/* Removed redundant close button - we use the Dismiss Error button instead */}
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ 
                    scale: [0.8, 1.1, 1],
                    rotate: [0, -10, 10, -5, 5, 0]
                  }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                  className="relative mb-4"
                >
                  <div className={`absolute inset-0 bg-red-500/20 rounded-full blur-xl transform ${isFullscreenMode ? 'scale-125' : 'scale-110'}`}></div>
                  <svg className={`${isFullscreenMode ? 'w-16 h-16' : 'w-12 h-12'} text-red-500 relative z-10`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </motion.div>
                <motion.h3 
                  className={`${isFullscreenMode ? 'text-2xl' : 'text-xl'} text-white font-medium mb-3`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Could not load the animation
                </motion.h3>
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className={`text-center ${isFullscreenMode ? 'text-blue-200/90' : 'text-sm text-blue-200/80'}`}>
                    Please try again or use a different animation request.
                  </p>
                </motion.div>
                <motion.div 
                  className="flex flex-col w-full space-y-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.button 
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-full shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 border border-blue-500/50 font-medium w-full"
                    whileHover={{ 
                      scale: 1.05, 
                      y: -3,
                      boxShadow: "0 15px 30px -5px rgba(30, 64, 175, 0.4)"
                    }}
                    whileTap={{ 
                      scale: 0.95,
                      y: 0,
                      boxShadow: "0 5px 15px -3px rgba(30, 64, 175, 0.3)"
                    }}
                    onClick={clearError}
                    title="Try Again"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </motion.button>
                  
                  {isFullscreenMode && (
                    <motion.button 
                      className="px-6 py-2.5 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-full shadow-lg border border-gray-600/50 flex items-center justify-center gap-2 font-medium w-full"
                      whileHover={{ 
                        scale: 1.05, 
                        y: -3,
                        boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.3)"
                      }}
                      whileTap={{ 
                        scale: 0.95,
                        y: 0,
                        boxShadow: "0 5px 15px -3px rgba(0, 0, 0, 0.2)"
                      }}
                      onClick={() => {
                        clearError();
                        if (onToggleFullscreen) {
                          onToggleFullscreen();
                        } else if (onReturnToChat) {
                          onReturnToChat();
                        }
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Return to Chat
                    </motion.button>
                  )}
                  
                  {!isFullscreenMode && (
                    <motion.button 
                      className="px-6 py-2.5 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-full shadow-lg border border-gray-600/50 flex items-center justify-center gap-2 font-medium w-full"
                      whileHover={{ 
                        scale: 1.05, 
                        y: -3,
                        boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.3)"
                      }}
                      whileTap={{ 
                        scale: 0.95,
                        y: 0,
                        boxShadow: "0 5px 15px -3px rgba(0, 0, 0, 0.2)"
                      }}
                      onClick={() => {
                        clearError();
                        if (onReturnToChat) {
                          onReturnToChat();
                        }
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Return to Chat
                    </motion.button>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </>
      ) : (
        <motion.div 
          className="absolute inset-0 bg-gray-900/80 rounded-xl p-8 text-center flex flex-col items-center justify-center backdrop-blur-sm border border-gray-800/40 h-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 rounded-full bg-blue-900/40 flex items-center justify-center mb-4"
          >
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </motion.div>
          <p className="text-blue-200 text-sm">Ready to display your animation</p>
          <p className="text-blue-300/50 text-xs mt-2">Describe what you'd like to see</p>
        </motion.div>
      )}
    </div>
  );
}
