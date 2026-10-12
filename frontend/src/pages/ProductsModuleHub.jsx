import React, { useState, useRef, useEffect } from 'react';
import { 
  Utensils, 
  FolderTree, 
  Layers, 
  ChevronDown, 
  Check,
  ShoppingBag
} from 'lucide-react';
import ProductsPage from './ProductsPage';
import CategoriesPage from './CategoriesPage';
import CombosPage from './CombosPage';

export default function ProductsModuleHub({
  activeSubModule = 'products',
  setActiveSubModule,
  onEditProduct,
  onOpenNewProduct,
  categories = [],
  products = [],
  refreshTrigger,
  onRefresh
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const subModules = [
    {
      id: 'products',
      name: 'Product Name',
      title: 'Menu Products & Dishes',
      description: 'Manage individual dish titles, portion pricing, stock levels & status',
      icon: Utensils,
      count: products.length
    },
    {
      id: 'categories',
      name: 'Categories',
      title: 'Menu Classification Categories',
      description: 'Configure menu categories, sorting order, and dish groupings',
      icon: FolderTree,
      count: categories.length
    },
    {
      id: 'combos',
      name: 'Combos',
      title: 'Combo Packages & Value Deals',
      description: 'Build bundled meal deals with customizable portion combinations',
      icon: Layers,
      count: undefined
    }
  ];

  const currentModule = subModules.find(m => m.id === activeSubModule) || subModules[0];
  const CurrentIcon = currentModule.icon;

  const handleSelectSubModule = (id) => {
    setActiveSubModule(id);
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex flex-col min-h-full">
      
      {/* Products Module Header with Dropdown Navigation (NO tabs) */}
      <div className="bg-white border-b border-neutral-200 px-6 py-3 sticky top-0 z-20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Left: Module identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center font-bold shadow-sm">
            <Utensils className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                Module 2
              </span>
              <span className="text-neutral-300">•</span>
              <span className="text-xs font-semibold text-neutral-600">Products Module</span>
            </div>
            <h1 className="text-sm font-bold text-neutral-900 leading-tight">
              {currentModule.title}
            </h1>
          </div>
        </div>

        {/* Right: The Products Dropdown Selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500 font-medium hidden md:inline">
            Inside Products:
          </span>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(prev => !prev)}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-white hover:bg-neutral-50 border border-neutral-300 hover:border-black rounded-lg text-xs font-semibold text-neutral-900 shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-black"
              aria-expanded={isDropdownOpen}
              aria-label="Select Products section"
            >
              <CurrentIcon className="w-4 h-4 text-black shrink-0" />
              <div className="text-left flex items-center gap-1.5">
                <span className="text-neutral-500 font-normal">Section:</span>
                <span className="font-bold text-black">{currentModule.name}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-neutral-500 transition-transform duration-200 ml-1 ${isDropdownOpen ? 'rotate-180 text-black' : ''}`} />
            </button>

            {/* Dropdown Menu Popup */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-neutral-200 rounded-xl shadow-xl py-1.5 z-50 animate-fadeIn">
                <div className="px-3.5 py-2 border-b border-neutral-100 mb-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Products Dropdown
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Select a section inside Products module
                  </p>
                </div>

                <div className="space-y-1 px-1">
                  {subModules.map((item) => {
                    const Icon = item.icon;
                    const isSelected = activeSubModule === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSubModule(item.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between text-xs transition-all ${
                          isSelected
                            ? 'bg-black text-white font-medium shadow-sm'
                            : 'text-neutral-800 hover:bg-neutral-100'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-white' : 'text-neutral-600'}`} />
                          <div>
                            <div className="font-bold leading-tight">{item.name}</div>
                            <div className={`text-[10px] leading-tight mt-0.5 line-clamp-1 ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                              {item.description}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                          {item.count !== undefined && (
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                              isSelected ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-600'
                            }`}>
                              {item.count}
                            </span>
                          )}
                          {isSelected && <Check className="w-3.5 h-3.5 text-white ml-0.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Sub-module View Container */}
      <div className="flex-1">
        {activeSubModule === 'products' && (
          <ProductsPage
            onEditProduct={onEditProduct}
            onOpenNewProduct={onOpenNewProduct}
            categories={categories}
            refreshTrigger={refreshTrigger}
            onNavigate={setActiveSubModule}
          />
        )}

        {activeSubModule === 'categories' && (
          <CategoriesPage
            onCategoryUpdated={onRefresh}
            onNavigate={setActiveSubModule}
          />
        )}

        {activeSubModule === 'combos' && (
          <CombosPage
            products={products}
            refreshTrigger={refreshTrigger}
            onNavigate={setActiveSubModule}
          />
        )}
      </div>

    </div>
  );
}
