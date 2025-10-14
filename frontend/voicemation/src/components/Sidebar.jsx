import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({ 
  conversations, 
  activeConversation, 
  onSelectConversation, 
  onNewConversation 
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const formatDate = (date) => {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const sidebarVariants = {
    expanded: { 
      width: 256,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    collapsed: { 
      width: 48,
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  if (isCollapsed) {
    return (
      <motion.div 
        className="bg-gray-900 flex flex-col items-center py-4"
        variants={sidebarVariants}
        animate="collapsed"
        initial="expanded"
      >
        <motion.button 
          onClick={() => setIsCollapsed(false)}
          className="text-white hover:bg-gray-800 p-2 rounded mb-4"
          title="Expand sidebar"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </motion.button>
        <motion.button 
          onClick={onNewConversation}
          className="text-white hover:bg-gray-800 p-2 rounded"
          title="New conversation"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-gray-900 text-white flex flex-col h-full"
      variants={sidebarVariants}
      animate="expanded"
      initial="collapsed"
    >
      {/* Header with logo only */}
      <motion.div 
        className="flex items-center justify-between p-3 border-b border-gray-800"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div 
          className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </motion.div>
        <motion.button 
          onClick={() => setIsCollapsed(true)}
          className="hover:bg-gray-800 p-1 rounded"
          title="Collapse sidebar"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>
      </motion.div>

      {/* New Chat Button */}
      <motion.div 
        className="p-3"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button 
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-3 p-3 rounded-lg border border-gray-600 hover:bg-gray-800 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New chat
        </motion.button>
      </motion.div>

      {/* Conversations List - Now with hidden scrollbar and fade gradient effect */}
      <div className="flex-1 overflow-y-auto scrollbar-hide scroll-smooth px-3 relative">
        {/* Gradient fades for top and bottom of scroll area */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-gray-900 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-900 to-transparent z-10 pointer-events-none"></div>
        
        <motion.div 
          className="space-y-1 pb-8" /* Added bottom padding for better scrolling experience */
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <AnimatePresence>
            {conversations.map((conversation, index) => (
              <motion.button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors group relative ${
                  activeConversation === conversation.id 
                    ? 'bg-gray-800' 
                    : 'hover:bg-gray-800'
                }`}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {conversation.title}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(conversation.timestamp)}
                    </div>
                  </div>
                </div>
                
                {/* More options button */}
                <motion.button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded"
                  whileHover={{ scale: 1.2 }}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </motion.button>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Bottom Section */}
      <motion.div 
        className="border-t border-gray-800 p-3"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="space-y-1">
          <motion.button 
            className="w-full text-left p-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </div>
          </motion.button>
          <motion.button 
            className="w-full text-left p-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Help & FAQ
            </div>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}