// src/components/SidePanel.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

function SidePanel({ isOpen, onClose, children, title = 'Details', actions }) {
  const [isVisible, setIsVisible] = useState(isOpen);
  const hasTitle = Boolean(title);

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
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12"
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

          {/* Main Modal Content */}
          <motion.div
            className="relative z-10 w-full max-w-[88rem] overflow-hidden rounded-[24px] border border-white/40 bg-gradient-to-br from-white/95 to-white/80 shadow-[0_28px_84px_-48px_rgba(15,23,42,0.6)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute right-6 top-6 z-20 rounded-full bg-white/80 p-1.5 text-slate-500 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              aria-label="Close panel"
            >
              <X size={24} />
            </button>

            {hasTitle && (
              <div className="flex items-center border-b border-white/40 bg-white/70 px-6 py-4 pr-16 backdrop-blur">
                <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
              </div>
            )}

            <div className={`flex max-h-[calc(100vh-3.75rem)] flex-col overflow-y-auto bg-transparent ${hasTitle ? '' : 'pt-2'}`}>
              <div
                className={`flex-1 w-full bg-white/70 px-6 pb-6 sm:px-8 sm:pb-8 lg:px-12 lg:pb-12 xl:px-16 ${hasTitle ? 'pt-6 sm:pt-8 lg:pt-10' : 'pt-8 sm:pt-10 lg:pt-12'}`}
              >
                {children}
              </div>

              {/* Mobile Actions (Sticky Bottom inside Modal) */}
              {actions && (
                <div className="sticky bottom-0 z-10 block border-t border-white/50 bg-white/80 p-4 backdrop-blur xl:hidden">
                    {actions}
                </div>
              )}
            </div>
          </motion.div>

          {/* Desktop Actions (Fixed Right Sidebar) */}
          {actions && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: 0.1 }}
                className="fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-4 xl:flex"
              >
                 {actions}
              </motion.div>
          )}

        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SidePanel;
