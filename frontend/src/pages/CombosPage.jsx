import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  Sparkles,
  Search,
  RefreshCw,
  Eye,
  ChevronDown,
  Calendar,
  ArrowUpDown,
  Utensils,
  DollarSign
} from 'lucide-react';
import { api, getRole } from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

export default function CombosPage({ 
  onEditCombo, 
  onOpenNewCombo, 
  products = [], 
  refreshTrigger 
}) {
  const { addToast } = useToast();
  const currentRole = getRole();
  const canModify = currentRole === 'admin' || currentRole === 'manager';

  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, combo: null, loading: false });

  const fetchCombos = async () => {
    try {
      setLoading(true);
      const res = await api.getCombos();
      setCombos(res.data || []);
    } catch (err) {
      addToast(err.message || 'Failed to load combo deals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombos();
  }, [refreshTrigger]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(combos.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDuplicate = async (combo, e) => {
    if (e) e.stopPropagation();
    if (!canModify) {
      addToast(`Role '${currentRole}' is not authorized to duplicate combos`, 'error');
      return;
    }
    try {
      await api.duplicateCombo(combo.id);
      addToast(`Combo '${combo.name}' duplicated successfully!`, 'success');
      fetchCombos();
    } catch (err) {
      addToast(err.message || 'Failed to duplicate combo', 'error');
    }
  };

  const handleToggleStatus = async (combo, e) => {
    if (e) e.stopPropagation();
    if (!canModify) {
      addToast(`Role '${currentRole}' is not authorized to modify combos`, 'error');
      return;
    }
    try {
      await api.toggleComboStatus(combo.id);
      addToast(`Combo '${combo.name}' status updated`, 'success');
      fetchCombos();
    } catch (err) {
      addToast(err.message || 'Failed to update combo status', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.combo) return;
    try {
      setDeleteModal(prev => ({ ...prev, loading: true }));
      await api.deleteCombo(deleteModal.combo.id);
      addToast(`Combo '${deleteModal.combo.name}' deleted successfully`, 'success');
      setDeleteModal({ isOpen: false, combo: null, loading: false });
      fetchCombos();
    } catch (err) {
      addToast(err.message || 'Failed to delete combo', 'error');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const filteredCombos = combos.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
    (c.badge_text && c.badge_text.toLowerCase().includes(search.toLowerCase()))
  );

  const totalSavings = combos.reduce((sum, c) => sum + (parseFloat(c.customer_savings) || 0), 0);
  const avgSavings = combos.length > 0 ? (totalSavings / combos.length).toFixed(0) : 0;
  const activeCount = combos.filter(c => c.is_active).length;

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto animate-fadeIn text-neutral-900">
      
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900">
            Combos & Deals
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-lg border border-neutral-300 shadow-2xs flex items-center gap-1.5 transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-neutral-500" />
            <span>View as</span>
          </button>

          <button
            type="button"
            onClick={fetchCombos}
            className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-lg border border-neutral-300 shadow-2xs flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-lg border border-neutral-300 shadow-2xs flex items-center gap-1 transition-all"
          >
            <span>More actions</span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          {canModify && (
            <button
              type="button"
              onClick={onOpenNewCombo}
              className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add combo</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Metrics Summary Bar */}
      <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs grid grid-cols-1 md:grid-cols-4 gap-4 text-xs divide-y md:divide-y-0 md:divide-x divide-neutral-100">
        
        <div className="flex items-center gap-2 text-neutral-600 md:pr-4">
          <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
          <span className="font-semibold text-neutral-800">30 days</span>
        </div>

        <div className="pt-2 md:pt-0 md:px-4">
          <div className="text-neutral-500 text-[11px] underline decoration-dotted decoration-neutral-300">
            Active Combo Deals
          </div>
          <div className="font-bold text-neutral-900 text-sm mt-0.5">
            {activeCount} of {combos.length} Live
          </div>
        </div>

        <div className="pt-2 md:pt-0 md:px-4">
          <div className="text-neutral-500 text-[11px] underline decoration-dotted decoration-neutral-300">
            Avg. Customer Savings
          </div>
          <div className="font-bold text-neutral-900 text-sm mt-0.5">
            ₹{avgSavings} per order
          </div>
        </div>

        <div className="pt-2 md:pt-0 md:pl-4">
          <div className="text-neutral-500 text-[11px] underline decoration-dotted decoration-neutral-300">
            Total Menu Portions Bundled
          </div>
          <div className="font-bold text-neutral-900 text-sm mt-0.5">
            {combos.reduce((acc, c) => acc + (c.items ? c.items.length : 0), 0)} Component Items
          </div>
        </div>

      </div>

      {/* 3. Table Filter & Search Card */}
      <div className="bg-white border border-neutral-200/90 rounded-xl shadow-2xs overflow-hidden">
        
        {/* Filter bar */}
        <div className="p-3 border-b border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSearch('')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-neutral-100 text-neutral-900 border border-neutral-200 flex items-center gap-1.5 shrink-0"
            >
              <span>All</span>
              <ArrowUpDown className="w-3 h-3 text-neutral-500" />
            </button>

            <div className="relative flex-1 sm:w-72">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search combo meals, badges..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div className="text-xs text-neutral-500 font-medium">
            {filteredCombos.length} combos found
          </div>

        </div>

        {/* 4. Combos Catalog Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            
            <thead className="bg-neutral-50/70 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredCombos.length}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded text-black focus:ring-black"
                  />
                </th>
                <th className="py-2.5 px-4 font-semibold text-neutral-700">Combo Deal</th>
                <th className="py-2.5 px-4 font-semibold text-neutral-700">Included Dishes</th>
                <th className="py-2.5 px-4 font-semibold text-neutral-700">Regular Value</th>
                <th className="py-2.5 px-4 font-semibold text-neutral-700">Combo Price</th>
                <th className="py-2.5 px-4 font-semibold text-neutral-700">Savings</th>
                <th className="py-2.5 px-4 font-semibold text-neutral-700">Status</th>
                <th className="py-2.5 px-4 font-semibold text-neutral-700">Kitchen Ready</th>
                <th className="py-2.5 px-4 text-right font-semibold text-neutral-700">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-neutral-400">
                    <div className="w-5 h-5 border-2 border-neutral-300 border-t-black rounded-full animate-spin mx-auto mb-2"></div>
                    Loading combo deals...
                  </td>
                </tr>
              ) : filteredCombos.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-neutral-400">
                    No combos found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCombos.map((combo) => {
                  const isChecked = selectedIds.includes(combo.id);
                  const itemsCount = combo.items ? combo.items.length : 0;
                  
                  return (
                    <tr 
                      key={combo.id} 
                      className={`hover:bg-neutral-50/80 transition-colors group cursor-pointer ${
                        isChecked ? 'bg-neutral-50/90' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(combo.id)}
                          className="w-3.5 h-3.5 rounded text-black focus:ring-black"
                        />
                      </td>

                      {/* Combo Name + Thumbnail (CLICK OPENS INSIDE PAGE) */}
                      <td className="py-3 px-4" onClick={() => onEditCombo(combo)}>
                        <div className="flex items-center gap-3">
                          <img
                            src={combo.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=100'}
                            alt={combo.name}
                            className="w-10 h-10 rounded-lg object-cover border border-neutral-200 shrink-0"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=100';
                            }}
                          />
                          <div>
                            <span className="font-semibold text-neutral-900 group-hover:underline text-xs block leading-tight">
                              {combo.name}
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              {itemsCount} bundled items
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Included Dishes (Chips) */}
                      <td className="py-3 px-4" onClick={() => onEditCombo(combo)}>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {combo.items && combo.items.length > 0 ? (
                            combo.items.slice(0, 3).map((it, idx) => (
                              <span 
                                key={idx} 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[10px] font-medium border border-neutral-200/60"
                              >
                                {it.product?.name || `Product #${it.product_id}`} ×{it.quantity || 1}
                              </span>
                            ))
                          ) : (
                            <span className="text-neutral-400 text-[10px]">No items configured</span>
                          )}
                          {combo.items && combo.items.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-neutral-200 text-neutral-600 text-[9px] font-bold">
                              +{combo.items.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Regular Price (Struck through) */}
                      <td className="py-3 px-4 font-mono text-[11px] text-neutral-400 line-through" onClick={() => onEditCombo(combo)}>
                        ₹{combo.regular_price || 0}
                      </td>

                      {/* Combo Price */}
                      <td className="py-3 px-4 font-mono text-xs font-bold text-neutral-900" onClick={() => onEditCombo(combo)}>
                        ₹{combo.combo_price || 0}
                      </td>

                      {/* Savings */}
                      <td className="py-3 px-4" onClick={() => onEditCombo(combo)}>
                        <span className="inline-block px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {combo.badge_text || `Save ₹${combo.customer_savings || 0}`}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4" onClick={() => onEditCombo(combo)}>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          combo.is_active
                            ? 'bg-[#c6f6d5] text-[#22543d]'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {combo.is_active ? 'Active' : 'Draft'}
                        </span>
                      </td>

                      {/* Availability */}
                      <td className="py-3 px-4" onClick={() => onEditCombo(combo)}>
                        <span className={`inline-block px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                          combo.is_available
                            ? 'text-neutral-700 bg-neutral-100'
                            : 'text-red-700 bg-red-50'
                        }`}>
                          {combo.is_available ? 'In Stock' : 'Sold Out'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                          {canModify && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => handleDuplicate(combo, e)}
                                title="Duplicate combo deal"
                                className="p-1 text-neutral-400 hover:text-black rounded hover:bg-neutral-100 transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteModal({ isOpen: true, combo, loading: false })}
                                title="Delete combo deal"
                                className="p-1 text-neutral-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-200 bg-neutral-50/50 flex items-center justify-between text-xs text-neutral-500">
          <span>Showing {filteredCombos.length} of {combos.length} combo deals</span>
          <span className="text-[11px] text-neutral-400">Values updated in real-time</span>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Combo Meal Deal"
        message={`Are you sure you want to delete '${deleteModal.combo?.name}'? Customers will no longer be able to order this meal combo.`}
        confirmLabel="Delete Combo"
        confirmVariant="danger"
        isLoading={deleteModal.loading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, combo: null, loading: false })}
      />

    </div>
  );
}
