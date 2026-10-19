import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight,
  KeyRound, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import ThemeToggleBtn from '../components/ThemeToggleBtn';

export default function AdminLoginPage({ onLoginSuccess, onGoToRestaurant }) {
  const { addToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
        setErrorMessage('Invalid credentials. Please enter the correct admin username and password.');
        addToast('Access Denied: Invalid administrator credentials', 'error');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-[#070709] text-white flex flex-col justify-center items-center p-4 sm:p-6 font-sans selection:bg-emerald-500 selection:text-black relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Center Auth Card */}
      <div className="w-full max-w-md mx-auto z-10 animate-fadeIn">
        <div className="bg-[#101014]/90 backdrop-blur-xl border border-neutral-800 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/80 space-y-6 relative overflow-hidden">
          
          {/* Icon & Title */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-700/80 flex items-center justify-center mx-auto shadow-inner relative group">
              <ShieldCheck className="w-8 h-8 text-emerald-400 transition-transform group-hover:scale-110 duration-200" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#101014]" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Super Admin Login
            </h1>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminLogin} className="space-y-4" autoComplete="off">
            
            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-300">
                Admin Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="admin_username"
                  id="admin_username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Enter admin username"
                  required
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck="false"
                  data-lpignore="true"
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
                  name="admin_secret_pass"
                  id="admin_secret_pass"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Enter admin password"
                  required
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck="false"
                  data-lpignore="true"
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

        </div>
      </div>

    </div>
  );
}
