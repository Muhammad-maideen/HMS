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
  CheckCircle2,
  UtensilsCrossed
} from 'lucide-react';
import { setRole } from '../services/api';
import { useToast } from '../context/ToastContext';
import ThemeToggleBtn from '../components/ThemeToggleBtn';

export default function LoginPage({ onLoginSuccess }) {
  const { addToast } = useToast();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Quick-fill credentials for easy role access
  const demoAccounts = [
    { label: 'Admin', user: 'admin', pass: 'admin123', role: 'admin', desc: 'Full System Control' },
    { label: 'Manager', user: 'manager', pass: 'manager123', role: 'manager', desc: 'Menu & Stock Admin' },
    { label: 'Cashier', user: 'cashier', pass: 'cashier123', role: 'cashier', desc: 'POS Orders & Billing' },
  ];

  const handleQuickFill = (acc) => {
    setUsername(acc.user);
    setPassword(acc.pass);
    addToast(`Filled credentials for ${acc.label}`, 'info');
  };

  const handleLogin = (e) => {
    if (e) e.preventDefault();

    if (!username.trim()) {
      addToast('Please enter your username or email', 'error');
      return;
    }

    if (!password) {
      addToast('Please enter your password', 'error');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Determine role from username or default to admin
      let userRole = 'admin';
      const cleanUser = username.trim().toLowerCase();
      if (cleanUser.includes('cashier')) {
        userRole = 'cashier';
      } else if (cleanUser.includes('manager')) {
        userRole = 'manager';
      } else if (cleanUser.includes('kitchen')) {
        userRole = 'kitchen';
      }

      const sessionData = {
        username: username.trim(),
        role: userRole,
        loginTime: new Date().toISOString(),
      };

      // Save session
      localStorage.setItem('hms_is_authenticated', 'true');
      localStorage.setItem('hms_auth_user', JSON.stringify(sessionData));
      setRole(userRole);

      setIsLoading(false);
      addToast(`Welcome, ${username.trim()}! Software unlocked.`, 'success');

      if (onLoginSuccess) {
        onLoginSuccess(sessionData);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-[#fafafa] dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200 font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      
      {/* Top Bar with Theme Toggle */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black shadow-xs">
            <UtensilsCrossed className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-tight text-neutral-900 dark:text-white block leading-none">
              RESTAURANT POS & RMS
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              Enterprise Suite v2.0
            </span>
          </div>
        </div>

        <ThemeToggleBtn />
      </div>

      {/* Center Login Card Container */}
      <div className="w-full max-w-md mx-auto my-auto animate-fadeIn">
        <div className="bg-white dark:bg-[#121214] border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          
          {/* Card Header */}
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <KeyRound className="w-5 h-5 text-neutral-900 dark:text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Sign In to Software
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Enter your credentials to unlock terminal & management modules
            </p>
          </div>

          {/* Quick Demo Switcher */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block text-center">
              Quick One-Click Demo Logins
            </span>
            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickFill(acc)}
                  className={`p-2 rounded-lg border text-xs font-semibold transition-all text-center ${
                    username === acc.user
                      ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                  }`}
                >
                  <div className="font-bold text-[11px]">{acc.label}</div>
                  <div className="text-[9px] opacity-70 font-mono">/{acc.user}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Username / Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Username or Staff ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin, manager, cashier..."
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
                <span className="text-[10px] text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer">
                  Default: any password
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your security password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-white dark:bg-[#18181b] border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-neutral-900 dark:text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-600 dark:text-neutral-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-black focus:ring-black"
                />
                <span>Keep software session active</span>
              </label>

              <span className="text-neutral-400 text-[11px] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>SSL Encrypted</span>
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-black rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer pt-3 pb-3"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin"></span>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Open Software</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>

          </form>

        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="w-full max-w-md mx-auto text-center py-2 text-[11px] text-neutral-400">
        Restaurant Management Suite &bull; POS &bull; Menu Catalog &bull; Audit Invoices
      </div>

    </div>
  );
}
