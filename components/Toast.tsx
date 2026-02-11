
import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'error';
  onUndo?: () => void;
  onClose: () => void;
  isVisible: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onUndo, onClose, isVisible }) => {
  useEffect(() => {
    if (isVisible && !onUndo) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
    // If there is an undo action, keep it a bit longer or until interaction
    if (isVisible && onUndo) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, onUndo]);

  if (!isVisible) return null;

  const bgColors = {
    success: 'bg-emerald-600',
    info: 'bg-slate-800',
    error: 'bg-red-600'
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className={`${bgColors[type]} text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4 min-w-[300px] justify-between`}>
        <div className="flex items-center gap-2 font-bold text-sm">
          {type === 'success' && <i className="fa-solid fa-check-circle"></i>}
          {type === 'info' && <i className="fa-solid fa-info-circle"></i>}
          {type === 'error' && <i className="fa-solid fa-triangle-exclamation"></i>}
          <span>{message}</span>
        </div>
        
        {onUndo && (
          <button 
            onClick={onUndo}
            className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1 rounded-lg transition-colors whitespace-nowrap"
          >
            元に戻す
          </button>
        )}
        {!onUndo && (
            <button onClick={onClose} className="text-white/70 hover:text-white">
                <i className="fa-solid fa-xmark"></i>
            </button>
        )}
      </div>
    </div>
  );
};
