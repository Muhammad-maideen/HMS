import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  ShieldCheck, 
  UserCheck, 
  ShoppingBag, 
  ChefHat, 
  Plus, 
  ChevronDown,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { setRole, getRole } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Navbar({ 
  activePage = 'pos',
  setActivePage,
  onOpenNewProduct, 
  stats,
  productsCount = 0,
  categoriesCount = 0
}) {
  const { addToast } = useToast();
  const [currentRole, setCurrentRoleState] = useState(getRole());
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);

  const isProductsActive = activePage === 'products' || activePage === 'categories' || activePage === 'combos';

  const roles = [
    {
      id: 'admin',
      name: 'Owner / Admin',
      icon: ShieldCheck,
      description: 'Full unconstrained access to products, prices, offers & combos'
    },
    {
      id: 'manager',
      name: 'Branch Manager',
      icon: UserCheck,
      description: 'Can manage products, categories, pricing, offers & combos'
    },
    {
      id: 'cashier',
      name: 'POS Cashier',
      icon: ShoppingBag,
      description: 'View active menu, process POS orders; mutations are blocked'
    },
    {
      id: 'kitchen',
      name: 'Kitchen Staff',
      icon: ChefHat,
      description: 'View orders and preparation details only'
    },
  ];

  const handleSelectRole = (roleId) => {
    setRole(roleId);
    setCurrentRoleState(roleId);
    setIsRoleDropdownOpen(false);
    addToast(`Switched active workspace role to: ${roles.find(r => r.id === roleId)?.name}`, 'info');
  };

  const activeRoleObj = roles.find(r => r.id === currentRole) || roles[0];
  const RoleIcon = activeRoleObj.icon;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 px-6 py-2.5 flex items-center justify-between">
      
      {/* Brand & Identity */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white shadow-sm font-black">
            <UtensilsCrossed className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-neutral-900">
                AL RIZQ <span className="font-extrabold text-black">ELITE</span>
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200">
                RMS
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 font-normal tracking-tight">
              Restaurant Management & Dynamic POS Suite
            </p>
          </div>
        </div>

        {/* 3 Modules Navigation (POS 1st, Products Dropdown, Bill History 3rd) */}
        {setActivePage && (
          <nav className="hidden md:flex items-center gap-1.5 pl-6 border-l border-neutral-200">
            {/* POS */}
            <button
              type="button"
              onClick={() => setActivePage('pos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activePage === 'pos'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>POS Terminal</span>
            </button>

            {/* Products Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProductsDropdownOpen(!isProductsDropdownOpen)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isProductsActive
                    ? 'bg-black text-white shadow-sm'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                }`}
              >
                <span>Products</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isProductsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProductsDropdownOpen && (
                <div 
                  className="absolute left-0 mt-2 w-64 bg-white border border-neutral-200 rounded-xl shadow-xl py-1.5 z-50 animate-fadeIn"
                  onMouseLeave={() => setIsProductsDropdownOpen(false)}
                >
                  <div className="px-3.5 py-1.5 border-b border-neutral-100 text-[10px] uppercase font-bold text-neutral-400">
                    Products Menu
                  </div>

                  {/* Product Name */}
                  <button
                    type="button"
                    onClick={() => { setActivePage('products'); setIsProductsDropdownOpen(false); }}
                    className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                      activePage === 'products' ? 'bg-neutral-100 text-black font-semibold' : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <span>Items Catalog</span>
                    {productsCount > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-200/80 text-neutral-700">
                        {productsCount}
                      </span>
                    )}
                  </button>

                  {/* Categories */}
                  <button
                    type="button"
                    onClick={() => { setActivePage('categories'); setIsProductsDropdownOpen(false); }}
                    className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                      activePage === 'categories' ? 'bg-neutral-100 text-black font-semibold' : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <span>Categories</span>
                    {categoriesCount > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-200/80 text-neutral-700">
                        {categoriesCount}
                      </span>
                    )}
                  </button>

                  {/* Combos */}
                  <button
                    type="button"
                    onClick={() => { setActivePage('combos'); setIsProductsDropdownOpen(false); }}
                    className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                      activePage === 'combos' ? 'bg-neutral-100 text-black font-semibold' : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <span>Combos</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bill History */}
            <button
              type="button"
              onClick={() => setActivePage('orders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activePage === 'orders'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
              }`}
            >
              <span>Bill History</span>
            </button>

            {/* Logos & Branding */}
            <button
              type="button"
              onClick={() => setActivePage('logos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activePage === 'logos'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Logos & Branding</span>
            </button>
          </nav>
        )}
      </div>

      {/* Actions & Role Switcher */}
      <div className="flex items-center gap-3">
        
        {/* Quick Add Product Button (Owner & Manager) */}
        {(currentRole === 'admin' || currentRole === 'manager') && (
          <button
            onClick={onOpenNewProduct}
            className="px-3.5 py-2 bg-black hover:bg-neutral-800 text-white font-medium text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Product</span>
          </button>
        )}

        {/* Role Switcher Menu */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-800 shadow-sm transition-all"
          >
            <div className="w-5 h-5 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-700">
              <RoleIcon className="w-3.5 h-3.5" />
            </div>
            <div className="text-left hidden sm:block">
              <span className="block text-[9px] uppercase tracking-wider text-neutral-400 font-semibold">Role</span>
              <span className="font-semibold text-neutral-900 leading-tight">{activeRoleObj.name}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 ml-1" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-neutral-200 shadow-xl p-2 z-50">
              <div className="px-3 py-2 border-b border-neutral-100 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Switch Permission Role
                </span>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Test RBAC authorization rules in UI and API
                </p>
              </div>

              <div className="space-y-1">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const isSelected = r.id === currentRole;
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleSelectRole(r.id)}
                      className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 transition-all ${
                        isSelected
                          ? 'bg-neutral-100 border border-neutral-300 text-neutral-900'
                          : 'hover:bg-neutral-50 border border-transparent text-neutral-700'
                      }`}
                    >
                      <div className={`p-1.5 rounded-md mt-0.5 ${isSelected ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-700'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-neutral-900">{r.name}</span>
                          {isSelected && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-black text-white font-medium">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 leading-tight mt-0.5">
                          {r.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
}
