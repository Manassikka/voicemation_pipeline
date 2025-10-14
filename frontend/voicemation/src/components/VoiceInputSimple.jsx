import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VoiceInputSimple = ({ onResult }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [inDepthMode, setInDepthMode] = useState(false);

  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const textInputRef = useRef(null);

  // Expose focus method globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.focusVoiceInput = () => {
        if (textInputRef.current) {
          textInputRef.current.focus();
        }
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.focusVoiceInput;
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setProcessingStatus('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        setProcessingStatus('Processing audio...');
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        processAudio(audioBlob);
        
        // Stop all tracks to turn off microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setProcessingStatus('Recording...');
      setRecordingDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setProcessingStatus('Microphone access denied');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const processAudio = async (audioBlob) => {
    try {
      setProcessingStatus('Generating animation...');

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('inDepthMode', inDepthMode.toString());

      const response = await fetch('http://localhost:5001/generate_audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("API Response:", result);
      
      if (result.success && (result.video_url || result.videoUrl)) {
        setProcessingStatus('Animation ready!');
        
        // Clear status after delay
        setTimeout(() => {
          setProcessingStatus('');
          setRecordingDuration(0);
        }, 2000);
        
        if (onResult) {
          onResult(result.prompt || result.text || 'Voice Input');
        }
      } else {
        throw new Error(result.error || 'Failed to generate animation');
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      setProcessingStatus('Error occurred');
      setTimeout(() => {
        setProcessingStatus('');
        setRecordingDuration(0);
      }, 3000);
    }
  };

  const handleTextSubmit = async () => {
    if (!text.trim()) return;

    try {
      setIsSubmitting(true);
      setProcessingStatus('Generating animation...');

      const response = await fetch('http://localhost:5001/generate_audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: text.trim(),
          inDepthMode: inDepthMode 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("API Response:", result);
      
      if (result.success && (result.video_url || result.videoUrl)) {
        setText('');
        setProcessingStatus('Animation ready!');
        
        setTimeout(() => {
          setProcessingStatus('');
        }, 2000);
        
        if (onResult) {
          onResult(text.trim());
        }
      } else {
        throw new Error(result.error || 'Failed to generate animation');
      }
    } catch (error) {
      console.error('Error submitting text:', error);
      setProcessingStatus('Error occurred');
      setTimeout(() => {
        setProcessingStatus('');
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="VoiceInputComponent space-y-4">
      {/* Status Indicator */}
      <AnimatePresence>
        {processingStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-300 text-sm">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>{processingStatus}</span>
              {isRecording && (
                <span className="text-blue-200 ml-2">
                  🔴 {formatTime(recordingDuration)}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Recording Section */}
      <motion.div 
        className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-white font-medium mb-4 text-center">Record Your Voice</h3>
        
        {/* In Depth Mode Toggle */}
        <div className="flex items-center justify-center mb-4">
          <motion.button
            onClick={() => setInDepthMode(!inDepthMode)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              inDepthMode
                ? 'bg-purple-600/30 border border-purple-500/50 text-purple-200 shadow-lg shadow-purple-900/20'
                : 'bg-gray-700/50 border border-gray-600/50 text-gray-300 hover:bg-gray-600/50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {inDepthMode ? 'In Depth Mode ON' : 'In Depth Mode'}
            {inDepthMode && (
              <motion.div
                className="w-2 h-2 bg-purple-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.button>
        </div>
        
        <div className="flex flex-col items-center space-y-3">
          <motion.button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isSubmitting}
            className={`w-16 h-16 rounded-full border-4 transition-all duration-200 flex items-center justify-center ${
              isRecording
                ? 'bg-red-500/20 border-red-400 text-red-300 scale-110'
                : 'bg-blue-600/20 border-blue-500 text-blue-300 hover:bg-blue-600/30 hover:scale-105'
            }`}
            whileHover={{ scale: isRecording ? 1.1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              {isRecording ? (
                <path d="M6 6h12v12H6z" />
              ) : (
                <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 11a7 7 0 0 1-14 0V9a1 1 0 0 1 2 0v2a5 5 0 0 0 10 0V9a1 1 0 0 1 2 0v2z" />
              )}
            </svg>
          </motion.button>
          <p className="text-sm text-gray-400 text-center">
            {isRecording ? 'Click to stop recording' : 'Click to start recording'}
          </p>
        </div>
      </motion.div>

      {/* Text Input Section */}
      <motion.div 
        className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-white font-medium mb-4 text-center">Or Type Your Message</h3>
        <div className="flex space-x-3">
          <input
            ref={textInputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isSubmitting && handleTextSubmit()}
            placeholder="Enter text to generate animation..."
            className="flex-1 bg-gray-700/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-700 transition-all backdrop-blur-sm border border-gray-600/50"
            disabled={isSubmitting || isRecording}
          />
          <motion.button
            onClick={handleTextSubmit}
            disabled={!text.trim() || isSubmitting || isRecording}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-xl transition-all font-medium text-white shadow-lg shadow-blue-900/20"
            whileHover={{ scale: text.trim() && !isSubmitting && !isRecording ? 1.02 : 1 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? 'Generating...' : 'Generate'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default VoiceInputSimple;
