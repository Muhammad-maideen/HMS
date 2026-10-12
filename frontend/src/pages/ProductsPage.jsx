import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  ShoppingBag,
  Calendar,
  ChevronDown,
  ArrowUpDown,
  Filter,
  MoreHorizontal,
  Upload,
  Download
} from 'lucide-react';
import { api, getRole } from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

export default function ProductsPage({ onEditProduct, onOpenNewProduct, categories = [], refreshTrigger }) {
  const { addToast } = useToast();
  const currentRole = getRole();
  const canModify = currentRole === 'admin' || currentRole === 'manager';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected checkboxes
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  // Deletion modal
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, product: null, loading: false });

  // Lightbox modal
  const [previewImage, setPreviewImage] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        per_page: 12,
      };

      if (search && search.trim() !== '') {
        params.search = search.trim();
      }
      if (selectedCategory && selectedCategory !== '') {
        params.category_id = selectedCategory;
      }
      if (selectedAvailability !== '' && selectedAvailability !== undefined && selectedAvailability !== null) {
        params.is_available = selectedAvailability;
      }
      if (selectedStatus !== '' && selectedStatus !== undefined && selectedStatus !== null) {
        params.is_active = selectedStatus;
      }
      if (sortBy) {
        params.sort_by = sortBy;
      }
      if (sortOrder) {
        params.sort_order = sortOrder;
      }

      const res = await api.getProducts(params);
      setProducts(res.data || []);
      setTotalPages(res.last_page || 1);
      setTotalCount(res.total || 0);
    } catch (err) {
      addToast(err.message || 'Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search, selectedCategory, selectedAvailability, selectedStatus, sortBy, sortOrder, refreshTrigger]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProductIds(products.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const confirmDelete = async () => {
    if (!canModify) {
      addToast(`Role '${currentRole}' cannot delete products`, 'error');
      return;
    }
    try {
      setDeleteModal(prev => ({ ...prev, loading: true }));
      await api.deleteProduct(deleteModal.product.id);
      addToast(`Product '${deleteModal.product.name}' deleted successfully`, 'success');
      setDeleteModal({ isOpen: false, product: null, loading: false });
      fetchProducts();
    } catch (err) {
      addToast(err.message || 'Failed to delete product', 'error');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Metrics summary
  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock_quantity || 0), 0);
  const activeCount = products.filter(p => p.is_active).length;

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto animate-fadeIn text-neutral-900">
      
      {/* 1. Header matching Screenshot 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900">
            Products
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
            onClick={fetchProducts}
            className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-lg border border-neutral-300 shadow-2xs flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-lg border border-neutral-300 shadow-2xs flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-neutral-500" />
            <span>Import</span>
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
              onClick={onOpenNewProduct}
              className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add product</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Summary Metrics Bar matching Screenshot 1 */}
      <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs grid grid-cols-1 md:grid-cols-4 gap-4 text-xs divide-y md:divide-y-0 md:divide-x divide-neutral-100">
        
        {/* Metric 1 */}
        <div className="flex items-center gap-2 text-neutral-600 md:pr-4">
          <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
          <span className="font-semibold text-neutral-800">30 days</span>
        </div>

        {/* Metric 2 */}
        <div className="pt-2 md:pt-0 md:px-4">
          <div className="text-neutral-500 text-[11px] underline decoration-dotted decoration-neutral-300">
            Average sell-through rate
          </div>
          <div className="font-bold text-neutral-900 text-sm mt-0.5">
            84% <span className="text-neutral-400 font-normal">—</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="pt-2 md:pt-0 md:px-4">
          <div className="text-neutral-500 text-[11px] underline decoration-dotted decoration-neutral-300">
            Products by days of inventory remaining
          </div>
          <div className="font-bold text-neutral-900 text-sm mt-0.5">
            {totalStockUnits} units in stock
          </div>
        </div>

        {/* Metric 4 */}
        <div className="pt-2 md:pt-0 md:pl-4">
          <div className="text-neutral-500 text-[11px] underline decoration-dotted decoration-neutral-300">
            ABC product analysis
          </div>
          <div className="font-bold text-neutral-900 text-sm mt-0.5">
            ₹{(products.reduce((acc, p) => acc + (parseFloat(p.base_price) || 0) * (p.stock_quantity || 1), 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-neutral-400 font-normal">C</span>
          </div>
        </div>

      </div>

      {/* 3. Table Filter & Search Card matching Screenshot 1 */}
      <div className="bg-white border border-neutral-200/90 rounded-xl shadow-2xs overflow-hidden">
        
        {/* Filter bar */}
        <div className="p-3 border-b border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* All ⇄ Tab Button */}
            <button
              type="button"
              onClick={() => { setSelectedCategory(''); setSearch(''); }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-neutral-100 text-neutral-900 border border-neutral-200 flex items-center gap-1.5 shrink-0"
            >
              <span>All</span>
              <ArrowUpDown className="w-3 h-3 text-neutral-500" />
            </button>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-72">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search and filter products..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          {/* Category filter dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black font-medium"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* 4. Products Table matching Screenshot 1 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            
            <thead className="bg-neutral-50/70 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.length > 0 && selectedProductIds.length === products.length}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded text-black focus:ring-black"
                  />
                </th>
                <th className="py-2.5 px-4 font-semibold text-neutral-700">Product</th>
                <th className="py-2.5 px-4 font-semibold text-neutral-700">Status</th>
                <th className="py-2.5 px-4 font-semibold text-neutral-700">Inventory</th>
                <th className="py-2.5 px-4 font-semibold text-neutral-700">Category</th>
                <th className="py-2.5 px-4 font-semibold text-neutral-700">Channels</th>
                <th className="py-2.5 px-4 font-semibold text-neutral-700">Product type</th>
                <th className="py-2.5 px-4 text-right font-semibold text-neutral-700">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-neutral-400">
                    <div className="w-5 h-5 border-2 border-neutral-300 border-t-black rounded-full animate-spin mx-auto mb-2"></div>
                    Loading product catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-neutral-400">
                    No products found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isChecked = selectedProductIds.includes(p.id);
                  const variantCount = p.variants ? p.variants.length : 0;
                  return (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-neutral-50/80 transition-colors group cursor-pointer ${
                        isChecked ? 'bg-neutral-50/90' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(p.id)}
                          className="w-3.5 h-3.5 rounded text-black focus:ring-black"
                        />
                      </td>

                      {/* Product (Thumbnail + Title - CLICK OPENS INSIDE PAGE) */}
                      <td className="py-3 px-4" onClick={() => onEditProduct(p)}>
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=100'}
                            alt={p.name}
                            className="w-9 h-9 rounded-lg object-cover border border-neutral-200 shrink-0"
                          />
                          <div>
                            <span className="font-semibold text-neutral-900 group-hover:underline text-xs block leading-tight">
                              {p.name}
                            </span>
                            <span className="font-mono text-[10px] text-neutral-400">
                              ₹{p.offer_price || p.base_price}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status (Green Active pill matching Screenshot 1) */}
                      <td className="py-3 px-4" onClick={() => onEditProduct(p)}>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          p.is_active
                            ? 'bg-[#c6f6d5] text-[#22543d]'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {p.is_active ? 'Active' : 'Draft'}
                        </span>
                      </td>

                      {/* Inventory (Matching Screenshot 1) */}
                      <td className="py-3 px-4 text-neutral-700" onClick={() => onEditProduct(p)}>
                        {variantCount > 0 ? (
                          <span>{p.stock_quantity} in stock for {variantCount} variants</span>
                        ) : (
                          <span>{p.stock_quantity} in stock</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-neutral-600" onClick={() => onEditProduct(p)}>
                        {p.category?.name || 'General'}
                      </td>

                      {/* Channels (e.g. 2 ▾ matching Screenshot 1) */}
                      <td className="py-3 px-4 text-neutral-600" onClick={() => onEditProduct(p)}>
                        <span className="inline-flex items-center gap-1">
                          <span>3</span>
                          <ChevronDown className="w-3 h-3 text-neutral-400" />
                        </span>
                      </td>

                      {/* Product type */}
                      <td className="py-3 px-4 text-neutral-600" onClick={() => onEditProduct(p)}>
                        {p.category?.name || 'Main Course'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditProduct(p)}
                            className="p-1 text-neutral-500 hover:text-black rounded"
                            title="Edit Product"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canModify && (
                            <button
                              type="button"
                              onClick={() => setDeleteModal({ isOpen: true, product: p, loading: false })}
                              className="p-1 text-neutral-400 hover:text-red-600 rounded"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

        {/* Footer with pagination */}
        <div className="p-3 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500 bg-neutral-50/30">
          <div>
            Showing {products.length} of {totalCount} products
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-1 rounded border border-neutral-200 disabled:opacity-30 bg-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] font-semibold text-neutral-800">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-1 rounded border border-neutral-200 disabled:opacity-30 bg-white"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Confirmation Modal for deletion */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Product"
        message={`Are you sure you want to permanently delete '${deleteModal.product?.name}'? This cannot be undone.`}
        confirmText="Delete"
        confirmType="danger"
        loading={deleteModal.loading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, product: null, loading: false })}
      />

    </div>
  );
}
