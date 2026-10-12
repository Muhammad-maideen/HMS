import React, { useState } from 'react';
import { X, Plus, Minus, Check, ShoppingBag, Utensils } from 'lucide-react';

export default function VariantSelectModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) {
  if (!isOpen || !product) return null;

  const variants = product.variants && product.variants.length > 0 
    ? product.variants 
    : [
        { id: 'regular', variant_name: 'Regular Portion', regular_price: product.base_price, offer_price: product.offer_price },
      ];

  // Quantity tracker per variant: { [variantId]: number }
  const [quantities, setQuantities] = useState(() => {
    const initial = {};
    variants.forEach(v => {
      initial[v.id] = 1;
    });
    return initial;
  });

  const handleUpdateQty = (variantId, delta) => {
    setQuantities(prev => ({
      ...prev,
      [variantId]: Math.max(1, (prev[variantId] || 1) + delta)
    }));
  };

  const handleSelect = (variant) => {
    const qty = quantities[variant.id] || 1;
    onAddToCart(product, variant.id === 'regular' ? null : variant, qty);
    onClose();
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn select-none"
    >
      <div 
        className="w-full max-w-md bg-white rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Food Image & Title */}
        <div className="relative p-5 border-b border-neutral-100 flex items-center gap-4 bg-neutral-50/50">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200'}
            alt={product.name}
            className="w-16 h-16 rounded-2xl object-cover border border-neutral-200/90 shadow-2xs shrink-0"
          />
          <div className="flex-1 min-w-0 pr-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
              #{100 + Number(product.id)} • {product.category?.name || 'Menu Item'}
            </span>
            <h3 className="text-base font-extrabold text-neutral-900 truncate mt-0.5">
              {product.name}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Select portion size to add to current order
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-black hover:bg-neutral-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Variants List */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
            Available Portions ({variants.length})
          </div>

          {variants.map((v) => {
            const price = v.offer_price && v.offer_price < v.regular_price 
              ? v.offer_price 
              : (v.regular_price || product.base_price);
            const regularPrice = v.regular_price || product.base_price;
            const hasDiscount = v.offer_price && v.offer_price < regularPrice;
            const currentQty = quantities[v.id] || 1;

            return (
              <div
                key={v.id}
                className="p-4 rounded-2xl border-2 border-neutral-200/90 hover:border-black bg-white hover:bg-neutral-50/50 transition-all flex items-center justify-between gap-3 shadow-2xs group"
              >
                {/* Variant Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-neutral-900 group-hover:text-black">
                      {v.variant_name}
                    </h4>
                    {hasDiscount && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                        Offer
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-base font-black font-mono text-neutral-900">
                      ₹{price}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs font-mono line-through text-neutral-400">
                        ₹{regularPrice}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Controls & Add Button */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-neutral-200 rounded-xl bg-white shadow-2xs overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(v.id, -1)}
                      className="px-2.5 py-1.5 hover:bg-neutral-100 text-neutral-600 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 font-mono font-bold text-neutral-900 text-xs">
                      {currentQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(v.id, 1)}
                      className="px-2.5 py-1.5 hover:bg-neutral-100 text-neutral-600 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Add Button */}
                  <button
                    type="button"
                    onClick={() => handleSelect(v)}
                    className="px-3.5 py-2 bg-neutral-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add {currentQty > 1 ? `(${currentQty})` : ''}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Click any portion to immediately add to active bill.</span>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-700 hover:text-black font-semibold cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
