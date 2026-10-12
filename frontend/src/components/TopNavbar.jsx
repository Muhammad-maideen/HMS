import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  ChevronDown, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  ShoppingBag, 
  ChefHat,
  X,
  Pencil,
  Camera
} from 'lucide-react';
import { getRole, setRole } from '../services/api';
import { useToast } from '../context/ToastContext';
import EditProfileModal, { 
  DEFAULT_PROFILE_AVATAR, 
  DEFAULT_PROFILE_NAME, 
  DEFAULT_PROFILE_EMAIL 
} from './EditProfileModal';

export default function TopNavbar({ 
  onToggleSidebar, 
  isSidebarCollapsed, 
  onLogout,
  onGlobalSearch,
  activePage = 'pos'
}) {
  const { addToast } = useToast();
  const searchInputRef = useRef(null);

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Live formatted date and time: e.g. "May 20, 2025 10:30 AM"
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const optionsDate = { month: 'short', day: 'numeric', year: 'numeric' };
      const optionsTime = { hour: 'numeric', minute: '2-digit', hour12: true };
      const datePart = now.toLocaleDateString('en-US', optionsDate);
      const timePart = now.toLocaleTimeString('en-US', optionsTime);
      setCurrentDateTime(`${datePart} • ${timePart}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 30000); // update every 30s
    return () => clearInterval(interval);
  }, []);

  // Global Keyboard shortcut: Ctrl + K or / to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Notifications dropdown
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Table 05 order confirmed', time: '5m ago', unread: true },
    { id: 2, title: 'Kitchen ticket #104 ready', time: '12m ago', unread: true },
    { id: 3, title: 'Daily shift register opened', time: '1h ago', unread: false },
  ]);

  // Profile / Role state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const quickFileInputRef = useRef(null);
  const [currentRole, setCurrentRoleState] = useState(getRole());

  const [userAvatar, setUserAvatar] = useState(() => {
    return localStorage.getItem('hms_user_avatar') || DEFAULT_PROFILE_AVATAR;
  });
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('hms_user_name') || DEFAULT_PROFILE_NAME;
  });
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem('hms_user_email') || DEFAULT_PROFILE_EMAIL;
  });

  // Sync profile state on events
  useEffect(() => {
    const handleProfileSync = () => {
      setUserAvatar(localStorage.getItem('hms_user_avatar') || DEFAULT_PROFILE_AVATAR);
      setUserName(localStorage.getItem('hms_user_name') || DEFAULT_PROFILE_NAME);
      setUserEmail(localStorage.getItem('hms_user_email') || DEFAULT_PROFILE_EMAIL);
    };
    window.addEventListener('storage', handleProfileSync);
    window.addEventListener('hms_profile_updated', handleProfileSync);
    return () => {
      window.removeEventListener('storage', handleProfileSync);
      window.removeEventListener('hms_profile_updated', handleProfileSync);
    };
  }, []);

  const handleQuickImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('Image size should be less than 5MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      if (typeof dataUrl === 'string') {
        localStorage.setItem('hms_user_avatar', dataUrl);
        setUserAvatar(dataUrl);
        window.dispatchEvent(new Event('hms_profile_updated'));
        window.dispatchEvent(new Event('storage'));
        addToast('Profile image updated successfully!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0a0a0c]/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 px-4 lg:px-6 py-2.5 transition-all select-none">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Sidebar Toggle + Global Search Bar */}
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          {/* Hamburger Sidebar Toggle */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer shrink-0"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Bar matching RestoDash */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500">
              <Search className="w-4 h-4" />
            </div>
            
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (onGlobalSearch) onGlobalSearch(e.target.value);
              }}
              placeholder="Search product, order, customer..."
              className="w-full pl-10 pr-20 py-2 bg-neutral-50/80 dark:bg-neutral-900/80 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 focus:bg-white dark:focus:bg-[#121214] text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 rounded-xl border border-neutral-200/80 dark:border-neutral-800 focus:border-neutral-900 dark:focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/5 transition-all"
            />

            {/* Ctrl + K Shortcut Badge */}
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[10px] font-mono font-medium text-neutral-400 dark:text-neutral-400 shadow-2xs">
                Ctrl + K
              </kbd>
            </div>

            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  if (onGlobalSearch) onGlobalSearch('');
                }}
                className="absolute right-14 top-2 text-neutral-400 hover:text-black dark:hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Tools: Notification Bell, Live Date/Time, User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotifOpen(prev => !prev)}
              className="relative p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-neutral-900 dark:bg-white text-white dark:text-black text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Modal */}
            {isNotifOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#121214] rounded-2xl shadow-xl border border-neutral-200/90 dark:border-neutral-800 py-2 z-50 animate-fadeIn text-neutral-900 dark:text-neutral-100">
                <div className="px-3.5 py-2 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">Notifications</span>
                  <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">{unreadCount} unread</span>
                </div>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-60 overflow-y-auto">
                  {notifications.map(n => (
                    <div 
                      key={n.id}
                      onClick={() => {
                        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, unread: false } : item));
                      }}
                      className={`px-3.5 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 cursor-pointer flex items-start gap-2.5 transition-colors ${n.unread ? 'bg-neutral-50/50 dark:bg-neutral-800/30' : ''}`}
                    >
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.unread ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate">{n.title}</p>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-3 py-1.5 border-t border-neutral-100 dark:border-neutral-800 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setNotifications(prev => prev.map(item => ({ ...item, unread: false })));
                      setIsNotifOpen(false);
                    }}
                    className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    Mark all as read
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Date & Time Pill (RestoDash style) */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-50/80 dark:bg-neutral-900/80 border border-neutral-200/60 dark:border-neutral-800/60 text-neutral-700 dark:text-neutral-300">
            <Clock className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
            <span className="text-xs font-medium tracking-tight font-sans text-neutral-700 dark:text-neutral-300">
              {currentDateTime || 'Loading...'}
            </span>
          </div>

          {/* User Profile Pill / Dropdown (Matching "MD Atikur Rhaman Administrator") */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(prev => !prev)}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-xl hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 border border-transparent hover:border-neutral-200/80 dark:hover:border-neutral-800 transition-all cursor-pointer"
            >
              {/* Profile Avatar Thumbnail */}
              <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden shrink-0 border border-neutral-200 dark:border-neutral-700">
                <img
                  src={userAvatar}
                  alt={userName}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  className="w-full h-full object-cover"
                />
                <span className="uppercase text-[11px]">
                  {userName.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AR'}
                </span>
              </div>

              {/* Name & Role Text */}
              <div className="hidden lg:block text-left leading-tight">
                <div className="text-xs font-bold text-neutral-900 dark:text-white tracking-tight">
                  {userName}
                </div>
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium capitalize">
                  {currentRole === 'admin' ? 'Administrator' : currentRole}
                </div>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0 transition-transform" />
            </button>

            {/* Profile Menu Dropdown: Edit and Sign Out Only */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#121214] rounded-2xl shadow-xl border border-neutral-200/90 dark:border-neutral-800 py-2 z-50 animate-fadeIn text-neutral-900 dark:text-white">
                {/* User Header with Avatar & Side Edit Tool */}
                <div className="px-3.5 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                  <div className="relative shrink-0 group">
                    <div 
                      onClick={() => quickFileInputRef.current?.click()}
                      className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden cursor-pointer border border-neutral-200 dark:border-neutral-700"
                      title="Click to change profile picture"
                    >
                      <img
                        src={userAvatar}
                        alt={userName}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        className="w-full h-full object-cover"
                      />
                      <span className="uppercase text-[11px]">
                        {userName.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AR'}
                      </span>
                    </div>

                    {/* Camera / Edit Tool Icon on the side of avatar */}
                    <button
                      type="button"
                      onClick={() => quickFileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-1 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-neutral-200 shadow-xs border border-white dark:border-neutral-900 cursor-pointer transition-transform hover:scale-110"
                      title="Change Profile Photo"
                    >
                      <Camera className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{userName}</p>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">{userEmail}</p>
                  </div>
                </div>

                {/* Dropdown Options: ONLY Edit Profile and Sign Out */}
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsEditProfileOpen(true);
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/70 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                    <span>Edit Profile</span>
                  </button>
                </div>

                {onLogout && (
                  <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onLogout();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hidden file input for quick direct avatar change */}
          <input
            ref={quickFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleQuickImageUpload}
          />

          {/* Edit Profile Modal */}
          <EditProfileModal
            isOpen={isEditProfileOpen}
            onClose={() => setIsEditProfileOpen(false)}
          />

        </div>

      </div>
    </header>
  );
}
