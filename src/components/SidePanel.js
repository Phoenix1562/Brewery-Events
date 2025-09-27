// src/components/SidePanel.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react'; // Import X icon from lucide-react

function SidePanel({ isOpen, onClose, children, title = 'Details', footer = null }) {
  const [isVisible, setIsVisible] = useState(isOpen);
  const hasTitle = Boolean(title);
  const hasFooter = Boolean(footer);

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
          className="fixed inset-0 z-50 flex items-stretch justify-end lg:px-6 lg:py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-950/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
          />

          <motion.div
            className="relative z-10 flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-l-3xl border border-slate-200 bg-white shadow-xl"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute right-6 top-6 rounded-full bg-white/80 p-1.5 text-slate-500 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              aria-label="Close panel"
            >
              <X size={24} />
            </button>

            <div className="flex h-full flex-col">
              {hasTitle && (
                <div className="sticky top-0 z-10 flex items-center border-b border-slate-200 bg-white px-6 py-4 pr-16">
                  <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
                </div>
              )}

              <div
                className={`flex-1 overflow-y-auto px-6 pb-6 sm:px-8 sm:pb-8 lg:px-12 lg:pb-12 ${hasTitle ? 'pt-6 sm:pt-8 lg:pt-10' : 'pt-8 sm:pt-10 lg:pt-12'}`}
              >
                {children}
              </div>

              {hasFooter && (
                <div className="border-t border-slate-200 bg-white px-6 py-4 sm:px-8 sm:py-6 lg:px-12">
                  {footer}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SidePanel;
