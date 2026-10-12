import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Upload, Trash2, Check, User, Mail, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const DEFAULT_PROFILE_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80';
export const DEFAULT_PROFILE_NAME = 'MD Atikur Rhaman';
export const DEFAULT_PROFILE_EMAIL = 'admin@restodash.com';

export default function EditProfileModal({ isOpen, onClose }) {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [avatar, setAvatar] = useState(DEFAULT_PROFILE_AVATAR);
  const [name, setName] = useState(DEFAULT_PROFILE_NAME);
  const [email, setEmail] = useState(DEFAULT_PROFILE_EMAIL);
  const [imageError, setImageError] = useState(false);

  // Load latest profile values on open
  useEffect(() => {
    if (isOpen) {
      const storedAvatar = localStorage.getItem('hms_user_avatar') || DEFAULT_PROFILE_AVATAR;
      const storedName = localStorage.getItem('hms_user_name') || DEFAULT_PROFILE_NAME;
      const storedEmail = localStorage.getItem('hms_user_email') || DEFAULT_PROFILE_EMAIL;
      setAvatar(storedAvatar);
      setName(storedName);
      setEmail(storedEmail);
      setImageError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle local image file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast?.('Please choose a valid image file (PNG, JPG, WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast?.('Image size should be less than 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        setAvatar(dataUrl);
        setImageError(false);
        addToast?.('Image loaded! Click "Save Changes" to apply.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetAvatar = () => {
    setAvatar(DEFAULT_PROFILE_AVATAR);
    setImageError(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    addToast?.('Profile photo reset to default', 'info');
  };

  const handleSave = () => {
    const cleanName = name.trim() || DEFAULT_PROFILE_NAME;
    const cleanEmail = email.trim() || DEFAULT_PROFILE_EMAIL;
    const cleanAvatar = avatar || DEFAULT_PROFILE_AVATAR;

    localStorage.setItem('hms_user_avatar', cleanAvatar);
    localStorage.setItem('hms_user_name', cleanName);
    localStorage.setItem('hms_user_email', cleanEmail);

    // Notify all components in real-time
    window.dispatchEvent(new Event('hms_profile_updated'));
    window.dispatchEvent(new Event('storage'));

    addToast?.('Profile updated successfully!', 'success');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#121214] rounded-3xl shadow-2xl border border-neutral-200/90 dark:border-neutral-800 max-w-md w-full overflow-hidden text-neutral-900 dark:text-neutral-100 animate-scaleUp relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">Edit Profile</h3>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500">Change your photo, display name, and details</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative group">
              {/* Circular Avatar */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-full overflow-hidden border-3 border-neutral-100 dark:border-neutral-700 shadow-md bg-neutral-900 flex items-center justify-center cursor-pointer transition-transform hover:scale-102"
                title="Click to choose a new photo"
              >
                {!imageError && avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xl font-bold uppercase">
                    {name.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AR'}
                  </span>
                )}

                {/* Hover overlay hint */}
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[11px] font-semibold gap-1">
                  <Camera className="w-4 h-4" />
                  <span>Change</span>
                </div>
              </div>

              {/* Edit Camera Tool Badge */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-neutral-200 shadow-md border-2 border-white dark:border-neutral-900 transition-all hover:scale-110 cursor-pointer"
                title="Upload Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Photo Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Image</span>
              </button>

              {avatar !== DEFAULT_PROFILE_AVATAR && (
                <button
                  type="button"
                  onClick={handleResetAvatar}
                  className="px-2.5 py-1.5 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reset to default image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">JPG, PNG, WebP or SVG under 5MB</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5">
            {/* Display Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. MD Atikur Rhaman"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-all bg-neutral-50/50 dark:bg-neutral-900"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@restodash.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-all bg-neutral-50/50 dark:bg-neutral-900"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50/80 dark:bg-neutral-900/60 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
}
