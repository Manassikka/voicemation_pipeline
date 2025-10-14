import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SimpleAnimationPlayer from './SimpleAnimationPlayer';
import ErrorBoundary from './ErrorBoundary';

// Reusable Button Component for consistent styling
const ActionButton = ({ onClick, icon, text, variant = 'primary', className = '', initial = {}, animate = {}, delay = 0, testId = '' }) => {
  // Button style variants with improved styling
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-900/30 border border-blue-500/50",
    secondary: "bg-gradient-to-r from-blue-600/30 to-blue-500/30 hover:from-blue-600/50 hover:to-blue-500/50 text-blue-200 backdrop-blur-sm border border-blue-500/20",
    danger: "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-900/30 border border-red-500/50",
    neutral: "bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white shadow-lg shadow-gray-900/30 border border-gray-600/50",
    success: "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg shadow-green-900/30 border border-green-500/50",
    glass: "bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/15 text-white backdrop-blur-sm border border-white/10"
  };

  return (
    <motion.button
      data-testid={testId}
      initial={{ opacity: 0, y: 5, ...initial }}
      animate={{ opacity: 1, y: 0, ...animate }}
      transition={{ delay: delay, type: "spring", stiffness: 500, damping: 30 }}
      whileHover={{ 
        scale: 1.05, 
        y: -3,
        boxShadow: "0 15px 25px -5px rgba(0, 0, 0, 0.3)",
        transition: { duration: 0.2 }
      }}
      whileTap={{ 
        scale: 0.95, 
        y: 0,
        boxShadow: "0 5px 15px -3px rgba(0, 0, 0, 0.2)" 
      }}
      onClick={onClick}
      className={`py-2 px-5 rounded-full flex items-center justify-center gap-2 font-medium text-sm transition-all ${variants[variant]} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {text && <span>{text}</span>}
    </motion.button>
  );
};

export default function VoiceInput({ onResult, currentAnimation, isGenerating, onClearAnimation }) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [animationSubmitted, setAnimationSubmitted] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [animationHistory, setAnimationHistory] = useState([]);
  const inputRef = useRef(null);
  const suggestionsContainerRef = useRef(null);
  const autoScrollIntervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const suggestions = [
    "Show me a pendulum wave animation",
    "Create a magnetic field visualization",
    "Animate a double pendulum",
    "Visualize wave interference patterns",
    "Show projectile motion with air resistance"
  ];

  // Show suggestions on load until user submits an animation
  useEffect(() => {
    if (!currentAnimation && !animationSubmitted) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [currentAnimation, animationSubmitted]);

  // Improved auto-scroll suggestions horizontally with better interaction handling
  useEffect(() => {
    if (showSuggestions && suggestionsContainerRef.current) {
      // Initial longer delay before starting scroll to give user time to interact
      const startScrollTimeout = setTimeout(() => {
        const container = suggestionsContainerRef.current;
        if (!container) return;
        
        // Function to auto scroll with smooth behavior
        const autoScroll = () => {
          if (!container) return;
          
          // Check if user is interacting with the container
          if (container.matches(':hover')) {
            return; // Skip scrolling if user is hovering
          }
          
          // Scroll by smaller amount every interval - slower speed for better UX and click reliability
          if (container.scrollLeft < (container.scrollWidth - container.clientWidth - 2)) {
            container.scrollLeft += 0.5; // Slower, more subtle scrolling
          } else {
            // When reached the end, pause briefly, then reset to beginning with a fade effect
            clearInterval(autoScrollIntervalRef.current);
            
            // Add a brief pause at the end before looping
            setTimeout(() => {
              if (container) {
                // Animate scrolling back to beginning with smooth behavior
                container.scrollTo({
                  left: 0,
                  behavior: 'smooth'
                });
                
                // Wait for scroll-back animation to complete before restarting
                setTimeout(() => {
                  // Restart scrolling after reset
                  if (showSuggestions) { // Only restart if still showing suggestions
                    autoScrollIntervalRef.current = setInterval(autoScroll, 40); // Slightly slower interval
                  }
                }, 800);
              }
            }, 3000); // Longer pause at the end for better interaction opportunities
          }
        };
        
        // Start auto-scrolling with a slower interval
        autoScrollIntervalRef.current = setInterval(autoScroll, 40);
      }, 3500); // Wait 3.5s before starting auto-scroll, giving user more time to interact initially
      
      // Clean up function
      return () => {
        clearTimeout(startScrollTimeout);
        if (autoScrollIntervalRef.current) {
          clearInterval(autoScrollIntervalRef.current);
        }
      };
    }
  }, [showSuggestions]);

  const startListening = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Audio recording is not supported in your browser');
      return;
    }

    try {
      // Start recording audio
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        // Create audio blob and send to Flask backend
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        try {
          setListening(false);
          setRecording(false);
          
          // Show processing state
          setText('Processing audio...');
          
        try {
          // Send audio to Flask backend
          const formData = new FormData();
          formData.append('audio', audioBlob, 'speech.webm');

          const response = await fetch('/generate_audio', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();

          if (result.video_url && result.video_url.trim()) {
            // Successfully generated animation
            const animationData = {
              id: Date.now(),
              videoUrl: result.video_url, // Use relative URL since we have proxy
              text: result.text || 'Voice-generated animation', // Use recognized text from backend
              timestamp: new Date().toLocaleTimeString()
            };
            
            console.log('Generated animation:', animationData); // Debug log
            console.log('Current animation history length:', animationHistory.length);
            
            // Add to animation history with safety check
            try {
              setAnimationHistory(prev => {
                const newHistory = [...prev, animationData];
                console.log('New animation history length:', newHistory.length);
                console.log('Latest animation video URL:', animationData.videoUrl);
                return newHistory;
              });
              
              setText('');
              setAnimationSubmitted(true);
              onResult(animationData);
              
              // Small delay to ensure state update completes
              setTimeout(() => {
                console.log('Animation successfully added to history');
              }, 100);
            } catch (error) {
              console.error('Error adding animation to history:', error);
              // Still call onResult even if history update fails
              onResult(animationData);
            }
          } else {
            // Handle error from backend
            const errorMessage = result.error || 'Failed to generate animation - no video URL received';
            console.error('Backend error:', errorMessage);
            setText('');
            alert('Error: ' + errorMessage);
          }
        } catch (error) {
          // Handle network or other errors
          console.error('Request failed:', error);
          setText('');
          alert('Network error: ' + error.message);
        }
        } catch (error) {
          console.error('Error sending audio to backend:', error);
          setText('');
          alert('Network error: ' + error.message);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        setListening(false);
        setRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      mediaRecorder.start();
      setListening(true);
      setRecording(true);
      setText('Recording...');

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone: ' + error.message);
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onResult(text);
      setAnimationSubmitted(true);
      setText('');
    }
  };

  const useSuggestion = (suggestion) => {
    setText(suggestion);
    setAnimationSubmitted(true);
    setTimeout(() => onResult(suggestion), 300);
  };
  
  // Method to focus the input when called from parent
  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Expose the focus method
  useEffect(() => {
    if (inputRef.current && typeof window !== 'undefined') {
      window.focusVoiceInput = focusInput;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.focusVoiceInput;
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Animation History Section */}
      {animationHistory.length > 0 && (
        <motion.div 
          className="w-full space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-blue-200">Generated Animations</h3>
            <motion.button
              onClick={() => setAnimationHistory([])}
              className="text-gray-400 hover:text-red-400 text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear All
            </motion.button>
          </div>
          
          <ErrorBoundary>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {animationHistory.map((animation, index) => (
                <motion.div
                  key={animation.id}
                  className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  data-animation-id={animation.id}
                >
                  <div className="aspect-video relative">
                    <ErrorBoundary>
                      <SimpleAnimationPlayer 
                        videoUrl={animation.videoUrl}
                        isFullscreenMode={false}
                      />
                    </ErrorBoundary>
                  </div>
                <div className="p-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-blue-200 font-medium">Animation #{index + 1}</p>
                    <p className="text-xs text-gray-400">{animation.timestamp}</p>
                  </div>
                  <motion.button
                    onClick={() => {
                      setShowFullscreenModal(animation);
                    }}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-200 text-xs rounded-lg border border-blue-500/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View Fullscreen
                  </motion.button>
                </div>
              </motion.div>
            ))}
            </div>
          </ErrorBoundary>
        </motion.div>
      )}

      {/* Responsive container without fixed height */}
      <div className="relative w-full min-h-[80px]"> {/* Changed from h-[240px] to min-h-[80px] */}
        <AnimatePresence mode="crossfade">
          {/* Simplified loading indicator */}
          {!currentAnimation && isGenerating && (
            <motion.div 
              key="generating"
              className="w-full py-6 flex flex-col items-center justify-center border border-blue-900/30 bg-gray-800/50 rounded-xl"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 25,
                opacity: { duration: 0.2 }
              }}
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <motion.span 
                  className="text-blue-100 text-sm font-medium"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Creating your animation...
                </motion.span>
              </div>
            </motion.div>
          )}

          {/* Enhanced single line scrollable suggestion chips */}
          {!currentAnimation && !isGenerating && showSuggestions && (
            <motion.div 
              key="suggestions"
              className="w-full py-3 relative mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 400, damping: 25 }}
            >
              {/* Gradient fade edges to indicate more content - ensure they don't block clicks */}
              <div className="absolute left-0 right-0 flex justify-center h-full top-0 pointer-events-none">
                <div className="w-20 h-full bg-gradient-to-r from-gray-900 via-gray-900/90 to-transparent absolute left-0"></div>
                <div className="w-20 h-full bg-gradient-to-l from-gray-900 via-gray-900/90 to-transparent absolute right-0"></div>
              </div>
              
              {/* Scrollable container with auto-scroll behavior - ensure buttons are clickable */}
              <div 
                ref={suggestionsContainerRef} 
                className="overflow-x-auto scrollbar-hide py-1 flex flex-nowrap gap-3 justify-start px-12 max-w-full mx-auto scroll-smooth relative z-20"
                onMouseEnter={() => {
                  // Pause auto-scroll when mouse enters
                  if (autoScrollIntervalRef.current) {
                    clearInterval(autoScrollIntervalRef.current);
                  }
                }}
                onTouchStart={() => {
                  // Pause auto-scroll when touched (mobile)
                  if (autoScrollIntervalRef.current) {
                    clearInterval(autoScrollIntervalRef.current);
                  }
                }}
                onTouchEnd={() => {
                  // Resume auto-scroll with a slight delay after touch ends on mobile
                  setTimeout(() => {
                    if (suggestionsContainerRef.current && showSuggestions) {
                      const container = suggestionsContainerRef.current;
                      autoScrollIntervalRef.current = setInterval(() => {
                        if (container && container.scrollLeft < (container.scrollWidth - container.clientWidth - 2)) {
                          container.scrollLeft += 0.7;
                        } else if (container) {
                          clearInterval(autoScrollIntervalRef.current);
                          setTimeout(() => {
                            container.scrollTo({ left: 0, behavior: 'smooth' });
                          }, 1000);
                        }
                      }, 30);
                    }
                  }, 3000); // Wait 3s after touch end before resuming
                }}
                onMouseLeave={() => {
                  // Restart auto-scroll when mouse leaves
                  if (suggestionsContainerRef.current && showSuggestions) {
                    const container = suggestionsContainerRef.current;
                    autoScrollIntervalRef.current = setInterval(() => {
                      if (container && container.scrollLeft < (container.scrollWidth - container.clientWidth - 2)) {
                        container.scrollLeft += 0.7;
                      } else if (container) {
                        // Reset with smooth animation
                        clearInterval(autoScrollIntervalRef.current);
                        
                        setTimeout(() => {
                          container.scrollTo({
                            left: 0,
                            behavior: 'smooth'
                          });
                          
                          // Restart after reset animation completes
                          setTimeout(() => {
                            if (showSuggestions) {
                              autoScrollIntervalRef.current = setInterval(() => {
                                if (container && container.scrollLeft < (container.scrollWidth - container.clientWidth - 2)) {
                                  container.scrollLeft += 0.7;
                                } else if (container) {
                                  container.scrollLeft = 0;
                                }
                              }, 30);
                            }
                          }, 800);
                        }, 1000);
                      }
                    }, 30);
                  }
                }}>
                
                {/* Suggestion chips with staggered animation */}
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    className="py-2 px-5 text-sm font-medium whitespace-nowrap rounded-full 
                              bg-gradient-to-r from-blue-900/40 to-indigo-900/40 text-blue-200 
                              border border-blue-700/30 hover:from-blue-800/50 hover:to-indigo-800/50 
                              hover:text-blue-100 hover:border-blue-600/40 
                              shadow-md shadow-blue-900/20 flex-shrink-0 mx-1
                              transition-all duration-300 ease-out relative z-30
                              cursor-pointer"
                    onClick={(e) => {
                      // Stop propagation and prevent default to ensure click is registered
                      e.stopPropagation();
                      e.preventDefault();
                      
                      // Clear auto-scroll interval when a suggestion is clicked
                      if (autoScrollIntervalRef.current) {
                        clearInterval(autoScrollIntervalRef.current);
                      }
                      
                      // Add a visual feedback before using the suggestion
                      const button = e.currentTarget;
                      button.style.transform = 'scale(0.95)';
                      
                      // Use setTimeout to ensure the animation is visible before navigating
                      setTimeout(() => {
                        useSuggestion(suggestion);
                      }, 150);
                    }}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    transition={{ 
                      delay: index * 0.07,
                      type: "spring",
                      stiffness: 400,
                      damping: 17
                    }}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -2,
                      boxShadow: "0 10px 20px -5px rgba(30, 64, 175, 0.3)"
                    }}
                    whileTap={{ 
                      scale: 0.95,
                      boxShadow: "0 5px 10px -3px rgba(30, 64, 175, 0.2)"
                    }}
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Enhanced input with animated gradient effects */}
      <motion.div 
        className="w-full relative mt-4 pb-6" // Added padding bottom
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          delay: 0.2,
          type: "spring",
          stiffness: 400,
          damping: 25
        }}
      >
        {/* Spotlight effect behind input */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-32 bg-blue-900/5 blur-[80px] rounded-full"></div>
        
        <form onSubmit={handleSubmit} className="w-full VoiceInputComponent relative">
          <div className="relative w-full max-w-3xl mx-auto">
            {/* Enhanced animated gradient border & glow effect */}
            <motion.div 
              className="absolute -inset-0.5 rounded-full z-0 opacity-80"
              style={{ 
                background: "linear-gradient(90deg, #3B82F6, #8B5CF6, #3B82F6)",
                backgroundSize: "200% 100%",
                filter: "blur(4px)"
              }}
              animate={{
                backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            
            {/* Inner shadow effect */}
            <div className="absolute inset-[1px] rounded-full z-5 bg-gradient-to-b from-white/5 to-transparent"></div>
            
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Describe an animation you'd like to create..."
                className="w-full h-16 px-7 pr-16 rounded-full bg-gray-800/95 backdrop-blur-sm border border-blue-800/40
                        text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500/50
                        shadow-lg shadow-blue-900/30 relative z-10 transition-all duration-300 text-base"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit(e);
                  }
                }}
              />
              
              {/* Small shine effect */}
              <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent z-20"></div>
            </div>

            {/* Enhanced microphone button with ripple effect */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-20">
              <motion.button
                type="button"
                onClick={recording ? stopListening : startListening}
                disabled={listening && !recording}
                className="relative w-12 h-12 flex items-center justify-center 
                          rounded-full z-10 bg-gradient-to-r from-blue-600 to-indigo-600
                          hover:from-blue-500 hover:to-indigo-500 shadow-xl
                          border border-blue-500/30"
                whileHover={{ 
                  scale: 1.08,
                  boxShadow: "0 0 20px rgba(59, 130, 246, 0.6)",
                  y: -3
                }}
                whileTap={{ 
                  scale: 0.95, 
                  y: 0,
                  boxShadow: "0 0 10px rgba(59, 130, 246, 0.4)"
                }}
                animate={{
                  boxShadow: recording 
                    ? ["0 0 15px rgba(59, 130, 246, 0.5)", "0 0 25px rgba(59, 130, 246, 0.8)", "0 0 15px rgba(59, 130, 246, 0.5)"] 
                    : "0 0 15px rgba(59, 130, 246, 0.3)"
                }}
                transition={{
                  boxShadow: {
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }
                }}
              >
                {/* Pulse effect */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-blue-500/80 z-0"
                  initial={{ scale: 0.85, opacity: 0.5 }}
                  animate={{
                    scale: [0.85, 1.2, 0.85],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {recording && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ 
                        opacity: [0.2, 0.5, 0.2], 
                        scale: [1, 1.4, 1] 
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "loop"
                      }}
                      className="absolute inset-0 border-2 border-blue-400/40 rounded-full"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ 
                        opacity: [0.1, 0.3, 0.1], 
                        scale: [1, 1.8, 1] 
                      }}
                      transition={{
                        duration: 2.5,
                        delay: 0.2,
                        repeat: Infinity,
                        repeatType: "loop"
                      }}
                      className="absolute inset-0 border-2 border-blue-300/30 rounded-full"
                    />
                  </>
                )}
                
                <svg
                  className={`w-6 h-6 ${recording ? 'text-white animate-pulse' : 'text-white'} relative z-10`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {recording ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 6h12v12H6z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  )}
                </svg>
              </motion.button>
            </div>
          </div>
        </form>

        {/* Enhanced helper text */}
        <div className="text-center mt-3">
          <motion.span 
            className="text-sm text-blue-300/80 backdrop-blur-sm bg-gray-800/30 px-4 py-1.5 rounded-full"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Describe a physics or math animation
          </motion.span>
        </div>
      </motion.div>

      {/* Enhanced listening indicator modal */}
      <AnimatePresence>
        {recording && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Simple backdrop */}
            <motion.div 
              className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="relative rounded-xl p-6 max-w-sm w-full mx-4 flex flex-col items-center z-10"
              style={{
                background: "linear-gradient(135deg, rgba(30, 58, 138, 0.7) 0%, rgba(30, 41, 99, 0.9) 100%)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(96, 165, 250, 0.3)",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
              }}
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Simplified sound indicator */}
              <div className="flex items-center justify-center mb-4 gap-2">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-8 rounded-full bg-blue-500"
                    animate={{
                      height: [
                        "8px",
                        `${Math.random() * 24 + 8}px`,
                        "8px"
                      ]
                    }}
                    transition={{
                      duration: 0.4 + Math.random() * 0.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.05
                    }}
                    style={{
                      transformOrigin: "bottom"
                    }}
                  />
                ))}
              </div>
              <p className="text-center text-xl text-white font-medium mb-2">
                Recording...
              </p>
              <p className="text-center text-blue-200 mb-4 text-sm">
                Describe a physics or math animation
              </p>
              {/* Status indicator */}
              {text && text !== 'Recording...' && (
                <motion.div 
                  className="mt-2 bg-blue-900/30 px-4 py-3 rounded-lg border border-blue-600/30 w-full"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-blue-100 text-center">
                    {text}
                  </p>
                </motion.div>
              )}
              <motion.button
                className="mt-4 px-4 py-1.5 bg-red-600/80 hover:bg-red-600 rounded-full text-sm text-white border border-red-500/50"
                onClick={stopListening}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Stop Recording
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Fullscreen Animation Modal */}
      <AnimatePresence>
        {showFullscreenModal && (
          <ErrorBoundary>
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Backdrop */}
              <motion.div 
                className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFullscreenModal(false)}
              />
              
              {/* Modal Content */}
              <motion.div
                className="relative w-full h-full max-w-7xl max-h-screen p-4 flex flex-col"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Animation Viewer</h2>
                <motion.button
                  onClick={() => setShowFullscreenModal(false)}
                  className="w-10 h-10 rounded-full bg-gray-800/80 hover:bg-gray-700/80 flex items-center justify-center text-gray-300 hover:text-white border border-gray-600/50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
              
              {/* Video Player */}
              <div className="flex-1 rounded-xl overflow-hidden">
                <SimpleAnimationPlayer 
                  videoUrl={showFullscreenModal.videoUrl}
                  isFullscreenMode={true}
                  onToggleFullscreen={() => setShowFullscreenModal(false)}
                />
              </div>
              </motion.div>
            </motion.div>
          </ErrorBoundary>
        )}
      </AnimatePresence>
    </div>
  );
}