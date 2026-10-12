import React, { useState, useEffect } from 'react';
import { Images, Upload, Star, Trash2, Eye } from 'lucide-react';
import { api, getRole } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ImagesGalleryPage({ products = [] }) {
  const { addToast } = useToast();
  const currentRole = getRole();
  const canModify = currentRole === 'admin' || currentRole === 'manager';

  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const selectedProduct = products.find(p => p.id === parseInt(selectedProductId));

  const fetchImages = async (productId) => {
    if (!productId) return;
    try {
      setLoading(true);
      const res = await api.getProductImages(productId);
      setImages(res.data || []);
    } catch (err) {
      addToast(err.message || 'Failed to load product images', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProductId) {
      fetchImages(selectedProductId);
    } else if (products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [selectedProductId, products]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast('Image size cannot exceed 5MB', 'error');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      formData.append('is_primary', images.length === 0 ? '1' : '0');

      await api.uploadProductImage(selectedProductId, formData);
      addToast('Image uploaded and processed successfully!', 'success');
      fetchImages(selectedProductId);
    } catch (err) {
      addToast(err.message || 'Failed to upload image', 'error');
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const handleSetPrimary = async (imageId) => {
    if (!canModify) {
      addToast(`Role '${currentRole}' is not allowed to modify images`, 'error');
      return;
    }
    try {
      await api.setPrimaryImage(selectedProductId, imageId);
      addToast('Primary product image updated', 'success');
      fetchImages(selectedProductId);
    } catch (err) {
      addToast(err.message || 'Failed to set primary image', 'error');
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!canModify) {
      addToast(`Role '${currentRole}' is not allowed to delete images`, 'error');
      return;
    }
    try {
      await api.deleteProductImage(selectedProductId, imageId);
      addToast('Image deleted from storage', 'success');
      fetchImages(selectedProductId);
    } catch (err) {
      addToast(err.message || 'Failed to delete image', 'error');
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Images className="w-5 h-5 text-neutral-900" />
            Product Images & Media Gallery
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Upload high-resolution photography, manage multiple product angles, and set primary cover images.
          </p>
        </div>

        {/* Product selector dropdown */}
        <div className="flex items-center gap-2.5">
          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden sm:block">
            Dish:
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-neutral-900 text-xs font-medium focus:outline-none focus:border-black"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Product Context Banner */}
      {selectedProduct && (
        <div className="p-4 bg-white border border-neutral-200 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
              <img
                src={selectedProduct.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200'}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">{selectedProduct.name}</h3>
              <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                <span>SKU: {selectedProduct.sku}</span>
                <span>•</span>
                <span className="text-neutral-900 font-semibold font-mono">₹{selectedProduct.base_price}</span>
              </div>
            </div>
          </div>

          {canModify && (
            <div>
              <label className="cursor-pointer px-3.5 py-2 bg-black hover:bg-neutral-800 text-white font-medium text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all">
                <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{uploading ? 'Processing Image...' : 'Upload Image from Computer'}</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      )}

      {/* Gallery Grid */}
      {loading ? (
        <div className="p-16 text-center space-y-3">
          <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-neutral-500 font-medium">Loading gallery images...</p>
        </div>
      ) : images.length === 0 ? (
        <div className="p-16 text-center bg-white border border-dashed border-neutral-300 rounded-2xl space-y-2">
          <Images className="w-10 h-10 text-neutral-400 mx-auto" />
          <p className="text-sm font-semibold text-neutral-800">No gallery images uploaded for this dish.</p>
          <p className="text-xs text-neutral-500">Use the upload button above to add product photos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className={`bg-white border rounded-xl overflow-hidden flex flex-col group shadow-sm transition-all ${
                img.is_primary ? 'border-black ring-1 ring-black' : 'border-neutral-200 hover:border-neutral-400'
              }`}
            >
              <div className="relative h-44 bg-neutral-100 overflow-hidden">
                <img
                  src={img.image_path}
                  alt={img.original_name || 'Dish Photo'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Primary Badge */}
                {img.is_primary && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black text-white text-[10px] font-semibold shadow-sm flex items-center gap-1">
                    <Star className="w-3 h-3 fill-white" />
                    PRIMARY COVER
                  </div>
                )}

                {/* File size badge */}
                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono">
                  {img.file_size_kb ? `${img.file_size_kb} KB` : 'Optimized'}
                </div>

                {/* Quick actions overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => setPreviewImage(img.image_path)}
                    className="p-1.5 bg-white text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all shadow-sm"
                    title="Enlarge"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {canModify && !img.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(img.id)}
                      className="p-1.5 bg-black text-white hover:bg-neutral-800 rounded-lg transition-all shadow-sm font-bold"
                      title="Set as Primary"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  {canModify && (
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      className="p-1.5 bg-white text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all shadow-sm"
                      title="Delete Image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 flex items-center justify-between text-xs bg-white">
                <span className="text-neutral-500 truncate max-w-[140px]">
                  {img.original_name || 'photo.jpg'}
                </span>
                {img.is_primary ? (
                  <span className="text-neutral-900 font-bold text-[10px]">Active</span>
                ) : (
                  canModify && (
                    <button
                      onClick={() => handleSetPrimary(img.id)}
                      className="text-neutral-500 hover:text-black text-[10px] font-semibold"
                    >
                      Set Primary
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl max-h-[85vh] rounded-xl overflow-hidden shadow-2xl border border-neutral-200 bg-white cursor-default"
          >
            <img src={previewImage} alt="Large preview" className="w-full h-full object-contain" />
          </div>
        </div>
      )}

    </div>
  );
}
