import React, { useState, useEffect } from 'react';
import { X, Calendar, Percent, Tag, Clock } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function OfferModal({ isOpen, onClose, offer, categories = [], onSaved }) {
  const { addToast } = useToast();
  const isEdit = Boolean(offer && offer.id);

  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '0',
    max_discount_amount: '',
    start_time: '',
    end_time: '',
    badge_text: '',
    target_type: 'all',
    target_ids: [],
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (offer) {
      setFormData({
        title: offer.title || '',
        code: offer.code || '',
        description: offer.description || '',
        discount_type: offer.discount_type || 'percentage',
        discount_value: offer.discount_value ?? '',
        min_order_amount: offer.min_order_amount ?? '0',
        max_discount_amount: offer.max_discount_amount ?? '',
        start_time: offer.start_time ? offer.start_time.substring(0, 16) : '',
        end_time: offer.end_time ? offer.end_time.substring(0, 16) : '',
        badge_text: offer.badge_text || '',
        target_type: offer.target_type || 'all',
        target_ids: offer.target_ids || [],
        is_active: offer.is_active !== undefined ? Boolean(offer.is_active) : true,
      });
    } else {
      const now = new Date();
      const nextMonth = new Date();
      nextMonth.setDate(now.getDate() + 30);

      const toISOStringForInput = (d) => {
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().substring(0, 16);
      };

      setFormData({
        title: '',
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '20',
        min_order_amount: '300',
        max_discount_amount: '100',
        start_time: toISOStringForInput(now),
        end_time: toISOStringForInput(nextMonth),
        badge_text: '20% OFF',
        target_type: 'all',
        target_ids: [],
        is_active: true,
      });
    }
  }, [offer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.code.trim()) {
      addToast('Title and Promo Code are required', 'error');
      return;
    }
    if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
      addToast('Please enter a valid discount value', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: parseFloat(formData.min_order_amount) || 0,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
      };

      if (isEdit) {
        await api.updateOffer(offer.id, payload);
        addToast('Offer updated successfully!', 'success');
      } else {
        await api.createOffer(payload);
        addToast('Offer created successfully!', 'success');
      }
      onSaved();
      onClose();
    } catch (err) {
      addToast(err.message || 'Failed to save offer', 'error');
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
        className="bg-white border border-neutral-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">Promotions</span>
            <h3 className="text-base font-bold text-neutral-900">
              {isEdit ? 'Edit Promotional Offer' : 'Create Special Offer'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-black rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Campaign Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Royal Feast 20% OFF"
                className="w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Promo Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="ROYAL20"
                className="w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2 text-xs text-neutral-900 font-mono uppercase placeholder:text-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Terms, minimum spend requirements, eligible dishes..."
              className="w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none transition-all"
            />
          </div>

          {/* Discount details */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-neutral-600 mb-1 font-medium">Discount Type</label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-black"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Flat Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-600 mb-1 font-medium">
                  Value {formData.discount_type === 'percentage' ? '(%)' : '(₹)'} *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  placeholder={formData.discount_type === 'percentage' ? '20' : '50'}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-xs text-neutral-900 font-mono focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-600 mb-1 font-medium">Max Cap (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.max_discount_amount}
                  onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                  placeholder="Optional limit"
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-xs text-neutral-900 font-mono focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs text-neutral-600 mb-1 font-medium">Minimum Order (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-xs text-neutral-900 font-mono focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-600 mb-1 font-medium">Badge Label (e.g. 20% OFF)</label>
                <input
                  type="text"
                  value={formData.badge_text}
                  onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                  placeholder="20% OFF"
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>

          {/* Schedule Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-500" /> Start Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-500" /> Expiry Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="offer_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-neutral-300 text-black focus:ring-black"
            />
            <label htmlFor="offer_active" className="text-xs font-medium text-neutral-800 cursor-pointer">
              Active Campaign (Available for checkout application)
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-neutral-100">
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
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
