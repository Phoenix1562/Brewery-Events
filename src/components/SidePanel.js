// src/components/SidePanel.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react'; // Import X icon from lucide-react

function SidePanel({ isOpen, onClose, children, title = 'Details' }) {
  const [isVisible, setIsVisible] = useState(isOpen);
  
  // Handle open/close states
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Prevent scrolling on the body when the panel is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    // Cleanup: restore scrolling on unmount
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle the close with animation
  const handleClose = () => {
    setIsVisible(false);
    // Call onClose only after animation completes
    setTimeout(() => {
      onClose();
    }, 300); // Make sure this duration matches your animation timing
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop with blur effect */}
          <motion.div
  className="fixed inset-0 bg-black/50 z-40"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  onClick={handleClose}
/>

          {/* Side Panel */}
          <motion.div
            className="fixed top-0 right-0 h-full max-w-full w-full md:w-5/6 lg:w-3/4 xl:w-3/5 bg-white shadow-lg z-50 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 30,
              duration: 0.3
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
              <button 
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-gray-100 transition"
                aria-label="Close panel"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Content - scrollable area */}
            <div className="flex-1 overflow-y-auto p-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default SidePanel;
