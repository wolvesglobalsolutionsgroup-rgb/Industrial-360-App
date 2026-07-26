import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}: DialogProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className={`relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-6 overflow-hidden z-10 space-y-4 ${className}`}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-155 text-slate-400 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[70vh] overflow-y-auto pr-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Dialog;
