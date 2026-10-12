import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Eye, 
  FolderTree, 
  RefreshCw, 
  Calendar, 
  ArrowUpDown, 
  ChevronDown,
  Layers,
  Download
} from 'lucide-react';
import { api, getRole } from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

export default function CategoriesPage({ 
  onEditCategory, 
  onOpenNewCategory, 
  onCategoryUpdated 
}) {
  const { addToast } = useToast();
  const currentRole = getRole();
  const canModify = currentRole === 'admin' || currentRole === 'manager';

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, category: null, loading: false });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.getCategories();
      setCategories(res.data || []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(categories.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const confirmDelete = async () => {
    if (!deleteModal.category) return;
    if (!canModify) {
      addToast(`Role '${currentRole}' cannot delete categories`, 'error');
      return;
    }
    try {
      setDeleteModal(prev => ({ ...prev, loading: true }));
      await api.deleteCategory(deleteModal.category.id);
      addToast(`Category '${deleteModal.category.name}' deleted successfully`, 'success');
      setDeleteModal({ isOpen: false, category: null, loading: false });
      fetchCategories();
      if (onCategoryUpdated) onCategoryUpdated();
    } catch (err) {
      addToast(err.message || 'Cannot delete category containing dishes', 'error');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const totalDishesCount = categories.reduce((sum, c) => sum + (c.products_count || 0), 0);
  const activeCount = categories.filter(c => c.is_active).length;

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto animate-fadeIn text-neutral-900">
      
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center">
            <FolderTree className="w-3.5 h-3.5" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900">
            Categories
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
            onClick={fetchCategories}
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
              onClick={onOpenNewCategory}
              className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add category</span>
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
            Total Menu Categories
          </div>
          <div className="font-bold text-neutral-900 text-sm mt-0.5">
            {categories.length} Sections
          </div>
        </div>

        <div className="pt-2 md:pt-0 md:px-4">
          <div className="text-neutral-500 text-[11px] underline decoration-dotted decoration-neutral-300">
            Active Catalog Dishes
          </div>
          <div className="font-bold text-neutral-900 text-sm mt-0.5">
            {totalDishesCount} Dishes Assigned
          </div>
        </div>

        <div className="pt-2 md:pt-0 md:pl-4">
          <div className="text-neutral-500 text-[11px] underline decoration-dotted decoration-neutral-300">
            Section Status Health
          </div>
          <div className="font-bold text-neutral-900 text-sm mt-0.5">
            {categories.length > 0 ? `${Math.round((activeCount / categories.length) * 100)}% Active` : '100%'}
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
                placeholder="Search categories by name, slug..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div className="text-xs text-neutral-500 font-medium">
            {filteredCategories.length} categories found
          </div>

        </div>

        {/* 4. Categories Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            
            <thead className="bg-neutral-50/70 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredCategories.length}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded text-black focus:ring-black"
                  />
                </th>
                <th className="py-2.5 px-4 font-semibold text-neutral-700">Category</th>
                <th className="py-2.5 px-4 font-semibold text-neutral-700">Slug / Handle</th>
                <th className="py-2.5 px-4 font-semibold text-neutral-700">Dishes Count</th>
                <th className="py-2.5 px-4 font-semibold text-neutral-700">Status</th>
                <th className="py-2.5 px-4 font-semibold text-neutral-700">Sort Order</th>
                <th className="py-2.5 px-4 font-semibold text-neutral-700">Description</th>
                <th className="py-2.5 px-4 text-right font-semibold text-neutral-700">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-neutral-400">
                    <div className="w-5 h-5 border-2 border-neutral-300 border-t-black rounded-full animate-spin mx-auto mb-2"></div>
                    Loading menu categories...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-neutral-400">
                    No categories found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c) => {
                  const isChecked = selectedIds.includes(c.id);
                  return (
                    <tr 
                      key={c.id} 
                      className={`hover:bg-neutral-50/80 transition-colors group cursor-pointer ${
                        isChecked ? 'bg-neutral-50/90' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(c.id)}
                          className="w-3.5 h-3.5 rounded text-black focus:ring-black"
                        />
                      </td>

                      {/* Category (Thumbnail + Name - CLICK OPENS INSIDE PAGE) */}
                      <td className="py-3 px-4" onClick={() => onEditCategory(c)}>
                        <div className="flex items-center gap-3">
                          <img
                            src={c.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=100'}
                            alt={c.name}
                            className="w-10 h-10 rounded-lg object-cover border border-neutral-200 shrink-0"
                          />
                          <div>
                            <span className="font-semibold text-neutral-900 group-hover:underline text-xs block leading-tight">
                              {c.name}
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              Section #{c.sort_order}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Slug / Handle */}
                      <td className="py-3 px-4 font-mono text-[11px] text-neutral-500" onClick={() => onEditCategory(c)}>
                        /{c.slug}
                      </td>

                      {/* Dishes count */}
                      <td className="py-3 px-4" onClick={() => onEditCategory(c)}>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 text-[10px] font-bold border border-neutral-200">
                          <Layers className="w-3 h-3 text-neutral-500" />
                          <span>{c.products_count ?? 0} Dishes</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4" onClick={() => onEditCategory(c)}>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          c.is_active
                            ? 'bg-[#c6f6d5] text-[#22543d]'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {c.is_active ? 'Active' : 'Draft'}
                        </span>
                      </td>

                      {/* Sort Order */}
                      <td className="py-3 px-4 font-mono text-[11px] font-semibold text-neutral-700" onClick={() => onEditCategory(c)}>
                        #{c.sort_order}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-neutral-500 max-w-xs truncate" onClick={() => onEditCategory(c)}>
                        {c.description || 'No description provided'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditCategory(c)}
                            className="p-1 text-neutral-500 hover:text-black rounded"
                            title="Edit Category"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canModify && (
                            <button
                              type="button"
                              onClick={() => setDeleteModal({ isOpen: true, category: c, loading: false })}
                              className="p-1 text-neutral-400 hover:text-red-600 rounded"
                              title="Delete Category"
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

        {/* Footer */}
        <div className="p-3 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500 bg-neutral-50/30">
          <div>
            Showing {filteredCategories.length} categories
          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Category"
        message={`Are you sure you want to permanently delete '${deleteModal.category?.name}'? You can only delete categories with 0 assigned dishes.`}
        confirmText="Delete"
        confirmType="danger"
        loading={deleteModal.loading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, category: null, loading: false })}
      />

    </div>
  );
}
