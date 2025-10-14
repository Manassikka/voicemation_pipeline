import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { AnimationProvider } from './context/AnimationContext';

function App() {
  const [conversations, setConversations] = useState([
    { id: 1, title: 'Voice Animation Demo', timestamp: new Date() }
  ]);
  const [activeConversation, setActiveConversation] = useState(1);

  const addNewConversation = () => {
    const newId = conversations.length + 1;
    const newConversation = {
      id: newId,
      title: `New Conversation ${newId}`,
      timestamp: new Date()
    };
    setConversations([newConversation, ...conversations]);
    setActiveConversation(newId);
  };

  return (
    <ErrorBoundary>
      <AnimationProvider>
        <motion.div 
          className="flex h-screen bg-gray-950"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            <Sidebar 
              conversations={conversations}
              activeConversation={activeConversation}
              onSelectConversation={setActiveConversation}
              onNewConversation={addNewConversation}
            />
          </AnimatePresence>
          <Dashboard activeConversation={activeConversation} />
        </motion.div>
      </AnimationProvider>
    </ErrorBoundary>
  );
}

export default App;
