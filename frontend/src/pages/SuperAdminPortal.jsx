import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Store, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Users, 
  Building2, 
  Mail, 
  Phone, 
  Search, 
  RefreshCw, 
  Trash2, 
  Sparkles, 
  ShieldAlert, 
  ArrowRight, 
  ExternalLink, 
  Plus, 
  LogOut, 
  KeyRound, 
  Server, 
  Layers, 
  Activity, 
  Check, 
  ChevronRight,
  Database,
  ArrowUpRight,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import ThemeToggleBtn from '../components/ThemeToggleBtn';

export default function SuperAdminPortal({ onSwitchToRestaurant, onLogout }) {
  const { addToast } = useToast();

  // Active top navigation tab: 'requests' | 'tenants' | 'system'
  const [activeTab, setActiveTab] = useState('requests');

  // Filter within requests tab: 'pending' | 'approved' | 'rejected' | 'all'
  const [requestFilter, setRequestFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const lastPendingCountRef = React.useRef(null);

  // Play audio chime for new registrations
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (err) {
      console.warn('Audio chime note:', err);
    }
  };

  // Get local client requests
  const getLocalRequests = () => {
    try {
      const raw = localStorage.getItem('hms_client_requests');
      if (raw) return JSON.parse(raw);
      const tenantsRaw = localStorage.getItem('hms_registered_tenants');
      if (tenantsRaw) {
        const tenants = JSON.parse(tenantsRaw);
        return tenants.map(t => ({
          id: t.id || `req-${Date.now()}`,
          restaurant_name: t.restaurantName || t.restaurant_name || 'Restaurant',
          owner_name: t.ownerName || t.owner_name || 'Owner',
          username: t.username || 'client',
          email: t.email || '',
          phone: t.phone || '',
          status: t.status || (t.username?.toLowerCase() === 'admin' || t.username?.toLowerCase() === 'muhammad' || t.username?.toLowerCase() === 'maideen' ? 'approved' : 'pending'),
          created_at: t.createdAt || t.created_at || new Date().toISOString(),
          approved_at: t.approvedAt || t.approved_at || null,
        }));
      }
      return [];
    } catch {
      return [];
    }
  };

  const saveLocalRequests = (data) => {
    try {
      localStorage.setItem('hms_client_requests', JSON.stringify(data));
      // Sync to registered tenants so clients can log in when admitted
      const tenants = data.map(r => ({
        id: r.id,
        restaurantName: r.restaurant_name,
        ownerName: r.owner_name,
        username: r.username,
        email: r.email,
        phone: r.phone,
        status: r.status,
        role: 'admin',
        createdAt: r.created_at,
        approvedAt: r.approved_at,
      }));
      localStorage.setItem('hms_registered_tenants', JSON.stringify(tenants));
      window.dispatchEvent(new Event('hms_client_requests_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Failed to save client requests', err);
    }
  };

  const fetchRequests = async () => {
    let remoteData = null;

    try {
      const res = await api.getClientRequests();
      if (res && res.success && Array.isArray(res.data)) {
        remoteData = res.data;
        if (res.counts) setCounts(res.counts);
      }
    } catch (err) {
      // Backend offline or fallback to cache
    }

    const local = getLocalRequests();
    let merged = [];

    if (remoteData && remoteData.length > 0) {
      const map = new Map();
      remoteData.forEach(r => map.set(r.username.toLowerCase(), r));
      local.forEach(l => {
        if (!map.has(l.username.toLowerCase())) {
          map.set(l.username.toLowerCase(), l);
        }
      });
      merged = Array.from(map.values());
    } else {
      merged = local;
    }

    // Sort: pending first, then newest
    merged.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    setRequests(merged);
    saveLocalRequests(merged);

    const pendingCount = merged.filter(r => r.status === 'pending').length;
    const approvedCount = merged.filter(r => r.status === 'approved').length;
    const rejectedCount = merged.filter(r => r.status === 'rejected').length;

    // Detect new incoming pending registrations & notify Muhammad!
    if (lastPendingCountRef.current !== null && pendingCount > lastPendingCountRef.current) {
      playNotificationChime();
      addToast(`🔔 New store registration submitted! Waiting for your admission.`, 'warning');
    }
    lastPendingCountRef.current = pendingCount;

    setCounts({
      total: merged.length,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
    });

    setIsLoading(false);
  };

  useEffect(() => {
    fetchRequests();
    const handleSync = () => fetchRequests();
    window.addEventListener('hms_client_requests_updated', handleSync);
    window.addEventListener('storage', handleSync);
    
    // Poll every 6 seconds to capture new registrations in real time
    const pollInterval = setInterval(fetchRequests, 6000);

    return () => {
      window.removeEventListener('hms_client_requests_updated', handleSync);
      window.removeEventListener('storage', handleSync);
      clearInterval(pollInterval);
    };
  }, []);

  // One-Click Admit & Approve
  const handleApprove = async (client) => {
    setProcessingId(client.id);
    try {
      try {
        await api.approveClientRequest(client.id, 'Admitted by Super Admin Muhammad');
      } catch (e) {
        console.warn('API approve failed, caching locally', e);
      }

      const updated = requests.map(r => {
        if (r.id === client.id || (r.username && r.username.toLowerCase() === client.username.toLowerCase())) {
          return {
            ...r,
            status: 'approved',
            approved_at: new Date().toISOString(),
          };
        }
        return r;
      });

      setRequests(updated);
      saveLocalRequests(updated);
      addToast(`🎉 "${client.restaurant_name}" ADMITTED & APPROVED! They can now log in and open the store.`, 'success');
    } catch {
      addToast('Failed to admit store.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Decline / Reject Request
  const handleReject = async (client) => {
    if (!window.confirm(`Decline access request for "${client.restaurant_name}"? The user will NOT be able to open or work in the store.`)) return;
    setProcessingId(client.id);

    try {
      try {
        await api.rejectClientRequest(client.id, 'Declined by Administrator');
      } catch (e) {
        console.warn('API reject failed, caching locally', e);
      }

      const updated = requests.map(r => {
        if (r.id === client.id || (r.username && r.username.toLowerCase() === client.username.toLowerCase())) {
          return {
            ...r,
            status: 'rejected',
          };
        }
        return r;
      });

      setRequests(updated);
      saveLocalRequests(updated);
      addToast(`❌ Registration for "${client.restaurant_name}" REJECTED. Store access is blocked.`, 'error');
    } catch {
      addToast('Failed to decline request.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Revoke Access
  const handleRevoke = async (client) => {
    if (!window.confirm(`Revoke software access for "${client.restaurant_name}"? They will no longer be able to log in.`)) return;
    handleReject(client);
  };

  // Delete Record
  const handleDelete = async (client) => {
    if (!window.confirm(`Permanently delete registration for "${client.restaurant_name}"?`)) return;
    setProcessingId(client.id);

    try {
      try {
        await api.deleteClientRequest(client.id);
      } catch (e) {}

      const updated = requests.filter(r => r.id !== client.id && r.username !== client.username);
      setRequests(updated);
      saveLocalRequests(updated);
      addToast('Record deleted.', 'info');
    } catch {
      addToast('Failed to delete record.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Simulate Test Client Registration
  const handleSimulateRequest = () => {
    const num = Math.floor(100 + Math.random() * 900);
    const testClient = {
      id: `req-${Date.now()}`,
      restaurant_name: `BIRYANI PALACE #${num}`,
      owner_name: `Tariq Mansoor`,
      username: `client${num}`,
      email: `tariq${num}@gmail.com`,
      phone: `+91 94441 55${num.toString().slice(0, 3)}`,
      password: 'clientpassword',
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const updated = [testClient, ...requests];
    setRequests(updated);
    saveLocalRequests(updated);

    api.registerClient({
      restaurant_name: testClient.restaurant_name,
      owner_name: testClient.owner_name,
      username: testClient.username,
      email: testClient.email,
      phone: testClient.phone,
      password: testClient.password,
    }).catch(() => {});

    setRequestFilter('pending');
    setActiveTab('requests');
    addToast(`✨ Test registration created for "${testClient.restaurant_name}"! Click "Admit & Approve" to test.`, 'success');
  };

  // Filter requests
  const filteredRequests = requests.filter(r => {
    const matchesFilter = requestFilter === 'all' || r.status === requestFilter;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesFilter;

    const matchesSearch = 
      (r.restaurant_name && r.restaurant_name.toLowerCase().includes(q)) ||
      (r.owner_name && r.owner_name.toLowerCase().includes(q)) ||
      (r.username && r.username.toLowerCase().includes(q)) ||
      (r.email && r.email.toLowerCase().includes(q)) ||
      (r.phone && r.phone.toLowerCase().includes(q));

    return matchesFilter && matchesSearch;
  });

  // Approved Tenants Directory list
  const approvedTenants = requests.filter(r => r.status === 'approved' && r.username?.toLowerCase() !== 'admin' && r.username?.toLowerCase() !== 'maideen');

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#070709] text-neutral-900 dark:text-neutral-100 font-sans antialiased flex flex-col selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      
      {/* TOP MASTER ADMIN NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0d0d10]/90 backdrop-blur-md border-b border-neutral-200/90 dark:border-neutral-800/90 px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left Brand Emblem */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center font-black shadow-md">
              <ShieldCheck className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-tight text-neutral-900 dark:text-white">
                  AL RIZQ PLATFORM
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/50">
                  Super Admin
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 font-medium block">
                Multi-Tenant Cloud Control Console
              </span>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <div className="hidden md:flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-900/90 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'requests'
                  ? 'bg-white dark:bg-[#18181b] text-neutral-900 dark:text-white shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Admission Desk</span>
              {counts.pending > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-neutral-950 text-[10px] font-black animate-pulse">
                  {counts.pending}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tenants')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'tenants'
                  ? 'bg-white dark:bg-[#18181b] text-neutral-900 dark:text-white shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Active Restaurants</span>
              <span className="text-[10px] font-mono text-neutral-400">({approvedTenants.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('system')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'system'
                  ? 'bg-white dark:bg-[#18181b] text-neutral-900 dark:text-white shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>System & Cloud</span>
            </button>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2.5">
            
            {/* Quick Button to Launch Restaurant POS */}
            <button
              type="button"
              onClick={onSwitchToRestaurant}
              className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-102"
              title="Switch to Restaurant Operations & POS Suite"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Launch Restaurant POS</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            <ThemeToggleBtn />

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-neutral-200 dark:border-neutral-800">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-neutral-950 font-black text-xs flex items-center justify-center shadow-xs">
                M
              </div>
              <div className="hidden lg:block text-left leading-none">
                <span className="text-xs font-bold block text-neutral-900 dark:text-white">Muhammad</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Super Admin</span>
              </div>
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden items-center justify-between gap-1 mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'requests' ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'text-neutral-500'}`}
          >
            <span>Admission Desk</span>
            {counts.pending > 0 && <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-neutral-950 text-[9px]">{counts.pending}</span>}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tenants')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'tenants' ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'text-neutral-500'}`}
          >
            Active Restaurants ({approvedTenants.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'system' ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'text-neutral-500'}`}
          >
            System & Cloud
          </button>
        </div>

      </header>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-fadeIn">
        
        {/* VIEW 1: ADMISSION DESK (CLIENT REQUESTS) */}
        {activeTab === 'requests' && (
          <div className="space-y-6">

            {/* PROMINENT LIVE PENDING NOTIFICATION BANNER */}
            {counts.pending > 0 && (
              <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/15 to-amber-500/5 border-2 border-amber-500/60 dark:border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg ring-4 ring-amber-500/10">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500 text-neutral-950 font-black flex items-center justify-center shrink-0 shadow-md">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-neutral-950">
                        Immediate Action Required
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
                        {counts.pending} Store{counts.pending > 1 ? 's' : ''} Waiting
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-amber-950 dark:text-amber-100 mt-1">
                      New Store Registrations Waiting for Muhammad's Approval
                    </h3>
                    <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-0.5">
                      Until you click <strong>Admit & Approve</strong>, the user cannot log in or work in their store. If you click <strong>Decline</strong>, the store will not open.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRequestFilter('pending')}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs transition-all shadow-md shrink-0 cursor-pointer flex items-center gap-2"
                >
                  <span>Review Pending Stores</span>
                  <span className="w-5 h-5 rounded-full bg-neutral-950 text-amber-400 text-[10px] flex items-center justify-center font-bold">
                    {counts.pending}
                  </span>
                </button>
              </div>
            )}
            
            {/* Super Admin Hero Banner */}
            <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-neutral-800">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md mb-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Client Admission Control</span>
                    {counts.pending > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-black text-[10px] animate-pulse">
                        {counts.pending} Pending Action
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                    Client Access Requests
                  </h1>
                  <p className="text-neutral-300 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
                    Review and admit incoming restaurant registrations. Clients cannot access or use the POS system until you click <strong>Admit & Approve</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSimulateRequest}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer backdrop-blur-md hover:scale-102"
                    title="Simulate a new incoming client registration request to test the admission flow"
                  >
                    <Plus className="w-4 h-4 text-amber-300" />
                    <span>Simulate Client Request</span>
                  </button>

                  <button
                    type="button"
                    onClick={fetchRequests}
                    disabled={isLoading}
                    className="px-4 py-2.5 rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Decorative Glow */}
              <div className="absolute right-0 bottom-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute left-1/2 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              
              <button
                type="button"
                onClick={() => setRequestFilter('pending')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  requestFilter === 'pending'
                    ? 'bg-amber-500/10 border-amber-500/50 dark:bg-amber-500/15 ring-2 ring-amber-500/20 shadow-sm'
                    : 'bg-white dark:bg-[#121214] border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Pending Admission</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black mt-2 text-neutral-900 dark:text-white flex items-center gap-2">
                  <span>{counts.pending}</span>
                  {counts.pending > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />}
                </div>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1 block">
                  {counts.pending === 1 ? '1 client waiting for you' : `${counts.pending} clients waiting for you`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRequestFilter('approved')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  requestFilter === 'approved'
                    ? 'bg-emerald-500/10 border-emerald-500/50 dark:bg-emerald-500/15 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'bg-white dark:bg-[#121214] border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Admitted & Active</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black mt-2 text-neutral-900 dark:text-white">
                  {counts.approved}
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
                  Active restaurant portals
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRequestFilter('rejected')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  requestFilter === 'rejected'
                    ? 'bg-rose-500/10 border-rose-500/50 dark:bg-rose-500/15 ring-2 ring-rose-500/20 shadow-sm'
                    : 'bg-white dark:bg-[#121214] border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Declined Requests</span>
                  <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <XCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black mt-2 text-neutral-900 dark:text-white">
                  {counts.rejected}
                </div>
                <span className="text-[11px] text-neutral-400 font-medium mt-1 block">
                  Access blocked
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRequestFilter('all')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  requestFilter === 'all'
                    ? 'bg-neutral-900/10 border-neutral-900/40 dark:bg-white/10 ring-2 ring-neutral-400/20 shadow-sm'
                    : 'bg-white dark:bg-[#121214] border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total Requests</span>
                  <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black mt-2 text-neutral-900 dark:text-white">
                  {counts.total}
                </div>
                <span className="text-[11px] text-neutral-400 font-medium mt-1 block">
                  All tenant registrations
                </span>
              </button>

            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
              
              <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-900/80 rounded-xl overflow-x-auto">
                {[
                  { id: 'pending', label: 'Pending Admission', count: counts.pending, dot: true },
                  { id: 'approved', label: 'Admitted / Active', count: counts.approved },
                  { id: 'rejected', label: 'Declined', count: counts.rejected },
                  { id: 'all', label: 'All Records', count: counts.total },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRequestFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                      requestFilter === tab.id
                        ? 'bg-white dark:bg-[#1c1c20] text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                    }`}
                  >
                    {tab.dot && tab.count > 0 && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      requestFilter === tab.id ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white' : 'bg-neutral-200/60 dark:bg-neutral-800 text-neutral-500'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by restaurant, owner, phone, email..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                />
              </div>

            </div>

            {/* Client Requests List */}
            {isLoading ? (
              <div className="py-24 text-center bg-white dark:bg-[#121214] rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium text-neutral-500">Loading admission desk...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-20 text-center bg-white dark:bg-[#121214] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
                  <UserCheck className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {requestFilter === 'pending' ? 'No Pending Client Requests' : 'No Records Found'}
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  {requestFilter === 'pending' 
                    ? 'All incoming client registrations have been processed. New requests will appear here for your approval.'
                    : 'No requests match your current search and filter settings.'}
                </p>
                {requestFilter === 'pending' && (
                  <button
                    type="button"
                    onClick={handleSimulateRequest}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold hover:scale-102 transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Simulate Incoming Client Registration</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredRequests.map(client => {
                  const isPending = client.status === 'pending';
                  const isApproved = client.status === 'approved';
                  const isRejected = client.status === 'rejected';
                  const isProcessing = processingId === client.id;
                  const isMaster = client.username?.toLowerCase() === 'maideen' || client.username?.toLowerCase() === 'admin';

                  return (
                    <div 
                      key={client.id || client.username}
                      className={`bg-white dark:bg-[#121214] border rounded-2xl p-5 transition-all shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                        isPending 
                          ? 'border-amber-400/80 dark:border-amber-500/50 ring-2 ring-amber-500/10' 
                          : isApproved
                          ? 'border-emerald-300/60 dark:border-emerald-500/30'
                          : 'border-neutral-200 dark:border-neutral-800 opacity-80'
                      }`}
                    >
                      
                      {/* Left: Client & Business Identity */}
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                          isPending 
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300' 
                            : isApproved 
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300' 
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                        }`}>
                          <Store className="w-7 h-7" />
                        </div>

                        <div className="min-w-0 space-y-1.5">
                          
                          {/* Business Name & Status Pill */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white truncate">
                              {client.restaurant_name}
                            </h3>

                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Pending Admission
                              </span>
                            )}

                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                Admitted & Active
                              </span>
                            )}

                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300/60">
                                <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                Access Declined
                              </span>
                            )}
                          </div>

                          {/* Owner & Username Credentials */}
                          <div className="flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-300 flex-wrap">
                            <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1">
                              <span>Owner:</span>
                              <strong className="underline underline-offset-2">{client.owner_name}</strong>
                            </span>

                            <span className="text-neutral-300 dark:text-neutral-700">•</span>

                            <div className="flex items-center gap-1">
                              <KeyRound className="w-3.5 h-3.5 text-neutral-400" />
                              <span>Login Username:</span>
                              <code className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 font-mono font-bold text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700">
                                {client.username}
                              </code>
                            </div>
                          </div>

                          {/* Contact Details & Request Time */}
                          <div className="flex items-center gap-3.5 text-[11px] text-neutral-500 dark:text-neutral-400 pt-0.5 flex-wrap">
                            {client.email && (
                              <a
                                href={`mailto:${client.email}`}
                                className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white transition-colors"
                              >
                                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                                <span>{client.email}</span>
                              </a>
                            )}

                            {client.phone && (
                              <>
                                <span className="text-neutral-300 dark:text-neutral-700">•</span>
                                <a
                                  href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                                  title="Chat on WhatsApp"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>{client.phone}</span>
                                </a>
                              </>
                            )}

                            <span className="text-neutral-300 dark:text-neutral-700">•</span>

                            <div className="flex items-center gap-1 text-neutral-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {client.created_at ? new Date(client.created_at).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                }) : 'Recently'}
                              </span>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Right: Admission Decision Controls */}
                      <div className="flex items-center gap-2 w-full lg:w-auto justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-neutral-100 dark:border-neutral-800">
                        
                        {/* ADMIT BUTTON */}
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleApprove(client)}
                            disabled={isProcessing}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 hover:scale-103 cursor-pointer disabled:opacity-50"
                            title="Admit client: Grants full software login access"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Admit & Approve</span>
                          </button>
                        )}

                        {/* DECLINE BUTTON */}
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleReject(client)}
                            disabled={isProcessing}
                            className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-rose-50 text-neutral-700 hover:text-rose-600 dark:bg-neutral-800 dark:hover:bg-rose-950/40 dark:text-neutral-300 dark:hover:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                            title="Decline this registration request"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Decline</span>
                          </button>
                        )}

                        {/* RE-ADMIT (if declined) */}
                        {isRejected && (
                          <button
                            type="button"
                            onClick={() => handleApprove(client)}
                            disabled={isProcessing}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Re-Admit Client</span>
                          </button>
                        )}

                        {/* REVOKE ACCESS (if currently approved) */}
                        {isApproved && !isMaster && (
                          <button
                            type="button"
                            onClick={() => handleRevoke(client)}
                            disabled={isProcessing}
                            className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-amber-50 text-neutral-600 hover:text-amber-700 dark:bg-neutral-800 dark:hover:bg-amber-950/40 dark:text-neutral-400 dark:hover:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                            title="Revoke software access"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Revoke Access</span>
                          </button>
                        )}

                        {/* DELETE */}
                        {!isMaster && (
                          <button
                            type="button"
                            onClick={() => handleDelete(client)}
                            disabled={isProcessing}
                            className="p-2.5 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
                            title="Permanently delete registration"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* VIEW 2: ACTIVE TENANTS DIRECTORY */}
        {activeTab === 'tenants' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                  Active Restaurant Portals
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Directory of all onboarded restaurants and cafes currently running on the software.
                </p>
              </div>

              <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                Total Admitted: {approvedTenants.length}
              </div>
            </div>

            {approvedTenants.length === 0 ? (
              <div className="py-20 text-center bg-white dark:bg-[#121214] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-2">
                <Store className="w-10 h-10 text-neutral-400 mx-auto" />
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">No External Clients Admitted Yet</h4>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  When new restaurants register and you click "Admit & Approve" in the Admission Desk, their active workspaces will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedTenants.map(t => (
                  <div
                    key={t.id || t.username}
                    className="bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold">
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white">{t.restaurant_name}</h4>
                          <span className="text-[11px] text-neutral-500">Owner: {t.owner_name}</span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/50">
                        Active
                      </span>
                    </div>

                    <div className="bg-neutral-50 dark:bg-neutral-900/60 rounded-xl p-3 text-xs space-y-1.5 font-mono">
                      <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                        <span>Username:</span>
                        <strong className="text-neutral-900 dark:text-white">{t.username}</strong>
                      </div>
                      {t.phone && (
                        <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                          <span>Phone:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t.phone}</span>
                        </div>
                      )}
                      {t.email && (
                        <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 truncate">
                          <span>Email:</span>
                          <span className="text-neutral-900 dark:text-white truncate max-w-[150px]">{t.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                      <span className="text-[10px] text-neutral-400">
                        Admitted: {t.approved_at ? new Date(t.approved_at).toLocaleDateString() : 'Active'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRevoke(t)}
                        className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                      >
                        Revoke Access
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* VIEW 3: SYSTEM & CLOUD ARCHITECTURE */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                Platform Architecture & Endpoints
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Super Admin diagnostics and deployment infrastructure overview.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Backend Docker API</h4>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Render Cloud Active
                    </span>
                  </div>
                </div>
                <code className="text-[11px] block bg-neutral-100 dark:bg-neutral-800 p-2 rounded-lg text-neutral-600 dark:text-neutral-300 break-all font-mono">
                  https://hms-03yd.onrender.com/api
                </code>
              </div>

              <div className="bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Frontend Web Client</h4>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Vercel Edge Active
                    </span>
                  </div>
                </div>
                <code className="text-[11px] block bg-neutral-100 dark:bg-neutral-800 p-2 rounded-lg text-neutral-600 dark:text-neutral-300 break-all font-mono">
                  https://hms-alrizq.vercel.app
                </code>
              </div>

              <div className="bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Database Engine</h4>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Multi-Tenant Isolation
                    </span>
                  </div>
                </div>
                <code className="text-[11px] block bg-neutral-100 dark:bg-neutral-800 p-2 rounded-lg text-neutral-600 dark:text-neutral-300 break-all font-mono">
                  SQLite / MySQL Persistent
                </code>
              </div>

            </div>

          </div>
        )}

      </main>

    </div>
  );
}
