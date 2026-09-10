'use client';

import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: AlertType;
  onClose: () => void;
}

export default function AlertModal({ isOpen, title, message, type, onClose }: AlertModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation(); // Cegah event buble ke listener lain
        onClose();
      }
    };

    if (isOpen) {
      // Use capture phase to intercept before other listeners
      window.addEventListener('keydown', handleKeyDown, { capture: true });
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-8 h-8 text-emerald-500" />;
      case 'error': return <AlertCircle className="w-8 h-8 text-red-500" />;
      case 'warning': return <AlertCircle className="w-8 h-8 text-amber-500" />;
      case 'info': return <Info className="w-8 h-8 text-indigo-500" />;
      default: return null;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'success': return 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 text-white';
      case 'error': return 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white';
      case 'warning': return 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white';
      case 'info': return 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 text-white';
      default: return 'bg-gray-700 hover:bg-gray-600 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-sm flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4">
          {getIcon()}
        </div>
        <h3 className="text-xl font-bold tracking-tight text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          {message}
        </p>
        <button
          autoFocus
          onClick={onClose}
          className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${getButtonClass()}`}
        >
          Mengerti (Enter)
        </button>
      </div>
    </div>
  );
}
