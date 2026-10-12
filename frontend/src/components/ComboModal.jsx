import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Layers } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ComboModal({ isOpen, onClose, combo, products = [], onSaved }) {
  const { addToast } = useToast();
  const isEdit = Boolean(combo && combo.id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    regular_price: '',
    combo_price: '',
    customer_savings: '',
    badge_text: '',
    is_active: true,
    is_available: true,
    items: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (combo) {
      setFormData({
        name: combo.name || '',
        description: combo.description || '',
        image_url: combo.image_url || '',
        regular_price: combo.regular_price || '',
        combo_price: combo.combo_price || '',
        customer_savings: combo.customer_savings || '',
        badge_text: combo.badge_text || '',
        is_active: combo.is_active !== undefined ? Boolean(combo.is_active) : true,
        is_available: combo.is_available !== undefined ? Boolean(combo.is_available) : true,
        items: combo.items ? combo.items.map(it => ({
          product_id: it.product_id,
          variant_id: it.variant_id || '',
          quantity: it.quantity || 1,
          is_optional: Boolean(it.is_optional),
          substitution_notes: it.substitution_notes || '',
        })) : [],
      });
    } else {
      setFormData({
        name: '',
        description: '',
        image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
        regular_price: '',
        combo_price: '',
        customer_savings: '',
        badge_text: 'Save ₹50',
        is_active: true,
        is_available: true,
        items: [
          { product_id: products[0]?.id || '', variant_id: '', quantity: 1, is_optional: false, substitution_notes: '' }
        ],
      });
    }
  }, [combo, products, isOpen]);

  // Recalculate component regular price based on selected products & variants
  const calculatedSum = formData.items.reduce((sum, item) => {
    const prod = products.find(p => p.id === parseInt(item.product_id));
    if (!prod) return sum;
    let price = prod.base_price;
    if (item.variant_id && prod.variants) {
      const v = prod.variants.find(vr => vr.id === parseInt(item.variant_id));
      if (v) price = v.regular_price;
    }
    return sum + (price * (parseInt(item.quantity) || 1));
  }, 0);

  const regularPriceVal = parseFloat(formData.regular_price) || calculatedSum;
  const comboPriceVal = parseFloat(formData.combo_price) || 0;
  const savingsVal = Math.max(0, regularPriceVal - comboPriceVal);

  if (!isOpen) return null;

  const addItemRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: products[0]?.id || '',
          variant_id: '',
          quantity: 1,
          is_optional: false,
          substitution_notes: ''
        }
      ]
    }));
  };

  const updateItemRow = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const removeItemRow = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      addToast('Combo name is required', 'error');
      return;
    }
    if (formData.items.length === 0) {
      addToast('Please add at least one component product to the combo', 'error');
      return;
    }
    if (!formData.combo_price || comboPriceVal <= 0) {
      addToast('Please enter a valid combo price', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        regular_price: regularPriceVal,
        combo_price: comboPriceVal,
        customer_savings: savingsVal,
        badge_text: formData.badge_text || `Save ₹${savingsVal.toFixed(0)}`,
        items: formData.items.map(it => ({
          ...it,
          product_id: parseInt(it.product_id),
          variant_id: it.variant_id ? parseInt(it.variant_id) : null,
          quantity: parseInt(it.quantity) || 1,
        })),
      };

      if (isEdit) {
        await api.updateCombo(combo.id, payload);
        addToast('Combo deal updated successfully!', 'success');
      } else {
        await api.createCombo(payload);
        addToast('Combo deal created successfully!', 'success');
      }
      onSaved();
      onClose();
    } catch (err) {
      addToast(err.message || 'Failed to save combo deal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-neutral-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] flex flex-col"
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">Combos & Deals</span>
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-neutral-900" />
              {isEdit ? 'Edit Combo Meal' : 'Create New Combo Deal'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-black rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Combo Deal Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Elite Biryani Royal Combo"
                className="w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Combo Image URL
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
                className="w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Description & Highlights
            </label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. 1 Chicken Biryani, 1 Chicken 65, Raita, and Gulab Jamun..."
              className="w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none"
            />
          </div>

          {/* Component Products Builder */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Component Products & Quantities
                </h4>
                <p className="text-[11px] text-neutral-500">Select items included in this combo deal</p>
              </div>
              <button
                type="button"
                onClick={addItemRow}
                className="px-2.5 py-1 bg-black hover:bg-neutral-800 text-white font-medium text-xs rounded-lg flex items-center gap-1 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="space-y-2.5">
              {formData.items.map((item, idx) => {
                const selectedProd = products.find(p => p.id === parseInt(item.product_id));
                const variants = selectedProd?.variants || [];

                return (
                  <div key={idx} className="p-3 bg-white border border-neutral-200 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                    <div className="md:col-span-5">
                      <label className="block text-[10px] text-neutral-500 uppercase mb-0.5 font-semibold">Product</label>
                      <select
                        value={item.product_id}
                        onChange={(e) => {
                          updateItemRow(idx, 'product_id', e.target.value);
                          updateItemRow(idx, 'variant_id', '');
                        }}
                        className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-neutral-900 text-xs focus:outline-none focus:border-black"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₹{p.base_price})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[10px] text-neutral-500 uppercase mb-0.5 font-semibold">Portion / Variant</label>
                      <select
                        value={item.variant_id}
                        onChange={(e) => updateItemRow(idx, 'variant_id', e.target.value)}
                        className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-neutral-900 text-xs focus:outline-none focus:border-black"
                      >
                        <option value="">Default Portion</option>
                        {variants.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.variant_name} (₹{v.regular_price})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-neutral-500 uppercase mb-0.5 font-semibold">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItemRow(idx, 'quantity', e.target.value)}
                        className="w-full bg-white border border-neutral-300 rounded-lg px-2 py-1.5 text-neutral-900 text-xs font-mono focus:outline-none focus:border-black"
                      />
                    </div>

                    <div className="md:col-span-2 flex items-center justify-end gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Substitution Note */}
                    <div className="md:col-span-12 flex items-center gap-2 pt-1 border-t border-neutral-100">
                      <input
                        type="text"
                        value={item.substitution_notes}
                        onChange={(e) => updateItemRow(idx, 'substitution_notes', e.target.value)}
                        placeholder="Optional substitution: e.g. Swap Raita with Salad"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 text-neutral-700 text-xs focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing & Customer Savings Calculations */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              Pricing & Customer Savings
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-neutral-600 mb-1 font-medium">
                  Regular Total (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.regular_price || calculatedSum}
                  onChange={(e) => setFormData({ ...formData, regular_price: e.target.value })}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-neutral-900 font-mono text-xs focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-900 mb-1">
                  Special Combo Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={formData.combo_price}
                  onChange={(e) => setFormData({ ...formData, combo_price: e.target.value })}
                  placeholder="249.00"
                  className="w-full bg-white border border-black rounded-lg px-3 py-1.5 text-black font-mono text-sm font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-600 mb-1 font-medium">
                  Customer Savings (₹)
                </label>
                <div className="px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-neutral-900 font-mono text-sm font-bold">
                  ₹{savingsVal.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2 border-t border-neutral-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-neutral-300 text-black focus:ring-black"
                />
                <span className="text-xs font-medium text-neutral-800">Active Deal</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="rounded border-neutral-300 text-black focus:ring-black"
                />
                <span className="text-xs font-medium text-neutral-800">In Stock (Available for POS)</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-black bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-black hover:bg-neutral-800 rounded-lg shadow-sm transition-all"
            >
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Combo Meal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
