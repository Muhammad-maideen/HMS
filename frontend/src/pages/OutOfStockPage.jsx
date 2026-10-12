import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, PackagePlus, ArrowUpRight, Search } from 'lucide-react';
import { api, getRole } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function OutOfStockPage({ onEditProduct, refreshTrigger }) {
  const { addToast } = useToast();
  const currentRole = getRole();
  const canModify = currentRole === 'admin' || currentRole === 'manager';

  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.getProducts({ is_available: '0', all: '1' });
      setOutOfStockItems(res.data || []);
      setSelectedIds([]);
    } catch (err) {
      addToast(err.message || 'Failed to load out-of-stock items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [refreshTrigger]);

  const handleRestockSingle = async (product) => {
    if (!canModify) {
      addToast(`Role '${currentRole}' is not allowed to restock items`, 'error');
      return;
    }
    try {
      await api.updateProduct(product.id, {
        is_available: true,
        stock_quantity: Math.max(50, product.stock_quantity || 50),
      });
      addToast(`'${product.name}' restocked (50 units) and marked In Stock!`, 'success');
      fetchItems();
    } catch (err) {
      addToast(err.message || 'Failed to restock item', 'error');
    }
  };

  const handleBulkRestock = async () => {
    if (!canModify) {
      addToast(`Role '${currentRole}' is not authorized`, 'error');
      return;
    }
    if (selectedIds.length === 0) return;

    try {
      await api.bulkAvailability(selectedIds, true);
      addToast(`${selectedIds.length} dishes marked as In Stock!`, 'success');
      fetchItems();
    } catch (err) {
      addToast(err.message || 'Failed to bulk restock', 'error');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(p => p.id));
    }
  };

  const filteredItems = outOfStockItems.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-neutral-900" />
            Out-of-Stock & Depleted Items
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200">
              {outOfStockItems.length} Dishes Unavailable
            </span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Monitor depleted menu items in real time. Items marked out-of-stock cannot be ordered in POS checkout.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchItems}
            className="p-2 text-neutral-600 hover:text-black bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg shadow-sm transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-black' : ''}`} />
          </button>

          {canModify && selectedIds.length > 0 && (
            <button
              onClick={handleBulkRestock}
              className="px-3.5 py-2 bg-black hover:bg-neutral-800 text-white font-medium text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Restock Selected ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-3.5 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search out-of-stock items..."
            className="w-full bg-white border border-neutral-200 rounded-lg pl-9 pr-3.5 py-1.5 text-neutral-900 text-xs placeholder:text-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
          />
        </div>

        {canModify && filteredItems.length > 0 && (
          <button
            onClick={selectAll}
            className="text-xs text-neutral-600 hover:text-black font-medium"
          >
            {selectedIds.length === filteredItems.length ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* Items list */}
      {loading ? (
        <div className="p-16 text-center space-y-3">
          <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-neutral-500 font-medium">Scanning inventory...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-16 text-center bg-white border border-neutral-200 rounded-2xl shadow-sm space-y-2">
          <CheckCircle2 className="w-10 h-10 text-neutral-800 mx-auto" />
          <h3 className="text-sm font-bold text-neutral-900">All Menu Products In Stock!</h3>
          <p className="text-xs text-neutral-500">There are currently no items marked as out-of-stock or depleted.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((p) => {
            const isSelected = selectedIds.includes(p.id);
            return (
              <div
                key={p.id}
                className={`bg-white rounded-xl p-4 border flex flex-col justify-between space-y-3 transition-all shadow-sm ${
                  isSelected ? 'border-black ring-1 ring-black' : 'border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  {canModify && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(p.id)}
                      className="mt-1 rounded border-neutral-300 text-black focus:ring-black"
                    />
                  )}
                  <img
                    src={p.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200'}
                    alt={p.name}
                    className="w-12 h-12 rounded-lg object-cover border border-neutral-200 shrink-0"
                  />
                  <div className="flex-1">
                    <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">
                      Out of Stock
                    </span>
                    <h3 className="text-sm font-bold text-neutral-900 leading-tight">{p.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-neutral-400">
                      <span>{p.category?.name}</span>
                      <span>•</span>
                      <span className="font-mono">{p.sku}</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Stock Count</span>
                    <span className="font-mono font-bold text-neutral-900 text-xs">
                      {p.stock_quantity} units
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Regular Price</span>
                    <span className="font-mono font-bold text-neutral-900 text-xs">
                      ₹{p.base_price}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                  <button
                    onClick={() => onEditProduct(p)}
                    className="text-xs text-neutral-600 hover:text-black font-medium flex items-center gap-1"
                  >
                    Edit Product <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  {canModify && (
                    <button
                      onClick={() => handleRestockSingle(p)}
                      className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white font-medium text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <PackagePlus className="w-3.5 h-3.5" />
                      <span>Restock (+50)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
