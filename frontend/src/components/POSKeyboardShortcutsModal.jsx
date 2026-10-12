import React from 'react';
import { X, Keyboard, Zap, Play, ArrowRight, CornerDownLeft } from 'lucide-react';

export default function POSKeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'F1', desc: 'Focus Speed Punch / PLU Input Bar', category: 'Speed Punch' },
    { key: 'Enter', desc: 'Punch item into active cart (supports 2*101 syntax)', category: 'Speed Punch' },
    { key: 'F2', desc: 'Park / Hold active bill (or Recall if cart empty)', category: 'Queue Management' },
    { key: 'F4', desc: 'Cash Checkout & Confirm', category: 'Payment' },
    { key: 'F8', desc: 'UPI / QR Payment', category: 'Payment' },
    { key: '+ / -', desc: 'Increase / Decrease quantity of last/selected item', category: 'Cart Adjust' },
    { key: 'Del', desc: 'Remove last item from cart', category: 'Cart Adjust' },
    { key: 'Esc', desc: 'Close modals / Unfocus input', category: 'General' },
    { key: '?', desc: 'Toggle this Shortcuts Cheatsheet', category: 'General' },
  ];

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-neutral-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">Cashier Keyboard Hotkeys</h3>
              <p className="text-[11px] text-neutral-500">Touchless, high-speed terminal shortcuts for checkout desk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Syntax Examples */}
        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Speed Punch Multiplier Syntax:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-neutral-700">
            <div className="p-2 bg-white rounded border border-neutral-200 flex items-center justify-between">
              <span>Type <code className="font-bold text-black bg-neutral-100 px-1 rounded">101</code> + ↵</span>
              <span className="text-neutral-500">➜ 1x Item #101</span>
            </div>
            <div className="p-2 bg-white rounded border border-neutral-200 flex items-center justify-between">
              <span>Type <code className="font-bold text-black bg-neutral-100 px-1 rounded">3*101</code> + ↵</span>
              <span className="text-neutral-500">➜ 3x Item #101</span>
            </div>
          </div>
        </div>

        {/* List of Shortcuts */}
        <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto">
          {shortcuts.map((sc, i) => (
            <div key={i} className="py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-neutral-900 text-white font-mono font-bold text-[11px] rounded shadow-2xs min-w-[38px] text-center">
                  {sc.key}
                </kbd>
                <span className="text-neutral-700 font-medium">{sc.desc}</span>
              </div>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                {sc.category}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-neutral-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-xl transition-all cursor-pointer"
          >
            Got it (Esc)
          </button>
        </div>

      </div>
    </div>
  );
}
