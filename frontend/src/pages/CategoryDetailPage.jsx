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
  FolderTree,
  Utensils,
  Share2,
  HelpCircle
} from 'lucide-react';
import { api, getRole } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function CategoryDetailPage({ 
  category = null, 
  onBack, 
  onSaved 
}) {
  const { addToast } = useToast();
  const currentRole = getRole();
  const canModify = currentRole === 'admin' || currentRole === 'manager';
  const isEdit = Boolean(category && category.id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    image: '',
    sort_order: 1,
    is_active: true,
    status: 'active',
    channel_pos: true,
    channel_dine_in: true,
    channel_delivery: true
  });

  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState('url'); // 'upload' or 'url'

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        slug: category.slug || '',
        image: category.image || '',
        sort_order: category.sort_order ?? 1,
        is_active: category.is_active !== undefined ? Boolean(category.is_active) : true,
        status: category.is_active ? 'active' : 'draft',
        channel_pos: true,
        channel_dine_in: true,
        channel_delivery: true
      });
      setImagePreview(category.image || '');

      // Load products belonging to this category
      fetchCategoryProducts(category.id);
    } else {
      setFormData({
        name: '',
        description: '',
        slug: '',
        image: '',
        sort_order: 1,
        is_active: true,
        status: 'active',
        channel_pos: true,
        channel_dine_in: true,
        channel_delivery: true
      });
      setImagePreview('');
      setCategoryProducts([]);
    }
    setSelectedFile(null);
  }, [category]);

  const fetchCategoryProducts = async (catId) => {
    try {
      setLoadingProducts(true);
      const res = await api.getProducts({ category_id: catId, all: '1' });
      setCategoryProducts(res.data || []);
    } catch (err) {
      console.error('Failed to load category products', err);
    } finally {
      setLoadingProducts(false);
    }
  };

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
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!canModify) {
      addToast(`Role '${currentRole}' is not authorized to modify categories`, 'error');
      return;
    }

    if (!formData.name.trim()) {
      addToast('Category name is required', 'error');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        description: formData.description,
        image: formData.image,
        sort_order: parseInt(formData.sort_order) || 1,
        is_active: formData.status === 'active'
      };

      if (isEdit) {
        await api.updateCategory(category.id, payload);
        addToast(`Category '${formData.name}' updated successfully!`, 'success');
      } else {
        await api.createCategory(payload);
        addToast(`Category '${formData.name}' created successfully!`, 'success');
      }

      if (onSaved) onSaved();
      if (onBack) onBack();
    } catch (err) {
      addToast(err.message || 'Failed to save category', 'error');
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
            title="Back to Categories"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          
          <div className="flex items-center gap-2">
            <span 
              onClick={onBack} 
              className="text-xs text-neutral-500 hover:text-black cursor-pointer font-medium"
            >
              Categories
            </span>
            <span className="text-neutral-400 text-xs">/</span>
            <h1 className="text-sm md:text-base font-bold text-neutral-900 truncate max-w-md">
              {isEdit ? formData.name || 'Edit category' : 'Add category'}
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
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    name: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                  })}
                  placeholder="Signature Biryanis, Tandoori & Starters, etc."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-1.5">
                  Description
                </label>

                {/* Rich Editor Toolbar */}
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
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe culinary notes, cuisine heritage, or dietary focus of this category section..."
                    className="w-full p-3.5 text-xs text-neutral-900 bg-transparent focus:outline-none resize-y"
                  />
                </div>
              </div>
            </div>

            {/* CARD 2: Media / Cover Image */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-neutral-900">
                  Category Image
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab('url')}
                    className={`font-semibold ${activeMediaTab === 'url' ? 'text-black underline' : 'text-neutral-500'}`}
                  >
                    Image URL
                  </button>
                  <span className="text-neutral-300">|</span>
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab('upload')}
                    className={`font-semibold ${activeMediaTab === 'upload' ? 'text-black underline' : 'text-neutral-500'}`}
                  >
                    Upload File
                  </button>
                </div>
              </div>

              {activeMediaTab === 'url' ? (
                <div className="space-y-3">
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => {
                      setFormData({ ...formData, image: e.target.value });
                      setImagePreview(e.target.value);
                    }}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3.5 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  {imagePreview && (
                    <div className="relative inline-block group">
                      <img src={imagePreview} alt="Preview" className="w-32 h-24 rounded-lg object-cover border border-neutral-200" />
                      <button
                        type="button"
                        onClick={() => { setImagePreview(''); setFormData({ ...formData, image: '' }); }}
                        className="absolute -top-2 -right-2 p-1 bg-black text-white rounded-full shadow hover:bg-neutral-800"
                        title="Remove image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-neutral-300 hover:border-black rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all bg-neutral-50/50">
                  {imagePreview ? (
                    <div className="relative inline-block group">
                      <img src={imagePreview} alt="Preview" className="w-32 h-24 rounded-lg object-cover border border-neutral-200" />
                      <button
                        type="button"
                        onClick={() => { setImagePreview(''); setSelectedFile(null); setFormData({ ...formData, image: '' }); }}
                        className="absolute -top-2 -right-2 p-1 bg-black text-white rounded-full shadow hover:bg-neutral-800"
                      >
                        <Trash2 className="w-3 h-3" />
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
                        Recommended size 1200x600 (Max 5MB)
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* CARD 3: Products in this Category */}
            {isEdit && (
              <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-neutral-800" />
                    <h3 className="text-xs font-bold text-neutral-900">
                      Dishes in this Category ({categoryProducts.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-neutral-500">
                    Live Menu Items
                  </span>
                </div>

                {loadingProducts ? (
                  <div className="py-6 text-center text-xs text-neutral-400">Loading dishes...</div>
                ) : categoryProducts.length === 0 ? (
                  <div className="py-6 text-center text-xs text-neutral-400">
                    No dishes assigned to this category yet.
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {categoryProducts.map((p) => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=100'}
                            alt={p.name}
                            className="w-9 h-9 rounded-lg object-cover border border-neutral-200"
                          />
                          <div>
                            <span className="font-semibold text-neutral-900 block leading-tight">{p.name}</span>
                            <span className="text-[11px] font-mono text-neutral-400">{p.sku}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-neutral-900">₹{p.offer_price || p.base_price}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.is_available && p.stock_quantity > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                          }`}>
                            {p.is_available && p.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* ================= RIGHT COLUMN (~32%) ================= */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* CARD 1: Status */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-3">
              <label className="block text-xs font-bold text-neutral-900">
                Status
              </label>
              
              <div className="relative">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    status: e.target.value,
                    is_active: e.target.value === 'active'
                  })}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-neutral-300 rounded-lg appearance-none focus:outline-none focus:ring-1 focus:ring-black font-semibold"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                </select>
                <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* CARD 2: Publishing */}
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

            {/* CARD 3: Category Organization */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-1.5">
                <label className="block text-xs font-bold text-neutral-900">
                  Category organization
                </label>
                <HelpCircle className="w-3 h-3 text-neutral-400" />
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Menu Display Order
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black font-mono font-bold"
                />
                <span className="text-[10px] text-neutral-400 mt-0.5 block">
                  Determines position in POS category bar
                </span>
              </div>

              {/* Slug / Handle */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  URL Handle / Slug
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1.5 text-xs text-neutral-400 font-mono">/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="signature-biryanis"
                    className="w-full pl-6 pr-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black font-mono text-neutral-600"
                  />
                </div>
              </div>

            </div>

          </div>

        </form>

      </div>

    </div>
  );
}
