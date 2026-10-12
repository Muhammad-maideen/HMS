import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function CategoryModal({ isOpen, onClose, category, onSaved }) {
  const { addToast } = useToast();
  const isEdit = Boolean(category && category.id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    is_active: true,
    sort_order: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        image: category.image || '',
        is_active: Boolean(category.is_active),
        sort_order: category.sort_order ?? 1,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        image: '',
        is_active: true,
        sort_order: 1,
      });
    }
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast('Category name is required', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEdit) {
        await api.updateCategory(category.id, formData);
        addToast('Category updated successfully!', 'success');
      } else {
        await api.createCategory(formData);
        addToast('Category created successfully!', 'success');
      }
      onSaved();
      onClose();
    } catch (err) {
      addToast(err.message || 'Failed to save category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-neutral-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Categories</span>
            <h3 className="text-base font-bold text-neutral-900">
              {isEdit ? 'Edit Category' : 'Create New Category'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-black rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Signature Biryanis"
              className="w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief details about dishes in this category..."
              className="w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Cover Image URL
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://..."
              className="w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Display Sort Order
              </label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                className="w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-neutral-300 text-black focus:ring-black"
                />
                <span className="text-xs font-medium text-neutral-800">Active Category</span>
              </label>
            </div>
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
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
