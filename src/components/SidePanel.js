// src/components/SidePanel.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

function SidePanel({ isOpen, onClose, children, title = 'Details' }) {
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
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
          className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            className="relative z-10 flex h-full w-full max-h-[calc(100vh-3rem)] max-w-6xl flex-col overflow-hidden rounded-3xl bg-white/95 shadow-2xl ring-1 ring-black/5"
            initial={{ y: 40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 200, damping: 26, duration: 0.28 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 bg-white/70 px-6 py-5">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-slate-400">Currently viewing</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-800">{title}</h2>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close panel"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-slate-100/60">
              <div className="mx-auto w-full max-w-5xl p-6 sm:p-8 lg:p-10">
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
