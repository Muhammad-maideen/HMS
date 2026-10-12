import React, { useState, useEffect, useRef } from 'react';
import { 
  UtensilsCrossed,
  Edit2, 
  X, 
  UploadCloud
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function SidebarLogo({ isCollapsed = false }) {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  // Logo state loaded from localStorage or fallback
  const [logoSrc, setLogoSrc] = useState(() => {
    return localStorage.getItem('hms_restaurant_logo') || '';
  });
  const [imageError, setImageError] = useState(false);
  const [brandName, setBrandName] = useState(() => {
    return localStorage.getItem('hms_restaurant_name') || 'RestoDash';
  });

  // Sync across tabs and components
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('hms_restaurant_logo');
      if (stored) {
        setLogoSrc(stored);
        setImageError(false);
      } else {
        setLogoSrc('');
      }
      setBrandName(localStorage.getItem('hms_restaurant_name') || 'RestoDash');
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('hms_logo_updated', handleStorageChange);
    window.addEventListener('hms_receipt_settings_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('hms_logo_updated', handleStorageChange);
      window.removeEventListener('hms_receipt_settings_updated', handleStorageChange);
    };
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file (PNG, JPG, SVG, WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('Logo image must be under 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setLogoSrc(dataUrl);
      setImageError(false);
      localStorage.setItem('hms_restaurant_logo', dataUrl);
      window.dispatchEvent(new Event('hms_logo_updated'));
      addToast('Brand Logo updated successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = (e) => {
    e.stopPropagation();
    localStorage.removeItem('hms_restaurant_logo');
    setLogoSrc('');
    setImageError(false);
    window.dispatchEvent(new Event('hms_logo_updated'));
    if (fileInputRef.current) fileInputRef.current.value = '';
    addToast('Brand logo reset to default.', 'info');
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const hasValidLogo = Boolean(logoSrc) && !imageError;

  return (
    <div className="w-full flex items-center justify-center">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/svg+xml, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {isCollapsed ? (
        /* Collapsed View: Compact Brand Emblem */
        <button
          type="button"
          onClick={triggerUpload}
          className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs hover:scale-105 transition-all overflow-hidden cursor-pointer"
          title="Brand Emblem (Click to customize logo)"
        >
          {hasValidLogo ? (
            <img
              src={logoSrc}
              alt="Logo"
              onError={() => setImageError(true)}
              className="w-full h-full object-contain p-1"
            />
          ) : (
            <UtensilsCrossed className="w-4 h-4 stroke-[2.2]" />
          )}
        </button>
      ) : hasValidLogo ? (
        /* Custom Uploaded Brand Logo */
        <div 
          onClick={triggerUpload}
          className="group relative w-full h-11 px-2.5 bg-neutral-50/50 hover:bg-neutral-100/70 border border-neutral-200/60 rounded-xl cursor-pointer transition-all flex items-center justify-center overflow-hidden"
          title="Click to change brand logo"
        >
          <img
            src={logoSrc}
            alt="Brand Logo"
            onError={() => setImageError(true)}
            className="max-h-8 max-w-[150px] object-contain transition-transform group-hover:scale-102"
          />

          {/* Minimalist Hover Overlay */}
          <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-2xs opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
            <span className="text-[10px] text-white font-medium flex items-center gap-1">
              <Edit2 className="w-3 h-3 text-white" />
              <span>Change</span>
            </span>
            <button
              type="button"
              onClick={handleRemoveLogo}
              title="Reset Logo"
              className="p-1 hover:bg-white/20 text-white rounded transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        /* Elegant Brand Emblem */
        <button
          type="button"
          onClick={triggerUpload}
          className="w-full flex items-center justify-between p-1 rounded-xl hover:bg-neutral-100/70 transition-all group text-left cursor-pointer"
          title="Click to customize brand emblem"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-4 h-4 stroke-[2.2]" />
            </div>
            
            <div className="leading-tight truncate">
              <div className="text-sm font-black text-neutral-900 tracking-tight flex items-center gap-1">
                <span className="truncate">{brandName || 'RestoDash'}</span>
              </div>
              <span className="text-[11px] text-neutral-400 font-medium truncate block">
                POS System
              </span>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
