import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CategoriesPage from './pages/CategoriesPage';
import CategoryDetailPage from './pages/CategoryDetailPage';
import CombosPage from './pages/CombosPage';
import ComboDetailPage from './pages/ComboDetailPage';
import POSSimulatorPage from './pages/POSSimulatorPage';
import OrdersAuditPage from './pages/OrdersAuditPage';
import TablesPage from './pages/TablesPage';
import LogosSettingsPage from './pages/LogosSettingsPage';
import SuperAdminPortal from './pages/SuperAdminPortal';
import AdminLoginPage from './pages/AdminLoginPage';
import LoginPage from './pages/LoginPage';
import { api } from './services/api';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';

function MainLayout({ onLogout }) {
  // Modules:
  // 1. 'dashboard' (Executive Overview Dashboard)
  // 2. 'pos' (POS Terminal & Checkout)
  // 3. Products (Dropdown in Sidebar):
  //     - 'products' (Products catalog)
  //     - 'categories' (Categories catalog)
  //     - 'combos' (Combos catalog)
  // 4. 'orders' (Bill History)
  // 5. 'logos' (Branding)
  const [activePage, setActivePage] = useState(() => {
    return localStorage.getItem('hms_active_page') || 'pos';
  });
  
  // Sidebar collapsed state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('hms_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      localStorage.setItem('hms_sidebar_collapsed', !prev);
      return !prev;
    });
  };

  // Global search input state
  const [globalSearch, setGlobalSearch] = useState('');

  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);
  const [selectedCategoryForDetail, setSelectedCategoryForDetail] = useState(null);
  const [selectedComboForDetail, setSelectedComboForDetail] = useState(null);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const loadInitialData = async () => {
    try {
      const [catsRes, prodsRes] = await Promise.all([
        api.getCategories(),
        api.getProducts({ all: '1' }),
      ]);
      setCategories(catsRes.data || []);
      setProducts(prodsRes.data || []);
    } catch (err) {
      console.error('Failed to load initial data', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [refreshTrigger]);

  const handleOpenNewProduct = () => {
    setActivePage('products');
    setSelectedProductForDetail('new');
  };

  const handleEditProduct = (product) => {
    setActivePage('products');
    setSelectedProductForDetail(product);
  };

  const handleBackToProductList = () => {
    setSelectedProductForDetail(null);
  };

  const handleOpenNewCategory = () => {
    setActivePage('categories');
    setSelectedCategoryForDetail('new');
  };

  const handleEditCategory = (category) => {
    setActivePage('categories');
    setSelectedCategoryForDetail(category);
  };

  const handleBackToCategoryList = () => {
    setSelectedCategoryForDetail(null);
  };

  const handleOpenNewCombo = () => {
    setActivePage('combos');
    setSelectedComboForDetail('new');
  };

  const handleEditCombo = (combo) => {
    setActivePage('combos');
    setSelectedComboForDetail(combo);
  };

  const handleBackToComboList = () => {
    setSelectedComboForDetail(null);
  };

  const handleNavigate = (page) => {
    setActivePage(page);
    localStorage.setItem('hms_active_page', page);
    if (page === 'products') {
      setSelectedProductForDetail(null);
    }
    if (page === 'categories') {
      setSelectedCategoryForDetail(null);
    }
    if (page === 'combos') {
      setSelectedComboForDetail(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0c] text-neutral-900 dark:text-neutral-100 flex font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black antialiased overflow-hidden">
      
      {/* Left Sidebar (RestoDash Black & White edition) */}
      <Sidebar
        activePage={activePage}
        setActivePage={handleNavigate}
        onOpenNewProduct={handleOpenNewProduct}
        productsCount={products.length}
        categoriesCount={categories.length}
        onLogout={onLogout}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onOpenKeyboardGuide={() => {
          if (activePage !== 'pos') handleNavigate('pos');
          setTimeout(() => window.dispatchEvent(new Event('hms_open_shortcuts')), 100);
        }}
        onOpenShiftReport={() => {
          if (activePage !== 'pos') handleNavigate('pos');
          setTimeout(() => window.dispatchEvent(new Event('hms_open_zreport')), 100);
        }}
      />

      {/* Main Column: Global Top Header + Page Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        
        {/* Top Navbar matching RestoDash Header (Search, Notifications, Date/Time, User Profile) */}
        <TopNavbar
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
          onLogout={onLogout}
          onGlobalSearch={(q) => {
            setGlobalSearch(q);
            if (activePage !== 'pos' && activePage !== 'orders' && activePage !== 'products') {
              handleNavigate('pos');
            }
          }}
          activePage={activePage}
          onNavigate={handleNavigate}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#fafafa] dark:bg-[#0a0a0c]">
          {/* Module 1: Executive Overview Dashboard */}
          {activePage === 'dashboard' && (
            <DashboardPage
              onNavigate={handleNavigate}
              onOpenNewProduct={handleOpenNewProduct}
            />
          )}

          {/* Module 2: POS Terminal & Checkout (RestoDash Redesign) */}
          {activePage === 'pos' && (
            <POSSimulatorPage
              onOrderPlaced={triggerRefresh}
              onLogout={onLogout}
              externalSearch={globalSearch}
            />
          )}

          {/* Module 3: Restaurant Tables Management */}
          {activePage === 'tables' && (
            <TablesPage onNavigate={handleNavigate} />
          )}

          {/* Module 2 (Dropdown Item 1): Products */}
          {activePage === 'products' && (
            selectedProductForDetail ? (
              <ProductDetailPage
                product={selectedProductForDetail === 'new' ? null : selectedProductForDetail}
                categories={categories}
                onBack={handleBackToProductList}
                onSaved={() => {
                  triggerRefresh();
                  setSelectedProductForDetail(null);
                }}
              />
            ) : (
              <ProductsPage
                onEditProduct={handleEditProduct}
                onOpenNewProduct={handleOpenNewProduct}
                categories={categories}
                refreshTrigger={refreshTrigger}
                onNavigate={handleNavigate}
              />
            )
          )}

          {/* Module 2 (Dropdown Item 2): Categories */}
          {activePage === 'categories' && (
            selectedCategoryForDetail ? (
              <CategoryDetailPage
                category={selectedCategoryForDetail === 'new' ? null : selectedCategoryForDetail}
                onBack={handleBackToCategoryList}
                onSaved={() => {
                  triggerRefresh();
                  setSelectedCategoryForDetail(null);
                }}
              />
            ) : (
              <CategoriesPage
                onEditCategory={handleEditCategory}
                onOpenNewCategory={handleOpenNewCategory}
                onCategoryUpdated={triggerRefresh}
              />
            )
          )}

          {/* Module 2 (Dropdown Item 3): Combos */}
          {activePage === 'combos' && (
            selectedComboForDetail ? (
              <ComboDetailPage
                combo={selectedComboForDetail === 'new' ? null : selectedComboForDetail}
                products={products}
                onBack={handleBackToComboList}
                onSaved={() => {
                  triggerRefresh();
                  setSelectedComboForDetail(null);
                }}
              />
            ) : (
              <CombosPage
                onEditCombo={handleEditCombo}
                onOpenNewCombo={handleOpenNewCombo}
                products={products}
                refreshTrigger={refreshTrigger}
              />
            )
          )}

          {/* Module 3: Bill History */}
          {activePage === 'orders' && (
            <OrdersAuditPage
              refreshTrigger={refreshTrigger}
            />
          )}

          {/* Module 4: Branding & Logos */}
          {activePage === 'logos' && (
            <LogosSettingsPage />
          )}
        </main>

      </div>

    </div>
  );
}

export default function App() {
  // Path routing: '/' or '/admin'
  const [currentPath, setCurrentPath] = useState(() => {
    return window.location.pathname || '/';
  });

  // Admin authentication state for /admin
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('hms_admin_authenticated') === 'true';
  });

  // Restaurant authentication state for /
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('hms_is_authenticated') === 'true';
  });

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('hms_admin_authenticated');
    localStorage.removeItem('hms_admin_user');
    setIsAdminAuthenticated(false);
  };

  const handleRestaurantLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleRestaurantLogout = () => {
    localStorage.removeItem('hms_is_authenticated');
    localStorage.removeItem('hms_auth_user');
    setIsAuthenticated(false);
  };

  const isAdminRoute = currentPath === '/admin' || currentPath.startsWith('/admin');

  // Check if current user is Super Admin (Muhammad)
  const isSuperAdminUser = (() => {
    try {
      const auth = JSON.parse(localStorage.getItem('hms_auth_user') || '{}');
      const u = auth.username?.toLowerCase() || '';
      return u === 'muhammad' || u === 'admin' || u === 'maideen' || auth.role === 'super_admin';
    } catch {
      return false;
    }
  })();

  return (
    <ThemeProvider>
      <ToastProvider>
        {isAdminRoute ? (
          isAdminAuthenticated ? (
            <SuperAdminPortal 
              onSwitchToRestaurant={() => navigateTo('/')} 
              onLogout={handleAdminLogout} 
            />
          ) : (
            <AdminLoginPage 
              onLoginSuccess={handleAdminLoginSuccess} 
              onGoToRestaurant={() => navigateTo('/')} 
            />
          )
        ) : (
          isAuthenticated ? (
            <MainLayout 
              onLogout={handleRestaurantLogout} 
            />
          ) : (
            <LoginPage 
              onLoginSuccess={handleRestaurantLoginSuccess} 
              onGoToAdminPortal={() => navigateTo('/admin')}
            />
          )
        )}
      </ToastProvider>
    </ThemeProvider>
  );
}
