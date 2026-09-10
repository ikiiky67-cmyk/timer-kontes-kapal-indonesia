'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmWord?: string; // Kata yang harus diketik untuk konfirmasi (opsional)
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ isOpen, title, message, confirmWord, onConfirm, onCancel }: ConfirmModalProps) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue(''); // Reset saat dibuka
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown, { capture: true });
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isConfirmed = !confirmWord || inputValue === confirmWord;

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-md flex flex-col text-left animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">
              {title}
            </h3>
          </div>
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-sm text-gray-300 mb-6 leading-relaxed">
          {message}
        </p>

        {confirmWord && (
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
              Ketik <span className="font-bold text-white select-all">{confirmWord}</span> untuk melanjutkan:
            </label>
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow"
              placeholder={confirmWord}
              autoFocus
            />
          </div>
        )}

        <div className="flex space-x-3 mt-auto">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded-lg font-medium text-white bg-gray-800 hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-600"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmed}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
              isConfirmed 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white' 
                : 'bg-red-900/50 text-red-200/50 cursor-not-allowed'
            }`}
          >
            Ya, Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}
