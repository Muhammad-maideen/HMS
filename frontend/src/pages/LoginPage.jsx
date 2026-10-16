import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  KeyRound,
  Building2,
  Mail,
  CheckCircle2,
  UtensilsCrossed,
  UserPlus,
  LogIn,
  Store,
  ChevronRight
} from 'lucide-react';
import { setRole } from '../services/api';
import { useToast } from '../context/ToastContext';
import ThemeToggleBtn from '../components/ThemeToggleBtn';

const DEFAULT_SEED_TENANTS = [
  {
    id: 'tenant-master',
    restaurantName: 'AL RIZQ ELITE',
    ownerName: 'Admin Owner',
    username: 'admin',
    email: 'admin@alrizq.com',
    password: 'admin',
    role: 'admin',
  }
];

export default function LoginPage({ onLoginSuccess }) {
  const { addToast } = useToast();

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState('login');

  // Login form state (empty by default for real customer use)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state (for new SaaS customers)
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // Get all registered tenants from storage
  const getTenants = () => {
    try {
      const raw = localStorage.getItem('hms_registered_tenants');
      if (!raw) {
        localStorage.setItem('hms_registered_tenants', JSON.stringify(DEFAULT_SEED_TENANTS));
        return DEFAULT_SEED_TENANTS;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_SEED_TENANTS;
    }
  };

  // Handle Login for Existing Customer
  const handleLogin = (e) => {
    if (e) e.preventDefault();

    const cleanIdentifier = loginIdentifier.trim();
    if (!cleanIdentifier) {
      addToast('Please enter your username or registered email', 'error');
      return;
    }

    if (!loginPassword) {
      addToast('Please enter your password', 'error');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const tenants = getTenants();
      const lowerId = cleanIdentifier.toLowerCase();

      // Find tenant matching username or email
      const matchedTenant = tenants.find(
        (t) => (t.username && t.username.toLowerCase() === lowerId) || 
               (t.email && t.email.toLowerCase() === lowerId)
      );

      // Check credentials (allows matching tenant password or master admin fallback)
      const isMasterAdmin = (lowerId === 'admin' && (loginPassword === 'admin' || loginPassword === 'admin123'));
      const isTenantValid = matchedTenant && matchedTenant.password === loginPassword;

      if (!isTenantValid && !isMasterAdmin) {
        setIsLoading(false);
        addToast('Invalid credentials. Check your username/password or register below.', 'error');
        return;
      }

      const activeTenant = matchedTenant || {
        id: 'tenant-master',
        restaurantName: localStorage.getItem('hms_restaurant_name') || 'AL RIZQ ELITE',
        ownerName: cleanIdentifier,
        username: cleanIdentifier,
        email: `${cleanIdentifier}@software.local`,
        role: cleanIdentifier.includes('cashier') ? 'cashier' : cleanIdentifier.includes('manager') ? 'manager' : 'admin',
      };

      // Set tenant session in storage
      localStorage.setItem('hms_is_authenticated', 'true');
      localStorage.setItem('hms_active_tenant_id', activeTenant.id);
      localStorage.setItem('hms_restaurant_name', activeTenant.restaurantName);
      localStorage.setItem('hms_user_name', activeTenant.ownerName || activeTenant.username);
      localStorage.setItem('hms_user_email', activeTenant.email || `${activeTenant.username}@software.local`);

      const sessionData = {
        tenantId: activeTenant.id,
        restaurantName: activeTenant.restaurantName,
        username: activeTenant.username,
        role: activeTenant.role || 'admin',
        loginTime: new Date().toISOString(),
      };

      localStorage.setItem('hms_auth_user', JSON.stringify(sessionData));
      setRole(activeTenant.role || 'admin');

      // Dispatch events to update navbar & sidebar branding immediately
      window.dispatchEvent(new Event('hms_logo_updated'));
      window.dispatchEvent(new Event('hms_profile_updated'));
      window.dispatchEvent(new Event('storage'));

      setIsLoading(false);
      addToast(`Welcome back, ${activeTenant.restaurantName}!`, 'success');

      if (onLoginSuccess) {
        onLoginSuccess(sessionData);
      }
    }, 450);
  };

  // Handle Registration for New Customer
  const handleRegister = (e) => {
    if (e) e.preventDefault();

    if (!restaurantName.trim()) {
      addToast('Please enter your Restaurant or Cafe name', 'error');
      return;
    }
    if (!ownerName.trim()) {
      addToast('Please enter your full name', 'error');
      return;
    }
    if (!registerEmail.trim() || !registerEmail.includes('@')) {
      addToast('Please enter a valid email address', 'error');
      return;
    }
    if (!registerUsername.trim()) {
      addToast('Please choose a username for login', 'error');
      return;
    }
    if (registerPassword.length < 4) {
      addToast('Password must be at least 4 characters long', 'error');
      return;
    }
    if (registerPassword !== confirmPassword) {
      addToast('Passwords do not match. Please recheck.', 'error');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const tenants = getTenants();
      const lowerUsername = registerUsername.trim().toLowerCase();
      const lowerEmail = registerEmail.trim().toLowerCase();

      // Check if username or email already registered
      const exists = tenants.some(
        (t) => (t.username && t.username.toLowerCase() === lowerUsername) ||
               (t.email && t.email.toLowerCase() === lowerEmail)
      );

      if (exists) {
        setIsLoading(false);
        addToast('This username or email is already registered. Please sign in.', 'error');
        setAuthMode('login');
        return;
      }

      // Create new tenant
      const newTenant = {
        id: `tenant-${Date.now()}`,
        restaurantName: restaurantName.trim(),
        ownerName: ownerName.trim(),
        username: registerUsername.trim(),
        email: registerEmail.trim().toLowerCase(),
        password: registerPassword,
        role: 'admin',
        createdAt: new Date().toISOString(),
      };

      const updatedTenants = [...tenants, newTenant];
      localStorage.setItem('hms_registered_tenants', JSON.stringify(updatedTenants));

      // Set active session to this new restaurant
      localStorage.setItem('hms_is_authenticated', 'true');
      localStorage.setItem('hms_active_tenant_id', newTenant.id);
      localStorage.setItem('hms_restaurant_name', newTenant.restaurantName);
      localStorage.setItem('hms_user_name', newTenant.ownerName);
      localStorage.setItem('hms_user_email', newTenant.email);

      const sessionData = {
        tenantId: newTenant.id,
        restaurantName: newTenant.restaurantName,
        username: newTenant.username,
        role: 'admin',
        loginTime: new Date().toISOString(),
      };

      localStorage.setItem('hms_auth_user', JSON.stringify(sessionData));
      setRole('admin');

      // Dispatch events so the UI updates
      window.dispatchEvent(new Event('hms_logo_updated'));
      window.dispatchEvent(new Event('hms_profile_updated'));
      window.dispatchEvent(new Event('storage'));

      setIsLoading(false);
      addToast(`🎉 Account created! Welcome, ${newTenant.restaurantName}!`, 'success');

      if (onLoginSuccess) {
        onLoginSuccess(sessionData);
      }
    }, 550);
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200 font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      
      {/* Top Header */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-black shadow-sm">
            <UtensilsCrossed className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-tight text-neutral-900 dark:text-white block leading-none">
              RESTAURANT OS &bull; CLOUD POS
            </span>
            <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Multi-Tenant SaaS v2.5
            </span>
          </div>
        </div>

        <ThemeToggleBtn />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md mx-auto my-auto animate-fadeIn py-4">
        <div className="bg-white dark:bg-[#121214] border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          
          {/* Card Header */}
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              {authMode === 'login' ? (
                <KeyRound className="w-5 h-5 text-neutral-900 dark:text-white" />
              ) : (
                <Store className="w-5 h-5 text-neutral-900 dark:text-white" />
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {authMode === 'login' ? 'Sign In to Your Restaurant' : 'Create Restaurant Account'}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {authMode === 'login' 
                ? 'Enter your credentials to access your POS terminal & management suite'
                : 'Set up your restaurant or cafe to get your private management portal'}
            </p>
          </div>

          {/* Segmented Mode Switcher (Sign In vs Register) */}
          <div className="grid grid-cols-2 p-1 bg-neutral-100 dark:bg-neutral-900/80 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'login'
                  ? 'bg-white dark:bg-[#1c1c20] text-neutral-900 dark:text-white shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-white dark:bg-[#1c1c20] text-neutral-900 dark:text-white shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register New</span>
            </button>
          </div>

          {/* SIGN IN FORM */}
          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Username or Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Username or Registered Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. admin or owner@myrestaurant.com"
                    required
                    autoFocus
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white dark:bg-[#18181b] border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your account password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-white dark:bg-[#18181b] border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-neutral-900 dark:text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5"
                    title={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Security */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-neutral-600 dark:text-neutral-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-black focus:ring-black cursor-pointer"
                  />
                  <span>Keep session active</span>
                </label>

                <span className="text-neutral-400 text-[11px] flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Isolated Tenant</span>
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin"></span>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>

              {/* Switch to Register Link */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  New customer? <strong className="underline underline-offset-4 text-neutral-900 dark:text-white font-semibold">Create your Restaurant account →</strong>
                </button>
              </div>

            </form>
          ) : (
            /* REGISTRATION FORM (NEW SAAS CUSTOMER) */
            <form onSubmit={handleRegister} className="space-y-3.5">
              
              {/* Restaurant Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Restaurant / Cafe Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="e.g. Royal Spice Bistro"
                    required
                    autoFocus
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white dark:bg-[#18181b] border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-neutral-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              {/* Owner Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Owner / Manager Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Mohammed Farhan"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white dark:bg-[#18181b] border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Business Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="e.g. contact@royalspice.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white dark:bg-[#18181b] border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Login Username */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Choose Login Username <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    placeholder="e.g. royalspice_admin"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white dark:bg-[#18181b] border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-neutral-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="Min 4 chars"
                      required
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-[#18181b] border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-neutral-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-[#18181b] border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-neutral-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Show Password Toggle */}
              <div className="flex items-center justify-between text-[11px] text-neutral-500">
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="hover:text-black dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  {showRegisterPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showRegisterPassword ? 'Hide passwords' : 'Show passwords'}</span>
                </button>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Free Instant Onboarding</span>
                </span>
              </div>

              {/* Submit Register */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer pt-3 pb-3 mt-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Creating Restaurant Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Register Restaurant & Launch POS</span>
                    <Sparkles className="w-4 h-4 fill-white" />
                  </>
                )}
              </button>

              {/* Switch to Login */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  Already have an account? <strong className="underline underline-offset-4 text-neutral-900 dark:text-white font-semibold">Sign in here →</strong>
                </button>
              </div>

            </form>
          )}

        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="w-full max-w-md mx-auto text-center py-2 text-[11px] text-neutral-400">
        Restaurant Management Suite &bull; Multi-Tenant SaaS &bull; Isolated POS & Audit Invoices
      </div>

    </div>
  );
}
