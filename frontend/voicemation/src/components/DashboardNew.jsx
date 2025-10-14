import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceInput from '../components/VoiceInput';
import AnimationPlayer from '../components/AnimationPlayer';

export default function Dashboard({ activeConversation }) {
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedAnimation, setExpandedAnimation] = useState(null);
  const [showAnimationModal, setShowAnimationModal] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState(null);
  const modalRef = useRef(null);

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
      // Simulate API call for animation generation
      setTimeout(() => {
        const animationData = {
          id: Date.now() + 1,
          text,
          // In a real app, this would be a real video URL from your backend
          videoUrl: 'https://example.com/animation.mp4',
          timestamp: new Date()
        };
        
        const assistantMessage = {
          id: animationData.id,
          type: 'assistant',
          content: `I've created an educational animation based on your concept: "${text}"`,
          animationId: animationData.id,
          timestamp: animationData.timestamp
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setCurrentAnimation(animationData);
        setExpandedAnimation(animationData.id); // Auto-expand the animation when it's first generated
        setIsGenerating(false);
      }, 2000);
    } catch (error) {
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `I'm preparing your educational animation. For now, here's what I understood: "${text}"`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsGenerating(false);
    }
  };

  const closeModal = () => {
    setShowAnimationModal(false);
  };

  // Close modal when clicking outside
  const handleModalBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      closeModal();
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

  return (
    <motion.div 
      className="flex-1 flex flex-col h-full bg-gray-900 text-gray-100"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Minimal Header */}
      <motion.div 
        className="border-b border-gray-800/50 py-2 px-4 bg-gray-900"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-semibold text-blue-100">Voicemation</h1>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {messages.length === 0 ? (
            // Welcome Screen
            <motion.div 
              className="h-full flex flex-col items-center justify-center p-6 text-center"
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="max-w-md">
                <motion.div 
                  className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-900/30"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
                >
                  <motion.svg 
                    className="w-7 h-7 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ delay: 0.8, duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </motion.svg>
                </motion.div>
                <motion.h2 
                  className="text-xl font-semibold text-gray-100 mb-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Voicemation
                </motion.h2>
                <motion.p 
                  className="text-sm text-gray-400 mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  Create educational animations by speaking. Just describe what you want to visualize.
                </motion.p>
                
                <motion.div
                  className="flex flex-wrap justify-center gap-2 mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <span className="py-1 px-2 text-xs rounded-full bg-blue-900/30 text-blue-300">Pendulum wave</span>
                  <span className="py-1 px-2 text-xs rounded-full bg-blue-900/30 text-blue-300">Wave interference</span>
                  <span className="py-1 px-2 text-xs rounded-full bg-blue-900/30 text-blue-300">Projectile motion</span>
                </motion.div>
                
                <motion.div
                  className="text-xs text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <motion.div 
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                  >
                    ↓
                  </motion.div>
                </motion.div>
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
                        className={`rounded-2xl p-4 ${
                          message.type === 'user' 
                            ? 'bg-blue-600 text-white ml-auto' 
                            : 'bg-gray-800 text-gray-100 border border-gray-700'
                        }`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <motion.p 
                          className="whitespace-pre-wrap"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          {message.content}
                        </motion.p>
                        {message.type === 'assistant' && message.animationId && (
                          <>
                            <motion.button
                              className="mt-3 px-2 py-1 rounded text-blue-400 hover:bg-gray-800 text-sm flex items-center gap-1.5"
                              onClick={() => {
                                const animationData = {
                                  id: message.animationId,
                                  text: message.content.replace('I\'ve created an educational animation based on your concept: "', '').replace('"', ''),
                                  timestamp: message.timestamp,
                                  videoUrl: 'https://example.com/animation.mp4'
                                };
                                if (expandedAnimation === message.animationId) {
                                  setExpandedAnimation(null);
                                } else {
                                  setExpandedAnimation(message.animationId);
                                  setCurrentAnimation(animationData);
                                }
                              }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5, duration: 0.3 }}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              </svg>
                              {expandedAnimation === message.animationId ? 'Hide' : 'View'}
                            </motion.button>
                            
                            <AnimatePresence>
                              {expandedAnimation === message.animationId && currentAnimation && (
                                <motion.div
                                  className="mt-3 overflow-hidden rounded-lg"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ 
                                    type: "spring", 
                                    stiffness: 500, 
                                    damping: 40,
                                    opacity: { duration: 0.2 }
                                  }}
                                >
                                  <div className="aspect-video bg-gray-900">
                                    <AnimationPlayer videoUrl={currentAnimation.videoUrl} />
                                  </div>
                                  <div className="flex justify-end p-1 bg-gray-800">
                                    <motion.button
                                      className="p-1 rounded text-gray-300 hover:bg-gray-700"
                                      onClick={() => {
                                        setExpandedAnimation(null);
                                        setShowAnimationModal(true);
                                      }}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      title="Fullscreen"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                                      </svg>
                                    </motion.button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </motion.div>
                      <motion.div 
                        className={`text-xs text-gray-500 mt-1 ${message.type === 'user' ? 'text-right' : ''}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        {message.timestamp.toLocaleTimeString()}
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
          <VoiceInput 
            onResult={handleVoiceResult} 
            currentAnimation={currentAnimation} 
            isGenerating={isGenerating} 
          />
        </div>
      </motion.div>

      {/* Minimal Animation Modal */}
      <AnimatePresence>
        {showAnimationModal && currentAnimation && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
            onClick={handleModalBackdropClick}
          >
            <div className="w-full h-full max-h-screen flex flex-col">
              <motion.div
                ref={modalRef}
                className="bg-black flex-grow flex flex-col overflow-hidden mx-0"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center p-2 bg-gray-900">
                  <h3 className="text-sm font-medium text-white">"{currentAnimation.text}"</h3>
                  <motion.button
                    className="p-1.5 rounded-full hover:bg-gray-800"
                    onClick={closeModal}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
                
                <div className="flex-grow flex items-center justify-center bg-gray-900 p-4">
                  <div className="w-full max-w-4xl max-h-[70vh] overflow-hidden rounded-lg">
                    <AnimationPlayer videoUrl={currentAnimation.videoUrl} />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
