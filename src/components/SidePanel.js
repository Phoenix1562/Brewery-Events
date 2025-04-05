// src/components/SidePanel.js
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function SidePanel({ isOpen, onClose, children }) {
  // The panel will start at 30% from the left and extend to the right edge.
  // If you want to adjust the offset, change "left-[30%]" accordingly.
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Side Panel spanning from 30% from the left to the right */}
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
