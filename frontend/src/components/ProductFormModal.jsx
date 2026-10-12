import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2, Tag, DollarSign, Image as ImageIcon, Check } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ProductFormModal({ isOpen, onClose, product, categories, onSaved }) {
  const { addToast } = useToast();
  const isEdit = Boolean(product && product.id);

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    sku: '',
    description: '',
    base_price: '',
    offer_price: '',
    dine_in_price: '',
    takeaway_price: '',
    delivery_price: '',
    is_featured: false,
    is_bestseller: false,
    is_new_arrival: false,
    is_todays_special: false,
    is_active: true,
    is_available: true,
    stock_quantity: 100,
    image_url: '',
    variants: [],
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'pricing', 'variants', 'image'

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category_id: product.category_id || (categories[0]?.id || ''),
        sku: product.sku || '',
        description: product.description || '',
        base_price: product.base_price || '',
        offer_price: product.offer_price || '',
        dine_in_price: product.dine_in_price || '',
        takeaway_price: product.takeaway_price || '',
        delivery_price: product.delivery_price || '',
        is_featured: Boolean(product.is_featured),
        is_bestseller: Boolean(product.is_bestseller),
        is_new_arrival: Boolean(product.is_new_arrival),
        is_todays_special: Boolean(product.is_todays_special),
        is_active: product.is_active !== undefined ? Boolean(product.is_active) : true,
        is_available: product.is_available !== undefined ? Boolean(product.is_available) : true,
        stock_quantity: product.stock_quantity ?? 100,
        image_url: product.image_url || '',
        variants: product.variants ? product.variants.map(v => ({ ...v })) : [],
      });
      setImagePreview(product.image_url || '');
    } else {
      setFormData({
        name: '',
        category_id: categories[0]?.id || '',
        sku: 'AR-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        description: '',
        base_price: '',
        offer_price: '',
        dine_in_price: '',
        takeaway_price: '',
        delivery_price: '',
        is_featured: false,
        is_bestseller: false,
        is_new_arrival: false,
        is_todays_special: false,
        is_active: true,
        is_available: true,
        stock_quantity: 100,
        image_url: '',
        variants: [],
      });
      setImagePreview('');
    }
    setSelectedFile(null);
  }, [product, categories, isOpen]);

  if (!isOpen) return null;

  // Auto-calculated pricing
  const basePriceNum = parseFloat(formData.base_price) || 0;
  const offerPriceNum = parseFloat(formData.offer_price) || 0;
  const hasOffer = offerPriceNum > 0 && offerPriceNum < basePriceNum;
  const discountAmount = hasOffer ? (basePriceNum - offerPriceNum).toFixed(2) : 0;
  const discountPercent = hasOffer ? Math.round(((basePriceNum - offerPriceNum) / basePriceNum) * 100) : 0;
  const finalPrice = hasOffer ? offerPriceNum : basePriceNum;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('Image size cannot exceed 5MB', 'error');
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeSelectedImage = () => {
    setSelectedFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        { variant_name: '', regular_price: '', offer_price: '', is_available: true }
      ]
    }));
  };

  const updateVariant = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.variants];
      updated[index][field] = value;
      return { ...prev, variants: updated };
    });
  };

  const removeVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast('Product name is required', 'error');
      setActiveTab('general');
      return;
    }
    if (!formData.category_id) {
      addToast('Please select a category', 'error');
      setActiveTab('general');
      return;
    }
    if (!formData.base_price || parseFloat(formData.base_price) <= 0) {
      addToast('Please enter a valid regular price', 'error');
      setActiveTab('pricing');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        name: formData.name,
        category_id: formData.category_id,
        sku: formData.sku,
        description: formData.description,
        base_price: parseFloat(formData.base_price),
        offer_price: formData.offer_price ? parseFloat(formData.offer_price) : null,
        dine_in_price: formData.dine_in_price ? parseFloat(formData.dine_in_price) : null,
        takeaway_price: formData.takeaway_price ? parseFloat(formData.takeaway_price) : null,
        delivery_price: formData.delivery_price ? parseFloat(formData.delivery_price) : null,
        is_featured: formData.is_featured,
        is_bestseller: formData.is_bestseller,
        is_new_arrival: formData.is_new_arrival,
        is_todays_special: formData.is_todays_special,
        is_active: formData.is_active,
        is_available: formData.is_available,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        image_url: formData.image_url,
        variants: formData.variants.filter(v => v.variant_name.trim() !== ''),
      };

      let savedProduct;
      if (isEdit) {
        const res = await api.updateProduct(product.id, payload);
        savedProduct = res.data;
      } else {
        const res = await api.createProduct(payload);
        savedProduct = res.data;
      }

      // If user uploaded a physical file
      if (selectedFile && savedProduct?.id) {
        const fd = new FormData();
        fd.append('image', selectedFile);
        fd.append('is_primary', '1');
        await api.uploadProductImage(savedProduct.id, fd);
      }

      addToast(isEdit ? 'Product updated successfully!' : 'Product created successfully!', 'success');
      onSaved();
      onClose();
    } catch (err) {
      addToast(err.message || 'Failed to save product', 'error');
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
        className="bg-white border border-neutral-200 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">Products Suite</span>
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              {isEdit ? 'Edit Product' : 'Add New Product'}
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                {formData.sku || 'SKU Auto'}
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-200 bg-neutral-50/50 px-6 gap-2 pt-2">
          {[
            { id: 'general', label: '1. General Info' },
            { id: 'pricing', label: '2. Dynamic Pricing' },
            { id: 'variants', label: `3. Portions (${formData.variants.length})` },
            { id: 'image', label: '4. Image & Media' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-black text-black font-semibold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: General Info */}
          {activeTab === 'general' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Chicken Dum Biryani"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      SKU Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, sku: 'AR-' + Math.random().toString(36).substring(2, 8).toUpperCase() })}
                      className="text-[11px] text-neutral-600 hover:text-black font-semibold"
                    >
                      Regenerate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="AR-BRY-001"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2 text-xs text-neutral-900 font-mono placeholder:text-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Product Description & Ingredients
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe taste profile, royal spices, slow-cooking process..."
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all resize-none"
                />
              </div>

              {/* Status and Flags */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Badges & Visibility</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {[
                    { key: 'is_featured', label: '⭐ Featured' },
                    { key: 'is_bestseller', label: '🔥 Bestseller' },
                    { key: 'is_new_arrival', label: '✨ New Arrival' },
                    { key: 'is_todays_special', label: "👑 Today's Special" },
                  ].map((flag) => (
                    <label
                      key={flag.key}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        formData[flag.key]
                          ? 'bg-black text-white border-black font-semibold'
                          : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData[flag.key]}
                        onChange={(e) => setFormData({ ...formData, [flag.key]: e.target.checked })}
                        className="rounded border-neutral-300 text-black focus:ring-black"
                      />
                      <span className="text-xs">{flag.label}</span>
                    </label>
                  ))}
                </div>

                <div className="flex items-center gap-6 pt-2 border-t border-neutral-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-neutral-300 text-black focus:ring-black"
                    />
                    <span className="text-xs font-medium text-neutral-800">Active (Visible in menu)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_available}
                      onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                      className="rounded border-neutral-300 text-black focus:ring-black"
                    />
                    <span className="text-xs font-medium text-neutral-800">In Stock (Ordering enabled)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Dynamic Pricing */}
          {activeTab === 'pricing' && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Live Price Calculator Showcase */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Live Price Calculation</span>
                  <div className="flex items-baseline gap-2.5 mt-1">
                    {hasOffer ? (
                      <>
                        <span className="text-2xl font-bold text-neutral-900 font-mono">
                          ₹{finalPrice.toFixed(2)}
                        </span>
                        <span className="text-sm line-through text-neutral-400 font-mono">
                          ₹{basePriceNum.toFixed(2)}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-black text-white text-[11px] font-medium">
                          {discountPercent}% OFF (Save ₹{discountAmount})
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-neutral-900 font-mono">
                        ₹{basePriceNum > 0 ? basePriceNum.toFixed(2) : '0.00'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-neutral-500 max-w-xs leading-relaxed">
                  Regular price appears with strikethrough when offer price is configured. All prices lock at checkout.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Regular Selling Price (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-neutral-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                      placeholder="180.00"
                      className="w-full bg-white border border-neutral-300 rounded-lg pl-7 pr-3.5 py-2 text-xs text-neutral-900 font-mono focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    />
                  </div>
                  <span className="text-[11px] text-neutral-400 mt-1 block">Standard baseline price.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Offer Price (₹) <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-neutral-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.offer_price}
                      onChange={(e) => setFormData({ ...formData, offer_price: e.target.value })}
                      placeholder="149.00"
                      className="w-full bg-white border border-neutral-300 rounded-lg pl-7 pr-3.5 py-2 text-xs text-neutral-900 font-mono focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    />
                  </div>
                  <span className="text-[11px] text-neutral-400 mt-1 block">Must be lower than regular price.</span>
                </div>
              </div>

              {/* Order Channel Specific Pricing */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Channel Specific Pricing</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1 font-medium">Dine-in (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.dine_in_price}
                      onChange={(e) => setFormData({ ...formData, dine_in_price: e.target.value })}
                      placeholder={formData.base_price || '180.00'}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-neutral-900 font-mono text-xs focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1 font-medium">Takeaway (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.takeaway_price}
                      onChange={(e) => setFormData({ ...formData, takeaway_price: e.target.value })}
                      placeholder={formData.base_price || '170.00'}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-neutral-900 font-mono text-xs focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1 font-medium">Delivery (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.delivery_price}
                      onChange={(e) => setFormData({ ...formData, delivery_price: e.target.value })}
                      placeholder={formData.base_price ? (basePriceNum * 1.1).toFixed(2) : '195.00'}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-neutral-900 font-mono text-xs focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Variants / Portions */}
          {activeTab === 'variants' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Product Portions & Sizes</h4>
                  <p className="text-[11px] text-neutral-500">Configure sizes like Half, Full, Family Pack with custom pricing.</p>
                </div>
                <button
                  type="button"
                  onClick={addVariant}
                  className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Portion
                </button>
              </div>

              {formData.variants.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-neutral-200 rounded-xl text-center">
                  <p className="text-xs text-neutral-500">No portion variants added yet. Click above to add sizes.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {formData.variants.map((v, idx) => (
                    <div key={idx} className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-[11px] text-neutral-600 mb-1 font-medium">Portion Name</label>
                        <input
                          type="text"
                          required
                          value={v.variant_name}
                          onChange={(e) => updateVariant(idx, 'variant_name', e.target.value)}
                          placeholder="e.g. Half Portion"
                          className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-neutral-900 text-xs focus:outline-none focus:border-black"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-neutral-600 mb-1 font-medium">Regular Price (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={v.regular_price}
                          onChange={(e) => updateVariant(idx, 'regular_price', e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-neutral-900 font-mono text-xs focus:outline-none focus:border-black"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-neutral-600 mb-1 font-medium">Offer Price (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={v.offer_price || ''}
                          onChange={(e) => updateVariant(idx, 'offer_price', e.target.value)}
                          placeholder="Optional"
                          className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-neutral-900 font-mono text-xs focus:outline-none focus:border-black"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => removeVariant(idx)}
                          className="p-2 text-neutral-400 hover:text-black hover:bg-neutral-200 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Image & Media */}
          {activeTab === 'image' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Primary Product Image</span>
                
                {/* Image Preview Box */}
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden max-w-sm border border-neutral-200 bg-white group shadow-sm">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="w-full h-44 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="cursor-pointer px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-xs rounded-lg transition-all shadow-sm">
                        Replace Image
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>
                      <button
                        type="button"
                        onClick={removeSelectedImage}
                        className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white font-semibold text-xs rounded-lg transition-all shadow-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-neutral-300 hover:border-black rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-white hover:bg-neutral-50">
                    <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                    <span className="text-xs font-semibold text-neutral-800">Upload Product Image</span>
                    <span className="text-[11px] text-neutral-400 mt-1">Supports PNG, JPG, JPEG, WEBP (Max 5MB)</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                )}

                <div className="pt-3 border-t border-neutral-200">
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Or direct Image URL</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => {
                      setFormData({ ...formData, image_url: e.target.value });
                      setImagePreview(e.target.value);
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2 text-neutral-900 text-xs focus:outline-none focus:border-black"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
            <div className="text-[11px] text-neutral-400">
              * Required fields. All price updates are audited and recorded safely.
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-black bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-black hover:bg-neutral-800 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              >
                {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
