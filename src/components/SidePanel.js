// src/components/SidePanel.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function SidePanel({ isOpen, onClose, children }) {
  const [isVisible, setIsVisible] = useState(isOpen);
  
  // Handle open/close states
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  // Handle the close with animation
  const handleClose = () => {
    setIsVisible(false);
    // Only call onClose after animation completes
    setTimeout(() => {
      onClose();
    }, 300); // Match this with your animation duration
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Side Panel spanning from 40% from the left to the right */}
          <motion.div
            className="fixed top-0 left-[40%] right-0 h-full bg-white shadow-lg z-50 overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          >
            <div className="p-6 space-y-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default SidePanel;