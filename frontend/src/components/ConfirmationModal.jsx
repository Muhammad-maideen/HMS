import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmationModal({ isOpen, title, message, confirmText = 'Delete', onConfirm, onCancel, isLoading }) {
  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-neutral-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-neutral-100 rounded-xl text-neutral-900 border border-neutral-200">
            <AlertTriangle className="w-5 h-5 text-neutral-900" />
          </div>
          <h3 className="text-base font-bold text-neutral-900">{title}</h3>
        </div>
        
        <p className="text-xs text-neutral-600 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-neutral-700 hover:text-black bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-white bg-black hover:bg-neutral-800 rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
