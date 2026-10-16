import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Search, 
  RefreshCw, 
  Trash2, 
  Sparkles, 
  Store, 
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Plus,
  Calendar,
  Lock,
  KeyRound
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ClientRequestsPage() {
  const { addToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [processingId, setProcessingId] = useState(null);

  // Sync with localStorage cache & fallback
  const getLocalRequests = () => {
    try {
      const raw = localStorage.getItem('hms_client_requests');
      if (raw) return JSON.parse(raw);
      // Migrate from registered tenants if exists
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
          status: t.status || (t.username === 'admin' ? 'approved' : 'pending'),
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
      // Also sync to hms_registered_tenants so LoginPage can authenticate approved clients
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
      console.error('Failed to save local client requests', err);
    }
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    let remoteData = null;

    try {
      const res = await api.getClientRequests();
      if (res && res.success && Array.isArray(res.data)) {
        remoteData = res.data;
        if (res.counts) {
          setCounts(res.counts);
        }
      }
    } catch (err) {
      console.warn('Backend API request failed, using local storage cache', err);
    }

    // Merge remote and local storage to prevent data loss
    const local = getLocalRequests();
    let merged = [];

    if (remoteData && remoteData.length > 0) {
      // Map remote by username or id
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

    // Sort: pending first, then by date descending
    merged.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    setRequests(merged);
    saveLocalRequests(merged);

    // Compute counts
    const pendingCount = merged.filter(r => r.status === 'pending').length;
    const approvedCount = merged.filter(r => r.status === 'approved').length;
    const rejectedCount = merged.filter(r => r.status === 'rejected').length;
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
    return () => window.removeEventListener('hms_client_requests_updated', handleSync);
  }, []);

  // Handle Admit / Approve
  const handleApprove = async (client) => {
    setProcessingId(client.id);
    try {
      // Try backend API first
      try {
        await api.approveClientRequest(client.id, 'Admitted by Super Admin');
      } catch (e) {
        console.warn('API approve failed, applying locally', e);
      }

      // Update in local state and cache
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
      addToast(`🎉 Client "${client.restaurant_name}" is now ADMITTED! They can now log in.`, 'success');
    } catch (err) {
      addToast('Failed to admit client. Please try again.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Reject / Decline
  const handleReject = async (client) => {
    if (!window.confirm(`Decline access for "${client.restaurant_name}"?`)) return;
    setProcessingId(client.id);

    try {
      try {
        await api.rejectClientRequest(client.id, 'Declined by Administrator');
      } catch (e) {
        console.warn('API reject failed, applying locally', e);
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
      addToast(`Access request for "${client.restaurant_name}" was declined.`, 'info');
    } catch (err) {
      addToast('Failed to reject client request.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Revoke
  const handleRevoke = async (client) => {
    if (!window.confirm(`Revoke software access for "${client.restaurant_name}"? They will no longer be able to sign in.`)) return;
    handleReject(client);
  };

  // Handle Delete
  const handleDelete = async (client) => {
    if (!window.confirm(`Permanently delete registration request for "${client.restaurant_name}"?`)) return;
    setProcessingId(client.id);

    try {
      try {
        await api.deleteClientRequest(client.id);
      } catch (e) {
        console.warn('API delete failed, applying locally', e);
      }

      const updated = requests.filter(r => r.id !== client.id && r.username !== client.username);
      setRequests(updated);
      saveLocalRequests(updated);
      addToast(`Registration record deleted.`, 'info');
    } catch (err) {
      addToast('Failed to delete request.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Seed sample test request for quick demonstration
  const handleCreateTestRequest = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const testClient = {
      id: `req-${Date.now()}`,
      restaurant_name: `BIRYANI EXPRESS #${randomNum}`,
      owner_name: `Mohammed Ashik`,
      username: `client${randomNum}`,
      email: `ashik${randomNum}@gmail.com`,
      phone: `+91 98765 43${randomNum.toString().slice(0, 3)}`,
      password: 'password123',
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const updated = [testClient, ...requests];
    setRequests(updated);
    saveLocalRequests(updated);

    // Also attempt sending to backend
    api.registerClient({
      restaurant_name: testClient.restaurant_name,
      owner_name: testClient.owner_name,
      username: testClient.username,
      email: testClient.email,
      phone: testClient.phone,
      password: testClient.password,
    }).catch(() => {});

    setActiveTab('pending');
    addToast(`✨ Created sample client request for "${testClient.restaurant_name}"! Click "Admit & Approve" to test.`, 'success');
  };

  // Filtered list
  const filteredRequests = requests.filter(r => {
    const matchesTab = activeTab === 'all' || r.status === activeTab;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesTab;

    const matchesSearch = 
      (r.restaurant_name && r.restaurant_name.toLowerCase().includes(q)) ||
      (r.owner_name && r.owner_name.toLowerCase().includes(q)) ||
      (r.username && r.username.toLowerCase().includes(q)) ||
      (r.email && r.email.toLowerCase().includes(q)) ||
      (r.phone && r.phone.toLowerCase().includes(q));

    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn font-sans">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-950 dark:from-neutral-900 dark:via-neutral-950 dark:to-black rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Multi-Tenant Permission System</span>
              {counts.pending > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-neutral-950 font-black text-[10px] animate-pulse">
                  {counts.pending} Action Needed
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Client Permission Requests
            </h1>
            <p className="text-neutral-300 text-xs sm:text-sm mt-1 max-w-2xl">
              When a new client registers for this software, a permission request is sent here. Once you <strong>Admit</strong> them, they can log in and use the software.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleCreateTestRequest}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer backdrop-blur-md"
              title="Generate a simulation client request to test the admission flow"
            >
              <Plus className="w-3.5 h-3.5 text-amber-300" />
              <span>Simulate Client Request</span>
            </button>

            <button
              type="button"
              onClick={fetchRequests}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-white text-neutral-900 hover:bg-neutral-100 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -top-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Pending Card */}
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-500/10 border-amber-500/40 dark:bg-amber-500/15 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Pending Admission
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black mt-2 text-neutral-900 dark:text-white flex items-center gap-2">
            <span>{counts.pending}</span>
            {counts.pending > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1 block">
            {counts.pending === 1 ? '1 client waiting' : `${counts.pending} clients waiting`}
          </span>
        </button>

        {/* Approved Card */}
        <button
          type="button"
          onClick={() => setActiveTab('approved')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'approved'
              ? 'bg-emerald-500/10 border-emerald-500/40 dark:bg-emerald-500/15 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Admitted & Active
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black mt-2 text-neutral-900 dark:text-white">
            {counts.approved}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
            Can sign in & use POS
          </span>
        </button>

        {/* Declined Card */}
        <button
          type="button"
          onClick={() => setActiveTab('rejected')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'rejected'
              ? 'bg-rose-500/10 border-rose-500/40 dark:bg-rose-500/15 ring-2 ring-rose-500/20'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Declined Requests
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black mt-2 text-neutral-900 dark:text-white">
            {counts.rejected}
          </div>
          <span className="text-[11px] text-neutral-400 font-medium mt-1 block">
            Access denied
          </span>
        </button>

        {/* Total Card */}
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-neutral-900/10 border-neutral-900/40 dark:bg-white/10 ring-2 ring-neutral-400/20'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Total Requests
            </span>
            <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black mt-2 text-neutral-900 dark:text-white">
            {counts.total}
          </div>
          <span className="text-[11px] text-neutral-400 font-medium mt-1 block">
            All registered tenants
          </span>
        </button>

      </div>

      {/* Control Bar: Filter Tabs & Search */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl overflow-x-auto">
          {[
            { id: 'pending', label: 'Pending Admission', count: counts.pending, dot: true },
            { id: 'approved', label: 'Admitted / Active', count: counts.approved },
            { id: 'rejected', label: 'Declined', count: counts.rejected },
            { id: 'all', label: 'All Requests', count: counts.total },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              {tab.dot && tab.count > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              )}
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === tab.id
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                  : 'bg-neutral-200/60 dark:bg-neutral-700/60 text-neutral-600 dark:text-neutral-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by restaurant, owner, email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all"
          />
        </div>

      </div>

      {/* Requests Content List */}
      {isLoading ? (
        <div className="py-20 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-neutral-500">Checking client permission requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
            <Store className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            {activeTab === 'pending' ? 'No Pending Requests' : 'No Client Requests Found'}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
            {activeTab === 'pending' 
              ? 'All client requests have been processed! New registrations will appear here for your admission.'
              : 'There are currently no records matching this filter.'}
          </p>
          {activeTab === 'pending' && (
            <button
              type="button"
              onClick={handleCreateTestRequest}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold hover:scale-102 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simulate Client Registration</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredRequests.map(client => {
            const isPending = client.status === 'pending';
            const isApproved = client.status === 'approved';
            const isRejected = client.status === 'rejected';
            const isThisProcessing = processingId === client.id;

            return (
              <div 
                key={client.id || client.username}
                className={`bg-white dark:bg-neutral-900 border rounded-2xl p-4 sm:p-5 transition-all shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                  isPending 
                    ? 'border-amber-400/60 dark:border-amber-500/40 ring-2 ring-amber-500/10' 
                    : isApproved
                    ? 'border-emerald-300/60 dark:border-emerald-500/30'
                    : 'border-neutral-200 dark:border-neutral-800 opacity-80'
                }`}
              >
                
                {/* Left Column: Client & Restaurant Info */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  
                  {/* Restaurant Avatar / Icon */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    isPending
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                      : isApproved
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                  }`}>
                    <Store className="w-6 h-6" />
                  </div>

                  {/* Details */}
                  <div className="min-w-0 space-y-1">
                    
                    {/* Restaurant Name & Status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-neutral-900 dark:text-white truncate">
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

                    {/* Owner Name & Username */}
                    <div className="flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-300 flex-wrap">
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {client.owner_name}
                        </span>
                      </div>

                      <span className="text-neutral-300 dark:text-neutral-700">•</span>

                      <div className="flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Username:</span>
                        <code className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono font-bold text-neutral-900 dark:text-white">
                          {client.username}
                        </code>
                      </div>
                    </div>

                    {/* Email & Phone Contact Bar */}
                    <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400 pt-0.5 flex-wrap">
                      {client.email && (
                        <a
                          href={`mailto:${client.email}`}
                          className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white transition-colors"
                        >
                          <Mail className="w-3 h-3 opacity-70" />
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
                            className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{client.phone}</span>
                          </a>
                        </>
                      )}

                      <span className="text-neutral-300 dark:text-neutral-700">•</span>

                      <div className="flex items-center gap-1 text-neutral-400">
                        <Clock className="w-3 h-3" />
                        <span>
                          {client.created_at ? new Date(client.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          }) : 'Recent'}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right Column: Admission & Action Buttons */}
                <div className="flex items-center gap-2 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-100 dark:border-neutral-800">
                  
                  {/* ADMIT / APPROVE BUTTON (Vibrant Emerald) */}
                  {isPending && (
                    <button
                      type="button"
                      onClick={() => handleApprove(client)}
                      disabled={isThisProcessing}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 hover:scale-103 cursor-pointer disabled:opacity-50"
                      title="Admit this client: allows them to log in immediately"
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
                      disabled={isThisProcessing}
                      className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-rose-50 text-neutral-600 hover:text-rose-600 dark:bg-neutral-800 dark:hover:bg-rose-950/40 dark:text-neutral-400 dark:hover:text-rose-300 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      title="Decline this registration request"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  )}

                  {/* RE-ADMIT (if rejected) */}
                  {isRejected && (
                    <button
                      type="button"
                      onClick={() => handleApprove(client)}
                      disabled={isThisProcessing}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Admit Client</span>
                    </button>
                  )}

                  {/* REVOKE (if approved) */}
                  {isApproved && client.username !== 'admin' && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(client)}
                      disabled={isThisProcessing}
                      className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-amber-50 text-neutral-600 hover:text-amber-700 dark:bg-neutral-800 dark:hover:bg-amber-950/40 dark:text-neutral-400 dark:hover:text-amber-300 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      title="Temporarily revoke access"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Revoke Access</span>
                    </button>
                  )}

                  {/* DELETE RECORD */}
                  {client.username !== 'admin' && (
                    <button
                      type="button"
                      onClick={() => handleDelete(client)}
                      disabled={isThisProcessing}
                      className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete registration record"
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

      {/* Footer Info Box */}
      <div className="bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-4 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          <strong className="text-neutral-900 dark:text-white">How Client Admission Works:</strong> Any new client registering via the public login screen is placed in <strong>Pending</strong> status. Their software access is locked until you click <strong>Admit & Approve</strong>. You maintain complete control over which restaurants and cafes can use the platform.
        </div>
      </div>

    </div>
  );
}
