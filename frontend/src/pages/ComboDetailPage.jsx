import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  ChevronDown, 
  Eye, 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  List, 
  ListOrdered, 
  Link2, 
  Image as ImageIcon, 
  Code,
  Layers,
  Sparkles,
  HelpCircle,
  Tag,
  CheckCircle2,
  DollarSign,
  Utensils
} from 'lucide-react';
import { api, getRole } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ComboDetailPage({ 
  combo = null, 
  products = [], 
  onBack, 
  onSaved 
}) {
  const { addToast } = useToast();
  const currentRole = getRole();
  const canModify = currentRole === 'admin' || currentRole === 'manager';
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
    serving_size: 'Feeds 1-2 Persons',
    kitchen_station: 'Main Kitchen',
    channel_pos: true,
    channel_dine_in: true,
    channel_delivery: true,
    items: []
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState('url'); // 'url' or 'upload'

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
        serving_size: combo.serving_size || 'Feeds 1-2 Persons',
        kitchen_station: combo.kitchen_station || 'Main Kitchen',
        channel_pos: true,
        channel_dine_in: true,
        channel_delivery: true,
        items: combo.items && combo.items.length > 0 ? combo.items.map(it => ({
          product_id: it.product_id,
          variant_id: it.variant_id || '',
          quantity: it.quantity || 1,
          is_optional: Boolean(it.is_optional),
          substitution_notes: it.substitution_notes || '',
        })) : [
          { product_id: products[0]?.id || '', variant_id: '', quantity: 1, is_optional: false, substitution_notes: '' }
        ]
      });
      setImagePreview(combo.image_url || '');
    } else {
      setFormData({
        name: '',
        description: '',
        image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
        regular_price: '',
        combo_price: '',
        customer_savings: '',
        badge_text: 'Best Value Deal',
        is_active: true,
        is_available: true,
        serving_size: 'Feeds 1-2 Persons',
        kitchen_station: 'Main Kitchen',
        channel_pos: true,
        channel_dine_in: true,
        channel_delivery: true,
        items: [
          { product_id: products[0]?.id || '', variant_id: '', quantity: 1, is_optional: false, substitution_notes: '' }
        ]
      });
      setImagePreview('https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80');
    }
    setSelectedFile(null);
  }, [combo, products]);

  // Compute sum of constituent items based on selected product & variants
  const calculatedRegularSum = formData.items.reduce((sum, item) => {
    const prod = products.find(p => p.id === parseInt(item.product_id));
    if (!prod) return sum;
    let price = prod.base_price;
    if (item.variant_id && prod.variants) {
      const v = prod.variants.find(vr => vr.id === parseInt(item.variant_id));
      if (v) price = v.regular_price;
    }
    return sum + (price * (parseInt(item.quantity) || 1));
  }, 0);

  const regularPriceVal = parseFloat(formData.regular_price) || calculatedRegularSum;
  const comboPriceVal = parseFloat(formData.combo_price) || 0;
  const savingsVal = Math.max(0, regularPriceVal - comboPriceVal);
  const savingsPercent = regularPriceVal > 0 ? Math.round((savingsVal / regularPriceVal) * 100) : 0;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('Image size cannot exceed 5MB', 'error');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData(prev => ({ ...prev, image_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

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
    if (formData.items.length <= 1) {
      addToast('A combo must include at least one dish', 'error');
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!canModify) {
      addToast(`Role '${currentRole}' is not authorized to modify combos`, 'error');
      return;
    }

    if (!formData.name.trim()) {
      addToast('Combo deal name is required', 'error');
      return;
    }

    if (formData.items.length === 0) {
      addToast('Please include at least one dish in this combo', 'error');
      return;
    }

    if (!formData.combo_price || comboPriceVal <= 0) {
      addToast('Please enter a valid combo price', 'error');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        description: formData.description,
        image_url: formData.image_url,
        regular_price: regularPriceVal,
        combo_price: comboPriceVal,
        customer_savings: savingsVal,
        badge_text: formData.badge_text || (savingsVal > 0 ? `Save ₹${savingsVal.toFixed(0)}` : 'Special Deal'),
        is_active: formData.is_active,
        is_available: formData.is_available,
        items: formData.items.map(it => ({
          product_id: parseInt(it.product_id),
          variant_id: it.variant_id ? parseInt(it.variant_id) : null,
          quantity: parseInt(it.quantity) || 1,
          is_optional: Boolean(it.is_optional),
          substitution_notes: it.substitution_notes || null
        }))
      };

      if (isEdit) {
        await api.updateCombo(combo.id, payload);
        addToast(`Combo deal '${formData.name}' updated successfully!`, 'success');
      } else {
        await api.createCombo(payload);
        addToast(`Combo deal '${formData.name}' created successfully!`, 'success');
      }

      if (onSaved) onSaved();
      if (onBack) onBack();
    } catch (err) {
      addToast(err.message || 'Failed to save combo deal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-[#f6f6f7] text-neutral-900 pb-16 animate-fadeIn">
      
      {/* Top Header Bar */}
      <div className="sticky top-0 z-30 bg-[#f6f6f7]/95 backdrop-blur-sm border-b border-neutral-200 px-6 py-3 flex items-center justify-between">
        
        {/* Left: Back Arrow and Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg border border-neutral-300 hover:border-black bg-white text-neutral-700 hover:text-black transition-all shadow-xs"
            title="Back to Combos"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          
          <div className="flex items-center gap-2">
            <span 
              onClick={onBack} 
              className="text-xs text-neutral-500 hover:text-black cursor-pointer font-medium"
            >
              Combos
            </span>
            <span className="text-neutral-400 text-xs">/</span>
            <h1 className="text-sm md:text-base font-bold text-neutral-900 truncate max-w-md">
              {isEdit ? formData.name || 'Edit combo meal' : 'Add combo meal'}
            </h1>
          </div>
        </div>

        {/* Right: Discard & Save Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-1.5 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg shadow-xs transition-all"
          >
            Discard
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-black hover:bg-neutral-800 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSubmitting && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
            <span>Save</span>
          </button>
        </div>

      </div>

      {/* Main Two-Column Container */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ================= LEFT COLUMN (~68%) ================= */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* CARD 1: Title & Description */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Elite Biryani Royal Combo, Nawabi Feast for Two"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                  required
                />
              </div>

              {/* Rich text editor toolbar */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-1.5">
                  Description
                </label>
                <div className="border border-neutral-300 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-black focus-within:border-black">
                  
                  {/* Toolbar */}
                  <div className="bg-neutral-50 border-b border-neutral-200 px-3 py-2 flex items-center gap-1 flex-wrap text-neutral-600">
                    <button type="button" className="p-1.5 hover:bg-neutral-200 rounded transition-colors text-neutral-700">
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1.5 hover:bg-neutral-200 rounded transition-colors text-neutral-700">
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1.5 hover:bg-neutral-200 rounded transition-colors text-neutral-700">
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                    <div className="h-4 w-px bg-neutral-300 mx-1"></div>
                    <button type="button" className="p-1.5 hover:bg-neutral-200 rounded transition-colors text-neutral-700">
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1.5 hover:bg-neutral-200 rounded transition-colors text-neutral-700">
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1.5 hover:bg-neutral-200 rounded transition-colors text-neutral-700">
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <div className="h-4 w-px bg-neutral-300 mx-1"></div>
                    <button type="button" className="p-1.5 hover:bg-neutral-200 rounded transition-colors text-neutral-700">
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1.5 hover:bg-neutral-200 rounded transition-colors text-neutral-700">
                      <ImageIcon className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1.5 hover:bg-neutral-200 rounded transition-colors text-neutral-700">
                      <Code className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what makes this combo special, bundle contents, portion sizing, and who it's ideal for..."
                    className="w-full p-3.5 text-xs bg-white focus:outline-none resize-y"
                  />
                </div>
              </div>

              {/* Promotional Badge */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-neutral-700" />
                    Promotional Tag / Badge Text
                  </span>
                  <span className="text-[10px] text-neutral-400 font-normal">Shown on POS card & menu</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.badge_text}
                    onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                    placeholder={savingsVal > 0 ? `Save ₹${savingsVal.toFixed(0)}` : "Chef's Best Value, Save 20%, etc."}
                    className="w-full pl-3 pr-24 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  {formData.badge_text && (
                    <span className="absolute right-2.5 top-2 px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-900 text-white">
                      {formData.badge_text}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* CARD 2: Media */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-neutral-900">Media</h3>
                  <p className="text-[11px] text-neutral-500">Add an enticing photo of the complete combo platter</p>
                </div>
                <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab('url')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      activeMediaTab === 'url' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-500'
                    }`}
                  >
                    Image URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab('upload')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      activeMediaTab === 'upload' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-500'
                    }`}
                  >
                    Upload File
                  </button>
                </div>
              </div>

              {activeMediaTab === 'url' ? (
                <div>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => {
                      setFormData({ ...formData, image_url: e.target.value });
                      setImagePreview(e.target.value);
                    }}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3.5 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-neutral-300 rounded-xl p-6 text-center hover:border-black transition-colors cursor-pointer bg-neutral-50/50 relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mb-2 text-neutral-500">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-neutral-800">
                      Drag and drop image here, or browse
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      PNG, JPG, WebP up to 5MB
                    </p>
                  </div>
                </div>
              )}

              {/* Preview */}
              {imagePreview && (
                <div className="mt-3 relative w-32 h-32 rounded-xl overflow-hidden border border-neutral-200 group">
                  <img
                    src={imagePreview}
                    alt="Combo preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setFormData({ ...formData, image_url: '' });
                      setSelectedFile(null);
                    }}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-black text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* CARD 3: Bundle Component Dishes */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-neutral-900" />
                    Included Dishes & Items
                    <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-[10px] font-bold">
                      {formData.items.length} items
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Select the menu dishes bundled into this combo with their portion variants and quantities
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addItemRow}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-lg border border-neutral-200 flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add dish</span>
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {formData.items.map((item, index) => {
                  const prod = products.find(p => p.id === parseInt(item.product_id));
                  const variants = prod?.variants || [];
                  const selectedVariant = variants.find(v => v.id === parseInt(item.variant_id));
                  const itemUnitPrice = selectedVariant ? selectedVariant.regular_price : (prod?.base_price || 0);
                  const itemLineTotal = itemUnitPrice * (parseInt(item.quantity) || 1);

                  return (
                    <div 
                      key={index} 
                      className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 transition-colors space-y-3"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        
                        {/* Product Selector (5 cols) */}
                        <div className="md:col-span-5">
                          <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">
                            Dish #{index + 1}
                          </label>
                          <select
                            value={item.product_id}
                            onChange={(e) => {
                              const newProdId = e.target.value;
                              const newProd = products.find(p => p.id === parseInt(newProdId));
                              const firstVar = newProd?.variants?.[0]?.id || '';
                              updateItemRow(index, 'product_id', newProdId);
                              updateItemRow(index, 'variant_id', firstVar);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black font-medium"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Base ₹{p.base_price})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Portion Variant Selector (3 cols) */}
                        <div className="md:col-span-3">
                          <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">
                            Portion Variant
                          </label>
                          <select
                            value={item.variant_id}
                            onChange={(e) => updateItemRow(index, 'variant_id', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                          >
                            <option value="">Standard Portion (₹{prod?.base_price || 0})</option>
                            {variants.map(v => (
                              <option key={v.id} value={v.id}>
                                {v.portion_name || v.name} (₹{v.regular_price})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity (2 cols) */}
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">
                            Quantity
                          </label>
                          <div className="flex items-center border border-neutral-300 rounded-lg overflow-hidden bg-white">
                            <button
                              type="button"
                              onClick={() => {
                                const currentQty = parseInt(item.quantity) || 1;
                                if (currentQty > 1) updateItemRow(index, 'quantity', currentQty - 1);
                              }}
                              className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItemRow(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full text-center text-xs py-1 focus:outline-none font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const currentQty = parseInt(item.quantity) || 1;
                                updateItemRow(index, 'quantity', currentQty + 1);
                              }}
                              className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Item Total & Remove (2 cols) */}
                        <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-3 pt-4 md:pt-3">
                          <div className="text-right">
                            <span className="text-[10px] text-neutral-400 block">Value</span>
                            <span className="text-xs font-bold text-neutral-900">
                              ₹{itemLineTotal}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItemRow(index)}
                            className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Remove dish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>

                      {/* Substitution Notes or Customization */}
                      <div className="flex items-center gap-3 pt-1 border-t border-neutral-200/60 text-xs">
                        <label className="flex items-center gap-1.5 text-neutral-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.is_optional}
                            onChange={(e) => updateItemRow(index, 'is_optional', e.target.checked)}
                            className="w-3.5 h-3.5 rounded text-black focus:ring-black"
                          />
                          <span className="text-[11px] font-medium">Optional / Choice item</span>
                        </label>

                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.substitution_notes || ''}
                            onChange={(e) => updateItemRow(index, 'substitution_notes', e.target.value)}
                            placeholder="Optional customization notes (e.g. choice of Mirchi ka Salan or Raita)"
                            className="w-full px-2.5 py-1 text-[11px] bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                          />
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Component Sum Highlight */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 font-medium">Total Constituent Value:</span>
                  <span className="font-bold text-neutral-900 text-sm">₹{calculatedRegularSum}</span>
                </div>
                {comboPriceVal > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500 font-medium">Customer Deal Savings:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                      Save ₹{savingsVal.toFixed(0)} ({savingsPercent}% OFF)
                    </span>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* ================= RIGHT COLUMN (~32%) ================= */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* CARD 1: Status & Kitchen Availability */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-1.5">
                  Status
                </label>
                <select
                  value={formData.is_active ? 'active' : 'draft'}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black font-semibold"
                >
                  <option value="active">Active (Visible in POS & Menus)</option>
                  <option value="draft">Draft (Hidden)</option>
                </select>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Active combos can be ordered by cashiers at the POS terminal.
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-100">
                <label className="block text-xs font-bold text-neutral-900 mb-1.5">
                  Kitchen Readiness
                </label>
                <select
                  value={formData.is_available ? 'available' : 'unavailable'}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.value === 'available' })}
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black font-semibold"
                >
                  <option value="available">In Stock & Ready</option>
                  <option value="unavailable">Temporarily Sold Out</option>
                </select>
              </div>
            </div>

            {/* CARD 2: Pricing & Savings */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-neutral-900" />
                Pricing & Value
              </h3>

              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-1">
                  Combo Deal Price (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-neutral-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.combo_price}
                    onChange={(e) => setFormData({ ...formData, combo_price: e.target.value })}
                    placeholder="e.g. 459"
                    className="w-full pl-7 pr-3 py-2 text-sm font-bold text-neutral-900 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-1">
                  Regular Price Value (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-neutral-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.regular_price || calculatedRegularSum}
                    onChange={(e) => setFormData({ ...formData, regular_price: e.target.value })}
                    placeholder={calculatedRegularSum.toString()}
                    className="w-full pl-7 pr-3 py-2 text-xs text-neutral-700 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <p className="text-[10px] text-neutral-400 mt-1">
                  Defaults to sum of constituent items (₹{calculatedRegularSum}).
                </p>
              </div>

              {/* Computed savings pill */}
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1">
                  Calculated Savings
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-600 font-medium">Customer saves</span>
                  <span className="text-sm font-bold text-emerald-700">
                    ₹{savingsVal.toFixed(0)} ({savingsPercent}%)
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 3: Publishing Channels */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-neutral-900">Publishing Channels</h3>
              <p className="text-[11px] text-neutral-500">Select where this combo meal can be ordered</p>

              <div className="space-y-2 pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.channel_pos}
                    onChange={(e) => setFormData({ ...formData, channel_pos: e.target.checked })}
                    className="w-3.5 h-3.5 rounded text-black focus:ring-black"
                  />
                  <span className="font-semibold text-neutral-800">Point of Sale (POS Terminal)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.channel_dine_in}
                    onChange={(e) => setFormData({ ...formData, channel_dine_in: e.target.checked })}
                    className="w-3.5 h-3.5 rounded text-black focus:ring-black"
                  />
                  <span className="text-neutral-700">Dine-In QR Menu</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.channel_delivery}
                    onChange={(e) => setFormData({ ...formData, channel_delivery: e.target.checked })}
                    className="w-3.5 h-3.5 rounded text-black focus:ring-black"
                  />
                  <span className="text-neutral-700">Online Delivery Channels</span>
                </label>
              </div>
            </div>

            {/* CARD 4: Organization & Details */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-neutral-900">Meal Organization</h3>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Serving Size
                </label>
                <select
                  value={formData.serving_size}
                  onChange={(e) => setFormData({ ...formData, serving_size: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="Single Meal (1 Person)">Single Meal (1 Person)</option>
                  <option value="Feeds 1-2 Persons">Feeds 1-2 Persons</option>
                  <option value="Family Feast (3-4 Persons)">Family Feast (3-4 Persons)</option>
                  <option value="Party Platter (5+ Persons)">Party Platter (5+ Persons)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Kitchen Station
                </label>
                <input
                  type="text"
                  value={formData.kitchen_station}
                  onChange={(e) => setFormData({ ...formData, kitchen_station: e.target.value })}
                  placeholder="Main Kitchen, Tandoor, Beverage Bar"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

            </div>

          </div>

        </form>

      </div>

    </div>
  );
}
