import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard,
  LayoutGrid,
  ShoppingBag, 
  Utensils, 
  FolderTree, 
  Layers, 
  ReceiptText, 
  ChevronDown, 
  LogOut, 
  Sparkles,
  Calendar,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  Zap,
  Grid3X3,
  Keyboard,
  Sun,
  Moon,
  Check,
  QrCode,
  Pencil,
  Camera,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import SidebarLogo from './SidebarLogo';
import EditProfileModal, { 
  DEFAULT_PROFILE_AVATAR, 
  DEFAULT_PROFILE_NAME 
} from './EditProfileModal';

export default function Sidebar({ 
  activePage, 
  setActivePage, 
  onOpenNewProduct,
  productsCount = 0,
  categoriesCount = 0,
  onLogout,
  isCollapsed = false,
  setIsCollapsed,
  onOpenKeyboardGuide,
  onOpenShiftReport
}) {
  const { theme, setTheme, toggleTheme, isDark } = useTheme();

  // Profile state
  const [userAvatar, setUserAvatar] = useState(() => {
    return localStorage.getItem('hms_user_avatar') || DEFAULT_PROFILE_AVATAR;
  });
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('hms_user_name') || DEFAULT_PROFILE_NAME;
  });
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  useEffect(() => {
    const handleProfileSync = () => {
      setUserAvatar(localStorage.getItem('hms_user_avatar') || DEFAULT_PROFILE_AVATAR);
      setUserName(localStorage.getItem('hms_user_name') || DEFAULT_PROFILE_NAME);
    };
    window.addEventListener('storage', handleProfileSync);
    window.addEventListener('hms_profile_updated', handleProfileSync);
    return () => {
      window.removeEventListener('storage', handleProfileSync);
      window.removeEventListener('hms_profile_updated', handleProfileSync);
    };
  }, []);

  // Check if current active page is one of the Products sub-modules
  const isProductSectionActive = activePage === 'products' || activePage === 'categories' || activePage === 'combos';
  
  // All dropdown menus default to closed (false)
  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);

  const isSettingsActive = activePage === 'logos';

  const handleSelectPage = (page) => {
    setActivePage(page);
    // Keep dropdown menus closed when viewing main top-level tabs
    setIsProductsDropdownOpen(false);
    setIsSettingsDropdownOpen(false);
  };

  const handleSelectProductSub = (pageId) => {
    setActivePage(pageId);
    setIsProductsDropdownOpen(true);
  };

  const handleProductsClick = () => {
    if (isCollapsed) {
      if (setIsCollapsed) setIsCollapsed(false);
      setIsProductsDropdownOpen(true);
      setIsSettingsDropdownOpen(false);
      setActivePage('products');
      return;
    }

    if (!isProductsDropdownOpen) {
      // Opening dropdown menu on click
      setIsProductsDropdownOpen(true);
      setIsSettingsDropdownOpen(false);
      if (!isProductSectionActive) {
        setActivePage('products');
      }
    } else {
      // Toggle closed on click
      setIsProductsDropdownOpen(false);
    }
  };

  const handleSettingsClick = () => {
    if (isCollapsed) {
      if (setIsCollapsed) setIsCollapsed(false);
      setIsSettingsDropdownOpen(true);
      setIsProductsDropdownOpen(false);
      return;
    }

    setIsSettingsDropdownOpen(prev => {
      const willOpen = !prev;
      if (willOpen) {
        setIsProductsDropdownOpen(false);
      }
      return willOpen;
    });
  };

  return (
    <aside 
      className={`${
        isCollapsed ? 'w-[72px]' : 'w-52'
      } bg-white border-r border-neutral-200/80 flex flex-col shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out select-none z-40`}
    >
      
      {/* Top Header: Brand Emblem (RestoDash / AL RIZQ) */}
      <div className={`p-3 border-b border-neutral-100 flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
        <div className={isCollapsed ? 'w-full flex justify-center' : 'flex-1 min-w-0 overflow-hidden'}>
          <SidebarLogo isCollapsed={isCollapsed} />
        </div>
      </div>

      {/* Navigation Menu (Matching RestoDash: Overview, POS, Orders, Menu, Logos, Shift Report) */}
      <nav className="p-2.5 space-y-1 flex-1 overflow-y-auto overflow-x-hidden">
        
        {/* 1. Overview Dashboard */}
        <button
          type="button"
          onClick={() => setActivePage('dashboard')}
          title="Executive Overview"
          className={`group flex items-center transition-all cursor-pointer ${
            isCollapsed 
              ? 'w-11 h-11 p-0 mx-auto justify-center rounded-xl' 
              : 'w-full px-2.5 py-2 rounded-xl justify-between text-xs font-medium'
          } ${
            activePage === 'dashboard'
              ? 'bg-neutral-900 text-white shadow-xs font-semibold'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
          }`}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
            <LayoutDashboard className={`w-4 h-4 shrink-0 transition-colors ${
              activePage === 'dashboard' ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-900'
            }`} />
            {!isCollapsed && <span className="truncate">Overview</span>}
          </div>
        </button>

        {/* 2. POS Terminal */}
        <button
          type="button"
          onClick={() => setActivePage('pos')}
          title="POS Terminal"
          className={`group flex items-center transition-all cursor-pointer ${
            isCollapsed 
              ? 'w-11 h-11 p-0 mx-auto justify-center rounded-xl' 
              : 'w-full px-2.5 py-2 rounded-xl justify-between text-xs font-medium'
          } ${
            activePage === 'pos'
              ? 'bg-neutral-900 text-white shadow-xs font-semibold'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
          }`}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
            <ShoppingBag className={`w-4 h-4 shrink-0 transition-colors ${
              activePage === 'pos' ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-900'
            }`} />
            {!isCollapsed && <span className="truncate">POS Terminal</span>}
          </div>
          
          {!isCollapsed && (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-tight transition-colors shrink-0 ${
              activePage === 'pos' 
                ? 'bg-neutral-800 text-emerald-300' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}
        </button>

        {/* 2. Restaurant Tables */}
        <button
          type="button"
          onClick={() => setActivePage('tables')}
          title="Restaurant Tables"
          className={`group flex items-center transition-all cursor-pointer ${
            isCollapsed 
              ? 'w-11 h-11 p-0 mx-auto justify-center rounded-xl' 
              : 'w-full px-2.5 py-2 rounded-xl justify-between text-xs font-medium'
          } ${
            activePage === 'tables'
              ? 'bg-neutral-900 text-white shadow-xs font-semibold'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
          }`}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
            <LayoutGrid className={`w-4 h-4 shrink-0 transition-colors ${
              activePage === 'tables' ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-900'
            }`} />
            {!isCollapsed && <span className="truncate">Tables</span>}
          </div>
        </button>

        {/* 3. Orders (Bill History) */}
        <button
          type="button"
          onClick={() => setActivePage('orders')}
          title="Orders History"
          className={`group flex items-center transition-all cursor-pointer ${
            isCollapsed 
              ? 'w-11 h-11 p-0 mx-auto justify-center rounded-xl' 
              : 'w-full px-2.5 py-2 rounded-xl justify-between text-xs font-medium'
          } ${
            activePage === 'orders'
              ? 'bg-neutral-900 text-white shadow-xs font-semibold'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800'
          }`}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
            <ReceiptText className={`w-4 h-4 shrink-0 transition-colors ${
              activePage === 'orders' ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-900'
            }`} />
            {!isCollapsed && <span className="truncate">Orders & Bills</span>}
          </div>
        </button>

        {/* 3. Menu / Products Accordion */}
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={handleProductsClick}
            title="Menu Catalog"
            className={`group flex items-center transition-all cursor-pointer ${
              isCollapsed 
                ? 'w-11 h-11 p-0 mx-auto justify-center rounded-xl' 
                : 'w-full px-2.5 py-2 rounded-xl justify-between text-xs font-medium'
            } ${
              isProductSectionActive && (!isProductsDropdownOpen || isCollapsed)
                ? 'bg-neutral-900 text-white shadow-xs font-semibold'
                : isProductSectionActive
                ? 'bg-neutral-100 text-neutral-900 font-bold'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
            }`}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
              <Utensils className={`w-4 h-4 shrink-0 transition-colors ${
                isProductSectionActive 
                  ? (isProductsDropdownOpen && !isCollapsed ? 'text-neutral-900' : 'text-white') 
                  : 'text-neutral-500 group-hover:text-neutral-900'
              }`} />
              {!isCollapsed && <span className="truncate">Menu & Items</span>}
            </div>

            {!isCollapsed && (
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                  isProductsDropdownOpen ? 'rotate-180 text-neutral-800' : 'text-neutral-400'
                }`}
              />
            )}
          </button>

          {/* Nested Sub-routes for Menu */}
          {!isCollapsed && isProductsDropdownOpen && (
            <div className="ml-3 pl-2 border-l border-neutral-200/90 space-y-0.5 py-1 animate-fadeIn">
              
              {/* Items Catalog */}
              <button
                type="button"
                onClick={() => handleSelectProductSub('products')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  activePage === 'products'
                    ? 'bg-neutral-900 text-white font-medium shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/70 font-normal'
                }`}
              >
                <span>Items Catalog</span>
                {productsCount > 0 && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    activePage === 'products' ? 'bg-neutral-800 text-neutral-200' : 'text-neutral-400'
                  }`}>
                    {productsCount}
                  </span>
                )}
              </button>

              {/* Categories */}
              <button
                type="button"
                onClick={() => handleSelectProductSub('categories')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  activePage === 'categories'
                    ? 'bg-neutral-900 text-white font-medium shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/70 font-normal'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FolderTree className="w-3.5 h-3.5 opacity-60" />
                  <span>Categories</span>
                </div>
                {categoriesCount > 0 && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    activePage === 'categories' ? 'bg-neutral-800 text-neutral-200' : 'text-neutral-400'
                  }`}>
                    {categoriesCount}
                  </span>
                )}
              </button>

              {/* Combos */}
              <button
                type="button"
                onClick={() => handleSelectProductSub('combos')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  activePage === 'combos'
                    ? 'bg-neutral-900 text-white font-medium shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/70 font-normal'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 opacity-60" />
                  <span>Combo Deals</span>
                </div>
              </button>

            </div>
          )}
        </div>

        {/* 4. Settings Accordion (Collapsible with 3 sub-menus: Logo & Branding, Shift Z-Report, Theme) */}
        {isCollapsed ? (
          /* Collapsed View: Settings Icon */
          <button
            type="button"
            onClick={handleSettingsClick}
            title="Settings (Logo, Z-Report, Theme)"
            className={`group flex items-center transition-all cursor-pointer w-11 h-11 p-0 mx-auto justify-center rounded-xl ${
              isSettingsActive
                ? 'bg-neutral-900 text-white shadow-xs font-semibold dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800'
            }`}
          >
            <Settings className={`w-4 h-4 shrink-0 transition-colors ${
              isSettingsActive 
                ? 'text-white dark:text-neutral-900' 
                : 'text-neutral-500 group-hover:text-neutral-900 dark:text-neutral-400 dark:group-hover:text-white'
            }`} />
          </button>
        ) : (
          /* Expanded View: Settings Accordion Menu */
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={handleSettingsClick}
              title="Settings"
              className={`group flex items-center transition-all cursor-pointer w-full px-2.5 py-2 rounded-xl justify-between text-xs font-medium ${
                isSettingsActive && !isSettingsDropdownOpen
                  ? 'bg-neutral-900 text-white shadow-xs font-semibold'
                  : isSettingsActive
                  ? 'bg-neutral-100 text-neutral-900 font-bold dark:bg-neutral-800 dark:text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Settings className={`w-4 h-4 shrink-0 transition-colors ${
                  isSettingsActive 
                    ? (isSettingsDropdownOpen ? 'text-neutral-900 dark:text-white' : 'text-white') 
                    : 'text-neutral-500 group-hover:text-neutral-900 dark:text-neutral-400 dark:group-hover:text-white'
                }`} />
                <span className="truncate">Settings</span>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                  isSettingsDropdownOpen ? 'rotate-180 text-neutral-800 dark:text-neutral-200' : 'text-neutral-400'
                }`}
              />
            </button>

            {/* Sub-menus inside Settings */}
            {isSettingsDropdownOpen && (
              <div className="ml-3 pl-2 border-l border-neutral-200/90 dark:border-neutral-800 space-y-1 py-1 animate-fadeIn">
                
                {/* Submenu 1: Logo & Branding */}
                <button
                  type="button"
                  onClick={() => setActivePage('logos')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    activePage === 'logos'
                      ? 'bg-neutral-900 text-white font-medium shadow-xs dark:bg-neutral-100 dark:text-neutral-900'
                      : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/70 font-normal dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 opacity-70" />
                    <span>Logo & Branding</span>
                  </div>
                </button>

                {/* Submenu: UPI QR Settings */}
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('logos');
                    setTimeout(() => {
                      const el = document.getElementById('section-upi-qr');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 120);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/70 font-normal dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
                >
                  <div className="flex items-center gap-2">
                    <QrCode className="w-3.5 h-3.5 opacity-70" />
                    <span>UPI QR Settings</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 px-1 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40">
                    SCAN
                  </span>
                </button>

                {/* Submenu 2: Shift Z-Report */}
                {onOpenShiftReport && (
                  <button
                    type="button"
                    onClick={onOpenShiftReport}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/70 font-normal dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
                  >
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5 opacity-70" />
                      <span>Shift Z-Report</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase text-neutral-400 dark:text-neutral-500 px-1 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800">
                      POS
                    </span>
                  </button>
                )}

                {/* Submenu 3: Theme (Dark & Light Theme) */}
                <div className="pt-1 mt-1 border-t border-neutral-100 dark:border-neutral-800/80 space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsThemeDropdownOpen(prev => !prev)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {isDark ? (
                        <Moon className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">Theme</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase">
                        {theme}
                      </span>
                      <ChevronDown
                        className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${
                          isThemeDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Dark & Light Sub-options */}
                  {isThemeDropdownOpen && (
                    <div className="ml-2 pl-2 border-l border-neutral-200/80 dark:border-neutral-800 space-y-1 py-0.5 animate-fadeIn">
                      {/* Light Theme Option */}
                      <button
                        type="button"
                        onClick={() => setTheme('light')}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                          !isDark
                            ? 'bg-neutral-900 text-white font-medium shadow-xs dark:bg-neutral-100 dark:text-neutral-900'
                            : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/70 font-normal dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-400' : 'text-neutral-400'}`} />
                          <span>Light Theme</span>
                        </div>
                        {!isDark && <Check className="w-3.5 h-3.5 text-white dark:text-neutral-900" />}
                      </button>

                      {/* Dark Theme Option */}
                      <button
                        type="button"
                        onClick={() => setTheme('dark')}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                          isDark
                            ? 'bg-neutral-900 text-white font-medium shadow-xs dark:bg-neutral-100 dark:text-neutral-900'
                            : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/70 font-normal dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-neutral-400'}`} />
                          <span>Dark Theme</span>
                        </div>
                        {isDark && <Check className="w-3.5 h-3.5 text-white dark:text-neutral-900" />}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

      </nav>



      {/* Bottom User / Logout Section with Side Edit Tool */}
      <div className="p-2.5 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-1.5">
        {/* User Profile Pill with Side Edit Tool */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center p-1' : 'justify-between px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/60 shadow-2xs'}`}>
          <div className="flex items-center gap-2 min-w-0">
            <div 
              onClick={() => setIsEditProfileOpen(true)}
              className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden shrink-0 cursor-pointer border border-neutral-200 hover:opacity-90"
              title="Click to edit profile"
            >
              <img
                src={userAvatar}
                alt={userName}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                className="w-full h-full object-cover"
              />
              <span className="uppercase text-[10px]">
                {userName.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AR'}
              </span>
            </div>

            {!isCollapsed && (
              <div className="min-w-0 text-left">
                <p className="text-xs font-bold text-neutral-900 dark:text-white truncate leading-tight">
                  {userName}
                </p>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium truncate leading-tight">
                  Administrator
                </p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(true)}
              className="p-1 rounded-lg text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700/60 transition-colors cursor-pointer"
              title="Edit Profile Image & Details"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sign Out Button */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Sign Out"
            className={`flex items-center transition-all cursor-pointer ${
              isCollapsed 
                ? 'w-10 h-10 p-0 mx-auto justify-center rounded-xl' 
                : 'w-full gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium'
            } text-neutral-600 hover:text-red-600 hover:bg-red-50/70 dark:text-neutral-400 dark:hover:text-red-400 dark:hover:bg-red-950/30`}
          >
            <LogOut className="w-4 h-4 opacity-70 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />

    </aside>
  );
}
