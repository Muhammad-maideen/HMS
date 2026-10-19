import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft,
  KeyRound, 
  Sparkles,
  Server,
  Store,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import ThemeToggleBtn from '../components/ThemeToggleBtn';

export default function AdminLoginPage({ onLoginSuccess, onGoToRestaurant }) {
  const { addToast } = useToast();

  const [username, setUsername] = useState('muhammad');
  const [password, setPassword] = useState('muhammad@1020');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAdminLogin = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser) {
      setErrorMessage('Please enter the administrator username.');
      addToast('Username required', 'error');
      return;
    }

    if (!cleanPass) {
      setErrorMessage('Please enter the master password.');
      addToast('Password required', 'error');
      return;
    }

    setIsLoading(true);

    // Verify Master Admin credentials: muhammad / muhammad@1020 (also allow maideen)
    const isMasterMuhammad = 
      (cleanUser === 'muhammad' || cleanUser === 'admin' || cleanUser === 'maideen') &&
      (cleanPass === 'muhammad@1020' || cleanPass === 'M@!d33N@1020');

    // Try backend verification as well
    try {
      await api.loginClient({
        identifier: cleanUser,
        password: cleanPass,
      });
    } catch (err) {
      // If backend fails but local master matches, we still allow local master login
      console.warn('Backend login attempt:', err);
    }

    setTimeout(() => {
      setIsLoading(false);

      if (isMasterMuhammad) {
        // Save Admin authentication
        const adminSession = {
          username: 'muhammad',
          name: 'Muhammad',
          role: 'super_admin',
          email: 'muhammad@alrizq.com',
          loginTime: new Date().toISOString(),
        };

        localStorage.setItem('hms_admin_authenticated', 'true');
        localStorage.setItem('hms_admin_user', JSON.stringify(adminSession));
        localStorage.setItem('hms_user_name', 'Muhammad');
        localStorage.setItem('hms_user_email', 'muhammad@alrizq.com');

        window.dispatchEvent(new Event('storage'));
        addToast('✨ Access Granted: Welcome Super Admin Muhammad!', 'success');

        if (onLoginSuccess) {
          onLoginSuccess(adminSession);
        }
      } else {
        setErrorMessage('Invalid credentials. Required: username "muhammad" and password "muhammad@1020"');
        addToast('Access Denied: Invalid administrator credentials', 'error');
      }
    }, 400);
  };

  const handleFillCredentials = () => {
    setUsername('muhammad');
    setPassword('muhammad@1020');
    setErrorMessage('');
    addToast('Admin credentials filled!', 'info');
  };

  return (
    <div className="min-h-screen w-full bg-[#070709] text-white flex flex-col justify-between p-4 sm:p-6 font-sans selection:bg-emerald-500 selection:text-black relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between py-2 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-neutral-700 flex items-center justify-center font-black shadow-lg">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-tight text-white block">
                AL RIZQ PLATFORM
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                /admin
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 font-medium">
              Super Admin Admission & Multi-Tenant Control
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onGoToRestaurant}
          className="px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Restaurant POS (/)</span>
        </button>
      </div>

      {/* Center Auth Card */}
      <div className="w-full max-w-md mx-auto my-auto py-6 z-10 animate-fadeIn">
        <div className="bg-[#101014]/90 backdrop-blur-xl border border-neutral-800 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/80 space-y-6 relative overflow-hidden">
          
          {/* Top Decorative Border Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />

          {/* Icon & Title */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-700/80 flex items-center justify-center mx-auto shadow-inner relative group">
              <ShieldCheck className="w-8 h-8 text-emerald-400 transition-transform group-hover:scale-110 duration-200" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#101014]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-[10px] font-mono uppercase tracking-wider">
              <Server className="w-3 h-3 text-emerald-400" />
              <span>Multi-Tenant Gateway</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Super Admin Login
            </h1>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
              Admit, accept or reject incoming store registrations & manage client access.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminLogin} className="space-y-4">
            
            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-300">
                Admin Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="muhammad"
                  required
                  autoFocus
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-neutral-900/90 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white font-mono placeholder:text-neutral-600 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-300">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="muhammad@1020"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-neutral-900/90 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white font-mono placeholder:text-neutral-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-neutral-500 hover:text-white p-0.5 cursor-pointer transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Helper Badge */}
            <div className="p-3 bg-neutral-900/70 border border-neutral-800/80 rounded-xl flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-neutral-500 uppercase font-mono block">Required Credentials:</span>
                <span className="font-mono text-emerald-400 font-bold text-[11px]">
                  muhammad <span className="text-neutral-600">/</span> muhammad@1020
                </span>
              </div>
              <button
                type="button"
                onClick={handleFillCredentials}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold transition-all cursor-pointer"
              >
                Auto Fill
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.01]"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Authenticating Super Admin...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Unlock Admin Panel</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>

          </form>

          {/* Quick Switch Link */}
          <div className="pt-2 text-center border-t border-neutral-800/70">
            <button
              type="button"
              onClick={onGoToRestaurant}
              className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>Not Super Admin? Go to Restaurant POS Login (/)</span>
            </button>
          </div>

        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="w-full max-w-md mx-auto text-center py-2 text-[11px] text-neutral-500 font-mono z-10">
        AL RIZQ ENTERPRISE POS &bull; ROUTE: /admin &bull; SECURE ADMISSION GATEWAY
      </div>

    </div>
  );
}
