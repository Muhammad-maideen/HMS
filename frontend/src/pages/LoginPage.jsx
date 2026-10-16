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
  Phone, 
  CheckCircle2, 
  UtensilsCrossed, 
  UserPlus, 
  LogIn, 
  Store, 
  Clock, 
  AlertCircle, 
  XCircle, 
  RefreshCw, 
  ArrowLeft 
} from 'lucide-react';
import { setRole, api } from '../services/api';
import { useToast } from '../context/ToastContext';
import ThemeToggleBtn from '../components/ThemeToggleBtn';

const DEFAULT_SEED_TENANTS = [
  {
    id: 'tenant-master',
    restaurantName: 'AL RIZQ ELITE',
    ownerName: 'Maideen',
    username: 'Maideen',
    email: 'maideen@alrizq.com',
    password: 'M@!d33N@1020',
    role: 'admin',
    status: 'approved',
  }
];

export default function LoginPage({ onLoginSuccess }) {
  const { addToast } = useToast();

  // Mode: 'login' | 'register' | 'pending_notice'
  const [authMode, setAuthMode] = useState('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Pending Notice state (when user just registered or is awaiting approval)
  const [pendingAccount, setPendingAccount] = useState(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // Helper to load tenants / client requests from local storage
  const getTenants = () => {
    try {
      const raw = localStorage.getItem('hms_registered_tenants');
      if (!raw) {
        localStorage.setItem('hms_registered_tenants', JSON.stringify(DEFAULT_SEED_TENANTS));
        return DEFAULT_SEED_TENANTS;
      }
      const parsed = JSON.parse(raw);
      // Migrate or update master admin credentials
      const updated = parsed.map(t => {
        if (t.id === 'tenant-master' || t.username?.toLowerCase() === 'admin' || t.username?.toLowerCase() === 'maideen') {
          return {
            ...t,
            ownerName: 'Maideen',
            username: 'Maideen',
            password: 'M@!d33N@1020',
            role: 'admin',
            status: 'approved',
          };
        }
        return t;
      });
      localStorage.setItem('hms_registered_tenants', JSON.stringify(updated));
      return updated;
    } catch {
      return DEFAULT_SEED_TENANTS;
    }
  };

  // Helper to complete login session
  const completeLoginSession = (tenant) => {
    localStorage.setItem('hms_is_authenticated', 'true');
    localStorage.setItem('hms_active_tenant_id', tenant.id || `tenant-${Date.now()}`);
    localStorage.setItem('hms_restaurant_name', tenant.restaurantName || tenant.restaurant_name || 'Restaurant');
    localStorage.setItem('hms_user_name', tenant.ownerName || tenant.owner_name || tenant.username);
    localStorage.setItem('hms_user_email', tenant.email || `${tenant.username}@software.local`);

    const sessionData = {
      tenantId: tenant.id,
      restaurantName: tenant.restaurantName || tenant.restaurant_name,
      username: tenant.username,
      role: tenant.role || 'admin',
      loginTime: new Date().toISOString(),
    };

    localStorage.setItem('hms_auth_user', JSON.stringify(sessionData));
    setRole(tenant.role || 'admin');

    window.dispatchEvent(new Event('hms_logo_updated'));
    window.dispatchEvent(new Event('hms_profile_updated'));
    window.dispatchEvent(new Event('storage'));

    addToast(`Welcome back, ${tenant.restaurantName || tenant.restaurant_name}!`, 'success');

    if (onLoginSuccess) {
      onLoginSuccess(sessionData);
    }
  };

  // Handle Login
  const handleLogin = async (e) => {
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
    const lowerId = cleanIdentifier.toLowerCase();

    // 1. MASTER ADMIN BYPASS (Instant Access for Maideen)
    const isMasterAdmin = (lowerId === 'maideen' || lowerId === 'admin') && 
      (loginPassword === 'M@!d33N@1020');

    if (isMasterAdmin) {
      setTimeout(() => {
        setIsLoading(false);
        completeLoginSession(DEFAULT_SEED_TENANTS[0]);
      }, 350);
      return;
    }

    // 2. Try Backend API first
    let remoteSuccess = false;
    try {
      const res = await api.loginClient({
        identifier: cleanIdentifier,
        password: loginPassword,
      });

      if (res && res.success && res.data) {
        setIsLoading(false);
        completeLoginSession(res.data);
        remoteSuccess = true;
        return;
      }
    } catch (err) {
      // If server returned 403 (Pending or Rejected)
      if (err.data && err.data.status === 'pending') {
        setIsLoading(false);
        setPendingAccount({
          restaurantName: err.data.data?.restaurant_name || cleanIdentifier,
          ownerName: err.data.data?.owner_name || 'Client',
          username: cleanIdentifier,
          status: 'pending',
        });
        setAuthMode('pending_notice');
        addToast(err.data.message || 'Account awaiting Super Admin approval.', 'warning');
        return;
      }

      if (err.data && err.data.status === 'rejected') {
        setIsLoading(false);
        addToast(err.data.message || 'Access request was declined by the administrator.', 'error');
        return;
      }
    }

    if (remoteSuccess) return;

    // 3. Fallback to Local Storage tenants & requests
    setTimeout(() => {
      setIsLoading(false);
      const tenants = getTenants();
      const matched = tenants.find(
        (t) => (t.username && t.username.toLowerCase() === lowerId) || 
               (t.email && t.email.toLowerCase() === lowerId)
      );

      if (!matched || matched.password !== loginPassword) {
        addToast('Invalid credentials. Check your username/password or register below.', 'error');
        return;
      }

      // Check Permission Status
      const status = matched.status || 'pending';

      if (status === 'pending') {
        setPendingAccount(matched);
        setAuthMode('pending_notice');
        addToast(`Permission Pending: "${matched.restaurantName}" must be admitted by the Super Admin first.`, 'warning');
        return;
      }

      if (status === 'rejected') {
        addToast(`Access Denied: Your registration request for "${matched.restaurantName}" was declined.`, 'error');
        return;
      }

      // Approved! Complete login
      completeLoginSession(matched);
    }, 400);
  };

  // Handle Registration
  const handleRegister = async (e) => {
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

    const payload = {
      restaurant_name: restaurantName.trim(),
      owner_name: ownerName.trim(),
      username: registerUsername.trim().toLowerCase(),
      email: registerEmail.trim().toLowerCase(),
      phone: registerPhone.trim() || null,
      password: registerPassword,
    };

    // 1. Send permission request to backend API
    try {
      await api.registerClient(payload);
    } catch (err) {
      console.warn('Backend registration failed, saving locally', err);
    }

    // 2. Also save to local storage cache with status = 'pending'
    const newClient = {
      id: `client-${Date.now()}`,
      restaurantName: payload.restaurant_name,
      ownerName: payload.owner_name,
      username: payload.username,
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
      status: 'pending', // PENDING APPROVAL TRIGGER
      role: 'admin',
      createdAt: new Date().toISOString(),
    };

    const tenants = getTenants();
    const updated = [...tenants.filter(t => t.username !== newClient.username), newClient];
    localStorage.setItem('hms_registered_tenants', JSON.stringify(updated));

    // Also update hms_client_requests
    try {
      const existingReqs = JSON.parse(localStorage.getItem('hms_client_requests') || '[]');
      const updatedReqs = [
        {
          id: newClient.id,
          restaurant_name: newClient.restaurantName,
          owner_name: newClient.ownerName,
          username: newClient.username,
          email: newClient.email,
          phone: newClient.phone,
          status: 'pending',
          created_at: newClient.createdAt,
        },
        ...existingReqs.filter(r => r.username !== newClient.username),
      ];
      localStorage.setItem('hms_client_requests', JSON.stringify(updatedReqs));
    } catch {}

    window.dispatchEvent(new Event('hms_client_requests_updated'));
    window.dispatchEvent(new Event('storage'));

    setIsLoading(false);

    // Switch to Pending Notice View (DO NOT auto-log in)
    setPendingAccount(newClient);
    setAuthMode('pending_notice');
    addToast('🎉 Permission request sent to Admin Panel! Awaiting admission.', 'success');
  };

  // Re-check Approval Status
  const handleCheckStatus = async () => {
    if (!pendingAccount) return;
    setIsCheckingStatus(true);

    const identifier = pendingAccount.username || pendingAccount.email;

    try {
      // 1. Try remote API check
      const res = await api.checkClientStatus(identifier);
      if (res && res.success && res.data) {
        if (res.data.status === 'approved') {
          setIsCheckingStatus(false);
          addToast('🎉 You have been admitted by the Super Admin!', 'success');
          completeLoginSession({
            ...pendingAccount,
            id: res.data.id || pendingAccount.id,
            status: 'approved',
          });
          return;
        } else if (res.data.status === 'rejected') {
          setIsCheckingStatus(false);
          addToast('Your access request was declined by the administrator.', 'error');
          return;
        }
      }
    } catch (e) {
      console.warn('Remote status check failed, checking local', e);
    }

    // 2. Check local storage
    const tenants = getTenants();
    const matched = tenants.find(t => t.username?.toLowerCase() === identifier.toLowerCase());

    setIsCheckingStatus(false);

    if (matched && matched.status === 'approved') {
      addToast('🎉 You have been admitted by the Super Admin!', 'success');
      completeLoginSession(matched);
    } else if (matched && matched.status === 'rejected') {
      addToast('Your access request was declined by the administrator.', 'error');
    } else {
      addToast('Still pending. The Super Admin has not admitted this request yet.', 'info');
    }
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
              Multi-Tenant SaaS &bull; Permission Gated
            </span>
          </div>
        </div>

        <ThemeToggleBtn />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto my-auto animate-fadeIn py-4">
        
        {/* VIEW 1: PENDING APPROVAL NOTICE SCREEN */}
        {authMode === 'pending_notice' && pendingAccount ? (
          <div className="bg-white dark:bg-[#121214] border border-amber-400/80 dark:border-amber-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 ring-4 ring-amber-500/10 animate-scaleUp">
            
            {/* Header Icon */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner relative">
                <Clock className="w-8 h-8 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-white dark:border-neutral-900"></span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                Permission Request Triggered
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                Awaiting Admin Admission
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto">
                Your registration for <strong className="text-neutral-900 dark:text-white font-bold">{pendingAccount.restaurantName || pendingAccount.restaurant_name}</strong> has been sent to the Super Admin.
              </p>
            </div>

            {/* Account Details Box */}
            <div className="bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Restaurant:</span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {pendingAccount.restaurantName || pendingAccount.restaurant_name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Owner Name:</span>
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  {pendingAccount.ownerName || pendingAccount.owner_name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Username:</span>
                <code className="px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 font-mono font-bold text-neutral-900 dark:text-white">
                  {pendingAccount.username}
                </code>
              </div>
              {pendingAccount.email && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Email:</span>
                  <span className="text-neutral-700 dark:text-neutral-300 truncate max-w-[200px]">
                    {pendingAccount.email}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-neutral-200/60 dark:border-neutral-800">
                <span className="text-neutral-500">Status:</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Pending Super Admin Review</span>
                </span>
              </div>
            </div>

            {/* Instruction Callout */}
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 text-center leading-normal">
              Once the Super Administrator clicks <strong>"Admit & Approve"</strong> in the Admin Panel, you will be able to log in immediately.
            </p>

            {/* Actions */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={isCheckingStatus}
                className="w-full py-3 px-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                <span>{isCheckingStatus ? 'Checking Status...' : 'Check Approval Status'}</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="w-full py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>

          </div>
        ) : (
          /* VIEW 2: SIGN IN / REGISTER FORM */
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
                  : 'Submit your restaurant details. Access is granted once admitted by admin.'}
              </p>
            </div>

            {/* Segmented Mode Switcher */}
            <div className="grid grid-cols-2 p-1 bg-neutral-100 dark:bg-neutral-900/80 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
                className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
                      placeholder="e.g. Maideen or client_username"
                      required
                      autoFocus
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white dark:bg-[#18181b] border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter account password"
                      required
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-white dark:bg-[#18181b] border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-neutral-900 dark:text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5 cursor-pointer"
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
                    <span>Permission Gated</span>
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
                      <span>Verifying Permissions...</span>
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
                    New client? <strong className="underline underline-offset-4 text-neutral-900 dark:text-white font-semibold">Request access / Register here →</strong>
                  </button>
                </div>

              </form>
            ) : (
              /* REGISTRATION FORM */
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

                {/* Email Address & Phone Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="contact@royal.com"
                        required
                        className="w-full pl-10 pr-3 py-2.5 text-xs bg-white dark:bg-[#18181b] border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-neutral-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Phone / WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full pl-10 pr-3 py-2.5 text-xs bg-white dark:bg-[#18181b] border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-neutral-900 dark:text-white"
                      />
                    </div>
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
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="Min 4 chars"
                      required
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-[#18181b] border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-neutral-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
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
                  <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Requires Admin Admission</span>
                  </span>
                </div>

                {/* Submit Register Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer pt-3 pb-3 mt-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Triggering Permission Request...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Request for Admin Admission</span>
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
                    Already registered? <strong className="underline underline-offset-4 text-neutral-900 dark:text-white font-semibold">Sign in here →</strong>
                  </button>
                </div>

              </form>
            )}

          </div>
        )}

      </div>

      {/* Bottom Footer Note */}
      <div className="w-full max-w-md mx-auto text-center py-2 text-[11px] text-neutral-400">
        Restaurant Management Suite &bull; Permission Gated SaaS &bull; Admin Admission Required
      </div>

    </div>
  );
}
