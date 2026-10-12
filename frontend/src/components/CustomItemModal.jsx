import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Tag, IndianRupee, Sparkles, Check } from 'lucide-react';
import { posAudio } from '../utils/posAudio';

export default function CustomItemModal({ isOpen, onClose, onAddCustomItem }) {
  const [itemName, setItemName] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const nameInputRef = useRef(null);

  // Quick preset shortcuts for fast-paced cashiers
  const quickItems = [
    { name: 'Extra Gravy / Curry', price: '30' },
    { name: 'Container / Parcel Box', price: '20' },
    { name: 'Mineral Water 1L', price: '20' },
    { name: 'Cold Drink Can', price: '40' },
    { name: 'Extra Raita & Salan', price: '25' },
    { name: 'Special Rice Portion', price: '80' },
  ];

  const quickPrices = [10, 20, 30, 50, 80, 100, 150, 200, 500];

  useEffect(() => {
    if (isOpen) {
      setItemName('');
      setUnitPrice('');
      setQuantity(1);
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const priceNum = parseFloat(unitPrice);
    if (!itemName.trim()) return;
    if (isNaN(priceNum) || priceNum < 0) return;

    onAddCustomItem({
      name: itemName.trim(),
      unitPrice: priceNum,
      quantity: Math.max(1, parseInt(quantity, 10) || 1),
    });

    posAudio.punch();
    onClose();
  };

  const handleSelectQuickItem = (item) => {
    setItemName(item.name);
    setUnitPrice(item.price);
    posAudio.punch();
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-sans"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">Add Open / Custom Item</h3>
              <p className="text-[11px] text-neutral-500">Punch ad-hoc item or packaging charge directly to bill</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1-Tap Quick Common Items */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>1-Tap Fast Fill:</span>
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {quickItems.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectQuickItem(item)}
                className={`px-2.5 py-1.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                  itemName === item.name
                    ? 'bg-neutral-900 text-white border-black font-semibold'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                }`}
              >
                <span className="truncate pr-1 text-[11px]">{item.name}</span>
                <span className="font-mono font-bold text-[11px] shrink-0">₹{item.price}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          
          {/* Item Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 block">Item Description / Name</label>
            <input
              ref={nameInputRef}
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Extra Gravy, Special Rice, Container Box"
              className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 font-medium focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all"
            />
          </div>

          {/* Unit Price */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-700 block">Unit Price (₹)</label>
              <span className="text-[10px] text-neutral-400">Tax calculated automatically</span>
            </div>
            
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-neutral-400 font-mono text-xs">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white border border-neutral-300 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-neutral-900 font-mono font-bold focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all"
              />
            </div>

            {/* Quick Price Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-neutral-400 font-medium">Quick Amount:</span>
              {quickPrices.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setUnitPrice(String(p))}
                  className={`px-2 py-0.5 rounded-lg border font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                    unitPrice === String(p)
                      ? 'bg-black text-white border-black'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200'
                  }`}
                >
                  ₹{p}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 block">Quantity</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 5, 10].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuantity(q)}
                  className={`flex-1 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    quantity === q
                      ? 'bg-black border-black text-white shadow-2xs'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {q}x
                </button>
              ))}
            </div>
          </div>

          {/* Line Total Live Preview */}
          {parseFloat(unitPrice) > 0 && (
            <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center justify-between text-xs animate-fadeIn">
              <span className="text-neutral-600 font-medium">Line Total (Price × Qty):</span>
              <span className="font-mono font-bold text-neutral-900 text-base">
                ₹{(parseFloat(unitPrice) * quantity).toFixed(2)}
              </span>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              disabled={!itemName.trim() || !unitPrice || parseFloat(unitPrice) < 0}
              className="flex-1 py-2.5 bg-black hover:bg-neutral-800 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Punch to Bill</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium text-xs rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
