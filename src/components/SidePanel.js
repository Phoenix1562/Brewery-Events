// src/components/SidePanel.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react'; // Import X icon from lucide-react

function SidePanel({ isOpen, onClose, children, title = 'Details' }) {
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      setIsVisible(false);
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 280);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
          />

          <motion.div
            className="relative z-10 w-full max-w-6xl overflow-hidden rounded-3xl border border-white/30 bg-white/95 shadow-2xl"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100/80 bg-white/80 px-6 py-4 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
              <button
                onClick={handleClose}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
                aria-label="Close panel"
              >
                <X size={24} />
              </button>
            </div>

            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-50">
              <div className="w-full px-6 py-6 md:px-8 md:py-8">
                {children}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SidePanel;
