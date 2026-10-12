import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Check, 
  Edit2, 
  HelpCircle,
  FolderOpen
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function TopRightLogo({ className = '' }) {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  // Logo state loaded from localStorage or fallback
  const [logoSrc, setLogoSrc] = useState(() => {
    return localStorage.getItem('hms_restaurant_logo') || '';
  });
  const [imageError, setImageError] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Sync logo across components and tabs
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('hms_restaurant_logo');
      if (stored) {
        setLogoSrc(stored);
        setImageError(false);
      } else {
        setLogoSrc('');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('hms_logo_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('hms_logo_updated', handleStorageChange);
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
      addToast('Logo image file must be under 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setLogoSrc(dataUrl);
      setImageError(false);
      localStorage.setItem('hms_restaurant_logo', dataUrl);
      window.dispatchEvent(new Event('hms_logo_updated'));
      addToast(`Logo loaded from local file '${file.name}' successfully!`, 'success');
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
    addToast('Logo removed. Reset to placeholder.', 'info');
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const hasValidLogo = Boolean(logoSrc) && !imageError;

  return (
    <div className={`relative inline-flex items-center shrink-0 ${className}`}>
      {/* Hidden file input to pick files directly from local computer */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/svg+xml, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {hasValidLogo ? (
        /* Rendered Logo with Hover Actions */
        <div 
          onClick={triggerUpload}
          className="group relative flex items-center justify-center h-9 px-2.5 bg-white border border-neutral-200/90 rounded-lg shadow-2xs hover:border-black cursor-pointer transition-all max-w-[160px]"
          title="Click to replace logo with another local file"
        >
          <img
            src={logoSrc}
            alt="Restaurant Logo"
            onError={() => setImageError(true)}
            className="h-7 max-w-[120px] object-contain transition-transform group-hover:scale-102"
          />

          {/* Hover Overlay with Change / Remove */}
          <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity px-1">
            <span className="text-[10px] text-white font-semibold flex items-center gap-1">
              <Edit2 className="w-3 h-3 text-white" />
              <span>Change</span>
            </span>
            <button
              type="button"
              onClick={handleRemoveLogo}
              title="Remove Logo"
              className="p-1 hover:bg-neutral-800 text-white rounded transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        /* Minimalist Logo Placeholder */
        <button
          type="button"
          onClick={triggerUpload}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="group flex items-center gap-2 h-9 px-3 bg-white hover:bg-neutral-50 border border-dashed border-neutral-300 hover:border-black rounded-lg shadow-2xs transition-all text-neutral-600 hover:text-black"
          title="Click to select logo from local files"
        >
          <div className="w-5 h-5 rounded-md bg-neutral-100 group-hover:bg-black group-hover:text-white flex items-center justify-center transition-colors text-neutral-500">
            <FolderOpen className="w-3 h-3" />
          </div>
          
          <div className="text-left flex flex-col justify-center leading-none">
            <span className="text-[11px] font-bold text-neutral-900 tracking-tight flex items-center gap-1">
              <span>Logo Placeholder</span>
              <span className="text-[9px] font-medium text-neutral-400 font-mono">(Local)</span>
            </span>
            <span className="text-[9px] text-neutral-400 group-hover:text-neutral-600">
              Click to add file
            </span>
          </div>
        </button>
      )}

      {/* Floating Info Tooltip on Hover */}
      {showTooltip && !hasValidLogo && (
        <div className="absolute right-0 top-11 z-50 w-56 p-2.5 bg-neutral-900 text-white text-[11px] rounded-lg shadow-xl border border-neutral-800 animate-fadeIn pointer-events-none">
          <p className="font-semibold text-neutral-200 mb-0.5">Upload Local Logo</p>
          <p className="text-neutral-400 text-[10px] leading-tight">
            Click this placeholder to pick an image from your computer (PNG, JPG, SVG).
          </p>
        </div>
      )}
    </div>
  );
}
