import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceInputSimple from '../components/VoiceInputSimple';
import AnimationPlayer from '../components/AnimationPlayer';

export default function Dashboard({ activeConversation }) {
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAnimationModal, setShowAnimationModal] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState(null);
  const modalRef = useRef(null);
  
  // Add CSS for highlight animation effect
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes highlight-pulse {
        0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
        30% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
        70% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3); }
        100% { box-shadow: 0 0 0 5px rgba(59, 130, 246, 0); }
      }
      
      @keyframes subtle-glow {
        0% { background-color: rgba(59, 130, 246, 0); }
        50% { background-color: rgba(59, 130, 246, 0.1); }
        100% { background-color: rgba(59, 130, 246, 0); }
      }
      
      .highlight-animation {
        animation: highlight-pulse 1.5s ease-out 1;
        border-color: rgba(59, 130, 246, 0.8) !important;
        border-width: 2px !important;
        position: relative;
        z-index: 1;
      }
      
      .pulse-effect {
        animation: subtle-glow 1.5s ease-out 1;
        pointer-events: none;
        z-index: -1;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleVoiceResult = async (text) => {
    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);

    try {
      // Call the real Flask backend
      const response = await fetch('http://localhost:5001/generate_audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Dashboard API Response:", result);
      
      if (result.success && (result.video_url || result.videoUrl)) {
        const videoUrl = result.video_url || result.videoUrl;
        const animationData = {
          id: Date.now() + 1,
          text,
          videoUrl: `http://localhost:5001${videoUrl}`,
          timestamp: new Date()
        };
        
        const assistantMessage = {
          id: animationData.id,
          type: 'assistant',
          content: `I've created an educational animation based on your concept: "${text}"`,
          animationId: animationData.id,
          videoUrl: animationData.videoUrl,
          timestamp: animationData.timestamp
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setCurrentAnimation(animationData);
        
        // Store animation in a lookup for inline display
        if (typeof window !== 'undefined') {
          if (!window.animationsLookup) window.animationsLookup = {};
          window.animationsLookup[animationData.id] = animationData;
        }
      } else {
        // Handle error case
        const errorMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: `I couldn't create that animation. Error: ${result.error || 'Unknown error'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      setIsGenerating(false);
    } catch (error) {
      console.error('Error calling backend:', error);
      // Add error message for unexpected errors
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `I couldn't create that animation. Network error: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsGenerating(false);
    }
  };

  // Handler to highlight animation in chat after returning from fullscreen
  const highlightAnimation = (animationId) => {
    if (!animationId) return;
    
    // Find the message container with this animation ID
    setTimeout(() => {
      const messageElement = document.querySelector(`[data-animation-id="${animationId}"]`);
      if (messageElement) {
        // Scroll to the message
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add highlight class for animation effect
        messageElement.classList.add('highlight-animation');
        
        // Create and add a pulse element
        const pulseElement = document.createElement('div');
        pulseElement.className = 'absolute inset-0 rounded-2xl pulse-effect';
        messageElement.appendChild(pulseElement);
        
        // Remove highlight and pulse after animation
        setTimeout(() => {
          messageElement.classList.remove('highlight-animation');
          if (messageElement.contains(pulseElement)) {
            messageElement.removeChild(pulseElement);
          }
        }, 2000);
      }
    }, 300);
  };

  const closeModal = () => {
    // When closing the modal, highlight the associated chat message
    if (currentAnimation) {
      highlightAnimation(currentAnimation.id);
    }
    setShowAnimationModal(false);
  };
  
  // Handler to clear the current animation
  const handleClearAnimation = () => {
    setCurrentAnimation(null);
  };

  const handleReturnToChat = () => {
    // Return to chat from either fullscreen or inline animation player
    // Clear the current animation state
    setCurrentAnimation(null);
    
    // Close the modal if it's open
    if (showAnimationModal) {
      closeModal();
    }
    
    // Focus the input field
    if (typeof window !== 'undefined' && window.focusVoiceInput) {
      window.focusVoiceInput();
    }
  };

  const handleAnimationError = () => {
    // If an error occurs in fullscreen mode, we should provide a way back to chat
    // This is handled by the "Return to Chat" button in the AnimationPlayer's fullscreen error UI
    // We don't need to close the modal here as that's handled by the button itself
  };

  // Close modal when pressing Escape key
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && showAnimationModal) {
        closeModal();
      }
    };
    
    window.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showAnimationModal]);

  const handleDownloadAnimation = () => {
    if (!currentAnimation || !currentAnimation.videoUrl) return;
    
    const a = document.createElement('a');
    a.href = currentAnimation.videoUrl;
    a.download = `animation-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  // Handle animation sharing
  const handleShareAnimation = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this animation',
        text: `Animation: "${currentAnimation?.text}"`,
        url: window.location.href,
      }).catch(err => {
        console.error('Error sharing:', err);
        navigator.clipboard.writeText(window.location.href)
          .then(() => {
            alert('Link copied to clipboard!');
          });
      });
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          alert('Link copied to clipboard!');
        });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        type: "spring",
        stiffness: 400,
        damping: 30,
        duration: 0.3
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      scale: 0.9,
      transition: { 
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };

  // Expose a window method to open animation fullscreen
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.openAnimationFullscreen = (animation) => {
        setCurrentAnimation(animation);
        setShowAnimationModal(true);
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete window.openAnimationFullscreen;
      }
    };
  }, []);

  return (
    <motion.div 
      className="flex-1 flex flex-col h-full bg-gray-900 text-gray-100"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header removed */}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {messages.length === 0 ? (
            // Empty state - minimal welcome
            <motion.div 
              className="h-full flex flex-col items-center justify-center p-6 text-center"
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-md">
                <motion.div 
                  className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-md shadow-blue-900/30"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
                >
                  <motion.svg 
                    className="w-7 h-7 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </motion.svg>
                </motion.div>
                
                <motion.button
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-full text-sm font-medium text-white shadow-lg shadow-blue-900/30 border border-blue-500/50 flex items-center gap-2"
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => {
                    // Focus the input field using the exposed method
                    if (typeof window !== 'undefined' && window.focusVoiceInput) {
                      window.focusVoiceInput();
                    }
                    // Also scroll to the input area
                    const inputArea = document.querySelector('.VoiceInputComponent');
                    inputArea?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Continue Chat
                </motion.button>
              </div>
            </motion.div>
          ) : (
            // Chat Messages
            <motion.div 
              className="p-4 space-y-6"
              key="messages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div 
                    key={message.id} 
                    className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : ''}`}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                  >
                    {message.type === 'assistant' && (
                      <motion.div 
                        className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </motion.div>
                    )}
                    <div className={`max-w-2xl ${message.type === 'user' ? 'order-first' : ''}`}>
                      <motion.div 
                        className={`rounded-2xl p-4 relative ${
                          message.type === 'user' 
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white ml-auto shadow-lg shadow-blue-900/20' 
                            : 'bg-gradient-to-br from-gray-800 to-gray-850 text-gray-100 border border-gray-700/50 shadow-lg shadow-black/10'
                        } ${message.animationId ? 'animation-message' : ''}`}
                        data-animation-id={message.animationId || null}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 400, 
                          damping: 30, 
                          delay: 0.1 
                        }}
                        whileHover={{ 
                          scale: 1.01,
                          boxShadow: message.type === 'user' 
                            ? '0 10px 25px -5px rgba(30, 64, 175, 0.25)' 
                            : '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        {message.animationId && (
                          <motion.div 
                            className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-400"
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.7, 1, 0.7]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatType: "reverse"
                            }}
                          />
                        )}
                          
                        <motion.p 
                          className="whitespace-pre-wrap text-sm md:text-base"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          {message.content}
                        </motion.p>
                        
                        {message.type === 'assistant' && message.animationId && (
                          <motion.div
                            className="mt-3"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            {/* Inline Video Preview */}
                            <div className="bg-black rounded-lg overflow-hidden mb-3">
                              <video 
                                className="w-full h-32 object-contain"
                                controls={false}
                                muted
                                autoPlay
                                loop
                                playsInline
                                src={(() => {
                                  const animation = window.animationsLookup && window.animationsLookup[message.animationId];
                                  console.log('Looking for animation:', message.animationId, 'found:', animation);
                                  return animation ? animation.videoUrl : undefined;
                                })()}
                                onError={(e) => console.error('Video error:', e)}
                                onLoadStart={() => console.log('Video loading started')}
                                onLoadedData={() => console.log('Video loaded successfully')}
                              />
                            </div>
                            
                            {/* Play Fullscreen Button */}
                            <div className="flex justify-end">
                              <motion.button
                                className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-600/30 to-blue-500/30 hover:from-blue-600/50 hover:to-blue-500/50 text-blue-200 text-sm flex items-center gap-2 backdrop-blur-sm border border-blue-500/20 shadow-lg shadow-blue-900/10"
                                onClick={() => {
                                  const animation = {
                                    id: message.animationId,
                                    text: message.content.replace(/I've created an educational animation based on your concept: "/, '').replace(/"$/, ''),
                                    videoUrl: message.videoUrl,
                                    timestamp: message.timestamp
                                  };
                                  console.log('Setting animation for fullscreen:', animation);
                                  console.log('Message videoUrl:', message.videoUrl);
                                  console.log('Animation videoUrl:', animation.videoUrl);
                                  setCurrentAnimation(animation);
                                  setShowAnimationModal(true);
                                }}
                                whileHover={{ 
                                  scale: 1.05, 
                                  y: -3,
                                  boxShadow: "0 15px 25px -5px rgba(0, 0, 0, 0.3)"
                                }}
                                whileTap={{ 
                                  scale: 0.95,
                                  y: 0,
                                  boxShadow: "0 5px 15px -3px rgba(0, 0, 0, 0.2)"
                                }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                </svg>
                                Play Fullscreen
                              </motion.button>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                      
                      <motion.div 
                        className={`text-xs text-blue-300/60 mt-1.5 flex items-center ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </motion.div>
                    </div>
                    {message.type === 'user' && (
                      <motion.div 
                        className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              <AnimatePresence>
                {isGenerating && (
                  <motion.div 
                    className="flex gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >                      
                    <motion.div 
                      className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </motion.div>
                    <div className="max-w-2xl">
                      <motion.div 
                        className="bg-gray-800 rounded-2xl p-2"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                      >                          
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <motion.div 
                              className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                            />
                            <motion.div 
                              className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                            />
                            <motion.div 
                              className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                            />
                          </div>
                          <span className="text-gray-300 text-xs">Creating animation...</span>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Minimal Voice Input Area */}
      <motion.div 
        className="py-3 px-4 sm:px-6"
        style={{
          background: "rgba(17, 24, 39, 0.95)",
          borderTop: "1px solid rgba(59, 130, 246, 0.2)",
          boxShadow: "0 -4px 16px rgba(15, 23, 42, 0.3)"
        }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="max-w-2xl mx-auto">
          <VoiceInputSimple 
            onResult={handleVoiceResult} 
          />
        </div>
      </motion.div>

      {/* True Fullscreen Animation Modal */}
      <AnimatePresence>
        {showAnimationModal && currentAnimation && (
          <motion.div 
            className="fixed inset-0 z-50 bg-black/95"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              ref={modalRef}
              className="w-full h-full flex flex-col overflow-hidden animation-container"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* We now use the enhanced AnimationPlayer with fullscreen controls */}
              <div className="flex-1 animation-content">
                {console.log('Rendering AnimationPlayer with videoUrl:', currentAnimation?.videoUrl)}
                <AnimationPlayer 
                  videoUrl={currentAnimation.videoUrl} 
                  isFullscreenMode={true}
                  onToggleFullscreen={closeModal}
                  onDownload={handleDownloadAnimation}
                  onShare={handleShareAnimation}
                  onReturnToChat={handleReturnToChat}
                />
              </div>

              {/* Minimal close button at top right */}
              <motion.button
                className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 hover:bg-red-600/80 text-gray-300 hover:text-white z-[60] border border-white/10 backdrop-blur-sm shadow-xl"
                onClick={closeModal}
                whileHover={{ 
                  scale: 1.1, 
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
                }}
                whileTap={{ 
                  scale: 0.9,
                  boxShadow: "0 5px 15px -3px rgba(0, 0, 0, 0.2)"
                }}
                title="Return to Chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
              
              {/* Animation title overlay with back button */}
              <div className="absolute top-0 left-0 right-0 py-4 px-5 bg-gradient-to-b from-black/70 to-transparent z-50 flex items-center">
                <motion.button 
                  className="mr-4 p-2.5 rounded-full bg-black/50 hover:bg-black/70 text-white/80 hover:text-white/100 flex items-center justify-center border border-white/10 backdrop-blur-sm shadow-lg"
                  onClick={closeModal}
                  whileHover={{ 
                    scale: 1.1, 
                    x: -3,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)"
                  }}
                  whileTap={{ 
                    scale: 0.9, 
                    x: 0,
                    boxShadow: "0 5px 15px -3px rgba(0, 0, 0, 0.3)"
                  }}
                  title="Return to Chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                <h3 className="text-base font-medium text-white/90 truncate max-w-lg">"{currentAnimation.text}"</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
