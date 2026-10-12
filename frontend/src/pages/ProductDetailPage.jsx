import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  Trash2, 
  Plus, 
  Check, 
  HelpCircle, 
  ChevronDown, 
  Eye, 
  Sparkles,
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  List, 
  ListOrdered, 
  Link2, 
  Image as ImageIcon, 
  Code,
  DollarSign,
  Layers,
  Store,
  Share2
} from 'lucide-react';
import { api, getRole } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ProductDetailPage({ 
  product = null, 
  categories = [], 
  onBack, 
  onSaved 
}) {
  const { addToast } = useToast();
  const currentRole = getRole();
  const canModify = currentRole === 'admin' || currentRole === 'manager';
  const isEdit = Boolean(product && product.id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    sku: '',
    base_price: '',
    offer_price: '',
    dine_in_price: '',
    takeaway_price: '',
    delivery_price: '',
    stock_quantity: 100,
    status: 'active', // 'active', 'draft', 'archived'
    is_active: true,
    is_available: true,
    is_featured: false,
    is_bestseller: false,
    is_new_arrival: false,
    is_todays_special: false,
    image_url: '',
    product_type: 'Main Course',
    collections: '',
    tags: [],
    theme_template: 'Default product',
    channel_pos: true,
    channel_dine_in: true,
    channel_delivery: true,
    variants: []
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState('upload'); // 'upload' or 'url'

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category_id: product.category_id || (categories[0]?.id || ''),
        sku: product.sku || '',
        base_price: product.base_price !== undefined ? product.base_price : '',
        offer_price: product.offer_price !== undefined ? product.offer_price : '',
        dine_in_price: product.dine_in_price !== undefined ? product.dine_in_price : '',
        takeaway_price: product.takeaway_price !== undefined ? product.takeaway_price : '',
        delivery_price: product.delivery_price !== undefined ? product.delivery_price : '',
        stock_quantity: product.stock_quantity ?? 100,
        status: product.is_active ? 'active' : 'draft',
        is_active: product.is_active !== undefined ? Boolean(product.is_active) : true,
        is_available: product.is_available !== undefined ? Boolean(product.is_available) : true,
        is_featured: Boolean(product.is_featured),
        is_bestseller: Boolean(product.is_bestseller),
        is_new_arrival: Boolean(product.is_new_arrival),
        is_todays_special: Boolean(product.is_todays_special),
        image_url: product.image_url || '',
        product_type: product.category?.name || 'Main Course',
        collections: product.category?.name || '',
        tags: [
          ...(product.is_featured ? ['Featured'] : []),
          ...(product.is_bestseller ? ['Bestseller'] : []),
          ...(product.is_todays_special ? ["Today's Special"] : []),
          ...(product.is_new_arrival ? ['New Arrival'] : [])
        ],
        theme_template: 'Default product',
        channel_pos: true,
        channel_dine_in: true,
        channel_delivery: true,
        variants: product.variants ? product.variants.map(v => ({ ...v })) : []
      });
      setImagePreview(product.image_url || '');
    } else {
      setFormData({
        name: '',
        description: '',
        category_id: categories[0]?.id || '',
        sku: 'AR-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        base_price: '',
        offer_price: '',
        dine_in_price: '',
        takeaway_price: '',
        delivery_price: '',
        stock_quantity: 100,
        status: 'active',
        is_active: true,
        is_available: true,
        is_featured: false,
        is_bestseller: false,
        is_new_arrival: false,
        is_todays_special: false,
        image_url: '',
        product_type: 'Main Course',
        collections: categories[0]?.name || '',
        tags: [],
        theme_template: 'Default product',
        channel_pos: true,
        channel_dine_in: true,
        channel_delivery: true,
        variants: []
      });
      setImagePreview('');
    }
    setSelectedFile(null);
  }, [product, categories]);

  // Pricing computations
  const basePriceNum = parseFloat(formData.base_price) || 0;
  const offerPriceNum = parseFloat(formData.offer_price) || 0;
  const hasOffer = offerPriceNum > 0 && offerPriceNum < basePriceNum;
  const discountAmount = hasOffer ? (basePriceNum - offerPriceNum).toFixed(2) : 0;
  const discountPercent = hasOffer ? Math.round(((basePriceNum - offerPriceNum) / basePriceNum) * 100) : 0;

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
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          variant_name: '',
          price_adjustment: 0,
          stock_quantity: 50,
          is_available: true,
          sku: `${formData.sku || 'VAR'}-${prev.variants.length + 1}`
        }
      ]
    }));
  };

  const handleVariantChange = (index, field, value) => {
    setFormData(prev => {
      const nextVariants = [...prev.variants];
      nextVariants[index] = { ...nextVariants[index], [field]: value };
      return { ...prev, variants: nextVariants };
    });
  };

  const handleRemoveVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!canModify) {
      addToast(`Role '${currentRole}' is not authorized to save products`, 'error');
      return;
    }

    if (!formData.name.trim()) {
      addToast('Please enter a product title', 'error');
      return;
    }

    if (!formData.category_id) {
      addToast('Please choose a product category', 'error');
      return;
    }

    if (!formData.base_price || parseFloat(formData.base_price) <= 0) {
      addToast('Please enter a valid base price', 'error');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        name: formData.name.trim(),
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
        is_active: formData.status === 'active',
        is_available: formData.status === 'active',
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        image_url: formData.image_url,
        variants: formData.variants.filter(v => v.variant_name && v.variant_name.trim() !== '')
      };

      let savedProduct;
      if (isEdit) {
        const res = await api.updateProduct(product.id, payload);
        savedProduct = res.data;
      } else {
        const res = await api.createProduct(payload);
        savedProduct = res.data;
      }

      // If user uploaded a physical image file
      if (selectedFile && savedProduct?.id) {
        const fd = new FormData();
        fd.append('image', selectedFile);
        fd.append('is_primary', '1');
        await api.uploadProductImage(savedProduct.id, fd);
      }

      addToast(isEdit ? 'Product updated successfully!' : 'Product created successfully!', 'success');
      if (onSaved) onSaved();
      if (onBack) onBack();
    } catch (err) {
      addToast(err.message || 'Failed to save product', 'error');
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
            title="Back to Products"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          
          <div className="flex items-center gap-2">
            <span 
              onClick={onBack} 
              className="text-xs text-neutral-500 hover:text-black cursor-pointer font-medium"
            >
              Products
            </span>
            <span className="text-neutral-400 text-xs">/</span>
            <h1 className="text-sm md:text-base font-bold text-neutral-900 truncate max-w-md">
              {isEdit ? formData.name || 'Edit product' : 'Add product'}
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
                  placeholder="Short sleeve t-shirt, Signature Mutton Biryani, etc."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-1.5">
                  Description
                </label>

                {/* Rich Editor Toolbar Mockup (matching screenshot 2) */}
                <div className="border border-neutral-300 rounded-lg overflow-hidden bg-white focus-within:ring-1 focus-within:ring-black focus-within:border-black">
                  <div className="bg-neutral-50/80 border-b border-neutral-200 px-2 py-1.5 flex flex-wrap items-center gap-1 text-neutral-600 text-xs">
                    <span className="px-2 py-1 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 rounded flex items-center gap-1">
                      Paragraph <ChevronDown className="w-3 h-3" />
                    </span>
                    <div className="h-4 w-px bg-neutral-200 mx-1"></div>
                    <button type="button" className="p-1 hover:bg-neutral-200 rounded" title="Bold"><Bold className="w-3.5 h-3.5" /></button>
                    <button type="button" className="p-1 hover:bg-neutral-200 rounded" title="Italic"><Italic className="w-3.5 h-3.5" /></button>
                    <button type="button" className="p-1 hover:bg-neutral-200 rounded" title="Underline"><Underline className="w-3.5 h-3.5" /></button>
                    <div className="h-4 w-px bg-neutral-200 mx-1"></div>
                    <button type="button" className="p-1 hover:bg-neutral-200 rounded" title="Align"><AlignLeft className="w-3.5 h-3.5" /></button>
                    <button type="button" className="p-1 hover:bg-neutral-200 rounded" title="Link"><Link2 className="w-3.5 h-3.5" /></button>
                    <button type="button" className="p-1 hover:bg-neutral-200 rounded" title="Image"><ImageIcon className="w-3.5 h-3.5" /></button>
                    <button type="button" className="p-1 hover:bg-neutral-200 rounded" title="Bullet List"><List className="w-3.5 h-3.5" /></button>
                    <button type="button" className="p-1 hover:bg-neutral-200 rounded" title="Numbered List"><ListOrdered className="w-3.5 h-3.5" /></button>
                    <button type="button" className="p-1 hover:bg-neutral-200 rounded" title="Code"><Code className="w-3.5 h-3.5" /></button>
                  </div>

                  <textarea
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe flavor notes, ingredients, dietary details, allergens and preparation method..."
                    className="w-full p-3.5 text-xs text-neutral-900 bg-transparent focus:outline-none resize-y"
                  />
                </div>
              </div>
            </div>

            {/* CARD 2: Media */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-neutral-900">
                  Media
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab('upload')}
                    className={`font-semibold ${activeMediaTab === 'upload' ? 'text-black underline' : 'text-neutral-500'}`}
                  >
                    Upload File
                  </button>
                  <span className="text-neutral-300">|</span>
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab('url')}
                    className={`font-semibold ${activeMediaTab === 'url' ? 'text-black underline' : 'text-neutral-500'}`}
                  >
                    Image URL
                  </button>
                </div>
              </div>

              {/* Media Upload Area (Dashed box matching screenshot 2) */}
              {activeMediaTab === 'upload' ? (
                <div className="border-2 border-dashed border-neutral-300 hover:border-black rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all bg-neutral-50/50 group">
                  {imagePreview ? (
                    <div className="relative group/img">
                      <img 
                        src={imagePreview} 
                        alt="Product preview" 
                        className="w-36 h-36 object-cover rounded-lg border border-neutral-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => { setImagePreview(''); setSelectedFile(null); setFormData({ ...formData, image_url: '' }); }}
                        className="absolute -top-2 -right-2 p-1.5 bg-black text-white rounded-full shadow hover:bg-neutral-800 transition-transform group-hover/img:scale-110"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-bold rounded-lg cursor-pointer transition-all border border-neutral-200">
                          Upload new
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange}
                            className="hidden" 
                          />
                        </label>
                        <span className="text-xs text-neutral-500">or drop files here</span>
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        Accepts images, videos, or 3D models (Max 5MB)
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
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
                  {imagePreview && (
                    <div className="flex items-center gap-3">
                      <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded object-cover border border-neutral-200" />
                      <span className="text-xs text-neutral-500">URL preview active</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CARD 3: Category */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-2">
              <label className="block text-xs font-bold text-neutral-900">
                Category <span className="text-red-500">*</span>
              </label>
              
              <div className="relative">
                <select
                  value={formData.category_id}
                  onChange={(e) => {
                    const catId = e.target.value;
                    const catObj = categories.find(c => String(c.id) === String(catId));
                    setFormData({ 
                      ...formData, 
                      category_id: catId,
                      collections: catObj ? catObj.name : formData.collections,
                      product_type: catObj ? catObj.name : formData.product_type
                    });
                  }}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-neutral-300 rounded-lg appearance-none focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-medium"
                  required
                >
                  <option value="" disabled>Choose a product category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-3 pointer-events-none" />
              </div>

              <p className="text-[11px] text-neutral-500 leading-snug">
                Determines tax rates and adds metafields to improve search, filters, and cross-channel sales
              </p>
            </div>

            {/* CARD 4: Pricing */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <label className="block text-xs font-bold text-neutral-900">
                  Pricing
                </label>
                {hasOffer && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Saves ₹{discountAmount} ({discountPercent}% OFF)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-700 font-semibold mb-1">
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black font-mono font-semibold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-neutral-700 font-semibold mb-1 flex items-center gap-1">
                    Compare-at price (₹)
                    <HelpCircle className="w-3 h-3 text-neutral-400" title="Promotional offer price" />
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.offer_price}
                      onChange={(e) => setFormData({ ...formData, offer_price: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Channel Breakdown */}
              <div className="pt-2 border-t border-neutral-100">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-2">
                  Channel Pricing Matrix (Optional overrides)
                </span>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1">Dine-in (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.dine_in_price}
                      onChange={(e) => setFormData({ ...formData, dine_in_price: e.target.value })}
                      placeholder={formData.base_price || "0.00"}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1">Takeaway (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.takeaway_price}
                      onChange={(e) => setFormData({ ...formData, takeaway_price: e.target.value })}
                      placeholder={formData.base_price || "0.00"}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1">Delivery (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.delivery_price}
                      onChange={(e) => setFormData({ ...formData, delivery_price: e.target.value })}
                      placeholder={formData.base_price || "0.00"}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded-md font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 5: Inventory & Variants */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-900">
                    Inventory & Portion Variants
                  </label>
                  <p className="text-[11px] text-neutral-500">
                    Track stock and offer sizes (Half, Full, Large, 500g, etc.)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-semibold rounded-md flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add variant</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-700 font-semibold mb-1">
                    SKU (Stock Keeping Unit)
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="AR-PROD-001"
                    className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-700 font-semibold mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black font-mono font-bold"
                  />
                </div>
              </div>

              {/* Variants List */}
              {formData.variants.length > 0 && (
                <div className="pt-3 border-t border-neutral-100 space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                    Configured Portions ({formData.variants.length})
                  </span>

                  <div className="space-y-2">
                    {formData.variants.map((v, index) => (
                      <div key={index} className="flex items-center gap-2 p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs">
                        <input
                          type="text"
                          placeholder="Portion (e.g. Full, Half, 1Kg)"
                          value={v.variant_name}
                          onChange={(e) => handleVariantChange(index, 'variant_name', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 bg-white border border-neutral-300 rounded text-xs"
                        />
                        <div className="w-28 relative">
                          <span className="absolute left-2 top-1.5 text-[10px] text-neutral-400">±₹</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Price adj."
                            value={v.price_adjustment}
                            onChange={(e) => handleVariantChange(index, 'price_adjustment', e.target.value)}
                            className="w-full pl-6 pr-2 py-1.5 bg-white border border-neutral-300 rounded text-xs font-mono"
                          />
                        </div>
                        <div className="w-20">
                          <input
                            type="number"
                            placeholder="Stock"
                            value={v.stock_quantity}
                            onChange={(e) => handleVariantChange(index, 'stock_quantity', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-neutral-300 rounded text-xs font-mono"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(index)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 rounded transition-colors"
                          title="Remove variant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ================= RIGHT COLUMN (~32%) ================= */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* CARD 1: Status (Matching screenshot 2) */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-3">
              <label className="block text-xs font-bold text-neutral-900">
                Status
              </label>
              
              <div className="relative">
                <select
                  value={formData.status}
                  onChange={(e) => {
                    const nextStatus = e.target.value;
                    setFormData({ 
                      ...formData, 
                      status: nextStatus,
                      is_active: nextStatus === 'active',
                      is_available: nextStatus === 'active'
                    });
                  }}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-neutral-300 rounded-lg appearance-none focus:outline-none focus:ring-1 focus:ring-black font-semibold"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
                <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* CARD 2: Publishing (Matching screenshot 2) */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-neutral-900">
                  Publishing
                </label>
                <Share2 className="w-3.5 h-3.5 text-neutral-400" />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.channel_pos}
                    onChange={(e) => setFormData({ ...formData, channel_pos: e.target.checked })}
                    className="w-4 h-4 rounded text-black focus:ring-black"
                  />
                  <span>POS Terminal & Cashier</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.channel_dine_in}
                    onChange={(e) => setFormData({ ...formData, channel_dine_in: e.target.checked })}
                    className="w-4 h-4 rounded text-black focus:ring-black"
                  />
                  <span>Dine-In Digital Menu</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.channel_delivery}
                    onChange={(e) => setFormData({ ...formData, channel_delivery: e.target.checked })}
                    className="w-4 h-4 rounded text-black focus:ring-black"
                  />
                  <span>Delivery & Takeaway</span>
                </label>
              </div>
            </div>

            {/* CARD 3: Product organization (Matching screenshot 2) */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-1.5">
                <label className="block text-xs font-bold text-neutral-900">
                  Product organization
                </label>
                <HelpCircle className="w-3 h-3 text-neutral-400" />
              </div>

              {/* Type */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Type
                </label>
                <input
                  type="text"
                  value={formData.product_type}
                  onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                  placeholder="e.g. Main Course, Appetizer"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Collections */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Collections
                </label>
                <input
                  type="text"
                  value={formData.collections}
                  onChange={(e) => setFormData({ ...formData, collections: e.target.value })}
                  placeholder="e.g. Lunch Specials, Biryani Festival"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Promotional Badges / Tags */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1.5">
                  Marketing Badges
                </label>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-black focus:ring-black"
                    />
                    <span>Featured Dish</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_bestseller}
                      onChange={(e) => setFormData({ ...formData, is_bestseller: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-black focus:ring-black"
                    />
                    <span>Bestseller</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_todays_special}
                      onChange={(e) => setFormData({ ...formData, is_todays_special: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-black focus:ring-black"
                    />
                    <span>Today's Special</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_new_arrival}
                      onChange={(e) => setFormData({ ...formData, is_new_arrival: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-black focus:ring-black"
                    />
                    <span>New Arrival</span>
                  </label>
                </div>
              </div>

              {/* Theme Template */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Theme template
                </label>
                <div className="relative">
                  <select
                    value={formData.theme_template}
                    onChange={(e) => setFormData({ ...formData, theme_template: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg appearance-none font-medium text-neutral-800"
                  >
                    <option value="Default product">Default product</option>
                    <option value="Special combo template">Special combo template</option>
                    <option value="Beverage template">Beverage template</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-2 pointer-events-none" />
                </div>
              </div>

            </div>

          </div>

        </form>

      </div>

    </div>
  );
}
