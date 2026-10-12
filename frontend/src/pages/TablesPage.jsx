import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutGrid, 
  Plus, 
  Search, 
  Users, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Trash2, 
  ArrowRight, 
  X, 
  Filter,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { 
  getTables, 
  addTable, 
  updateTable, 
  deleteTable, 
  setTableStatus, 
  onTablesChange 
} from '../services/tablesService';
import ConfirmationModal from '../components/ConfirmationModal';

export default function TablesPage({ onNavigate }) {
  const { addToast } = useToast();

  const [tables, setTables] = useState(() => getTables());
  const [search, setSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    capacity: '4',
    section: 'Main Dining',
    status: 'available',
  });

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    table: null,
  });

  // Listen for real-time table sync across tabs/components
  useEffect(() => {
    const unsubscribe = onTablesChange((updatedTables) => {
      setTables(updatedTables);
    });
    return unsubscribe;
  }, []);

  // Distinct Sections
  const availableSections = useMemo(() => {
    const set = new Set(tables.map(t => t.section || 'Main Dining'));
    return Array.from(set);
  }, [tables]);

  // Filtered Tables
  const filteredTables = useMemo(() => {
    return tables.filter(t => {
      const matchSearch = 
        t.code.toLowerCase().includes(search.toLowerCase()) ||
        (t.name && t.name.toLowerCase().includes(search.toLowerCase())) ||
        (t.section && t.section.toLowerCase().includes(search.toLowerCase()));

      const matchSection = selectedSection === 'all' || t.section === selectedSection;
      const matchStatus = selectedStatus === 'all' || t.status === selectedStatus;

      return matchSearch && matchSection && matchStatus;
    });
  }, [tables, search, selectedSection, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = tables.length;
    const available = tables.filter(t => t.status === 'available').length;
    const occupied = tables.filter(t => t.status === 'occupied').length;
    const reserved = tables.filter(t => t.status === 'reserved').length;
    const totalCapacity = tables.reduce((acc, t) => acc + (Number(t.capacity) || 0), 0);
    return { total, available, occupied, reserved, totalCapacity };
  }, [tables]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingTable(null);
    const nextNum = tables.length + 1;
    setFormData({
      code: `T-${String(nextNum).padStart(2, '0')}`,
      name: `Table ${nextNum}`,
      capacity: '4',
      section: selectedSection !== 'all' ? selectedSection : 'Main Dining',
      status: 'available',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (table) => {
    setEditingTable(table);
    setFormData({
      code: table.code,
      name: table.name || '',
      capacity: String(table.capacity || 4),
      section: table.section || 'Main Dining',
      status: table.status || 'available',
    });
    setIsModalOpen(true);
  };

  // Submit Add / Edit
  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      addToast('Table code is required (e.g. T-01)', 'error');
      return;
    }

    if (editingTable) {
      updateTable(editingTable.id, formData);
      addToast(`Table ${formData.code.toUpperCase()} updated successfully!`, 'success');
    } else {
      // Check duplicate code
      const exists = tables.some(t => t.code.toUpperCase() === formData.code.trim().toUpperCase());
      if (exists) {
        addToast(`Table code ${formData.code.toUpperCase()} already exists`, 'error');
        return;
      }
      addTable(formData);
      addToast(`Table ${formData.code.toUpperCase()} created successfully!`, 'success');
    }

    setIsModalOpen(false);
  };

  // Quick Toggle Status
  const handleToggleStatus = (table) => {
    const newStatus = table.status === 'available' ? 'occupied' : 'available';
    setTableStatus(table.id, newStatus);
    addToast(`Table ${table.code} marked as ${newStatus}`, 'info');
  };

  // Open in POS
  const handleOpenInPOS = (table) => {
    localStorage.setItem('pos_table_number', table.code);
    localStorage.setItem('pos_order_type', 'dine_in');
    window.dispatchEvent(new Event('storage'));
    if (onNavigate) {
      onNavigate('pos');
    }
  };

  // Delete Table
  const handleDeleteConfirm = () => {
    if (!deleteModal.table) return;
    deleteTable(deleteModal.table.id);
    addToast(`Table ${deleteModal.table.code} deleted`, 'info');
    setDeleteModal({ isOpen: false, table: null });
  };

  return (
    <div className="p-4 sm:p-6 pb-12 space-y-6 max-w-[1600px] mx-auto animate-fadeIn font-sans selection:bg-neutral-900 selection:text-white">
      
      {/* ====================================================
          TOP HEADER & ACTION BAR
          ==================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              <LayoutGrid className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
                <span>Restaurant Tables</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-600">
                  {tables.length} Total
                </span>
              </h1>
              <p className="text-xs text-neutral-500 font-medium mt-0.5">
                Configure table codes (T-01, T-02), seating capacities, and floor zones for POS checkout.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Table</span>
          </button>
        </div>
      </div>

      {/* ====================================================
          STATS ROW: 4 SUMMARY CARDS
          ==================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tables */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 block">Total Tables</span>
            <div className="text-xl sm:text-2xl font-black text-neutral-900 mt-1 font-mono tracking-tight">
              {stats.total}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-400 font-medium">
              <span>Across {availableSections.length} floor sections</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 shrink-0">
            <LayoutGrid className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Available Tables */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 block">Available Now</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1 font-mono tracking-tight">
              {stats.available}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ready for guests</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Occupied Tables */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 block">Currently Occupied</span>
            <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1 font-mono tracking-tight">
              {stats.occupied}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Active dining orders</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Total Seating Capacity */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 block">Seating Capacity</span>
            <div className="text-xl sm:text-2xl font-black text-neutral-900 mt-1 font-mono tracking-tight">
              {stats.totalCapacity} <span className="text-xs font-normal text-neutral-400">seats</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-400 font-medium">
              <span>Avg {stats.total ? Math.round(stats.totalCapacity / stats.total) : 4} guests / table</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 shrink-0">
            <Users className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* ====================================================
          FILTERS & SEARCH BAR
          ==================================================== */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Section Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedSection('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedSection === 'all'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-black'
              }`}
            >
              All Sections ({tables.length})
            </button>

            {availableSections.map(sec => {
              const count = tables.filter(t => t.section === sec).length;
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSelectedSection(sec)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedSection === sec
                      ? 'bg-neutral-900 text-white shadow-2xs'
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-black'
                  }`}
                >
                  {sec} ({count})
                </button>
              );
            })}
          </div>

          {/* Status Dropdown & Search Input */}
          <div className="flex items-center gap-2.5">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none bg-neutral-50 text-xs font-semibold text-neutral-800 py-1.5 pl-3 pr-7 rounded-xl border border-neutral-200 focus:outline-none focus:border-black cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available Only</option>
                <option value="occupied">Occupied Only</option>
                <option value="reserved">Reserved Only</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-2 pointer-events-none" />
            </div>

            {/* Search Input */}
            <div className="relative w-44 sm:w-56">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search table code (T-01)..."
                className="w-full bg-neutral-50 border border-neutral-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-black placeholder:text-neutral-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-2 text-neutral-400 hover:text-black"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================
          TABLES GRID (CARD TILES)
          ==================================================== */}
      {filteredTables.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-neutral-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto">
            <LayoutGrid className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-neutral-800">No tables found</h4>
            <p className="text-xs text-neutral-400 mt-1">
              {search || selectedSection !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your search or filter options'
                : 'Get started by creating your first dining table'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Table</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const isAvailable = table.status === 'available';
            const isOccupied = table.status === 'occupied';

            return (
              <div
                key={table.id}
                className={`bg-white rounded-2xl border transition-all duration-200 p-4 flex flex-col justify-between hover:shadow-md group ${
                  isOccupied 
                    ? 'border-amber-200 hover:border-amber-400 bg-amber-50/10' 
                    : 'border-neutral-200/80 hover:border-black'
                }`}
              >
                <div>
                  {/* Top Line: Table Code Badge + Status Dot */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black font-mono text-neutral-900 px-2.5 py-1 rounded-xl bg-neutral-100 border border-neutral-200 tracking-tight">
                        {table.code}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight capitalize ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : isOccupied
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isAvailable ? 'bg-emerald-500 animate-pulse' : isOccupied ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        {table.status}
                      </span>
                    </div>

                    {/* Edit & Delete Mini Buttons */}
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(table)}
                        className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-black cursor-pointer"
                        title="Edit Table"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteModal({ isOpen: true, table })}
                        className="p-1 hover:bg-red-50 rounded-lg text-neutral-400 hover:text-red-600 cursor-pointer"
                        title="Delete Table"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Table Label & Capacity */}
                  <div className="mt-3">
                    <h3 className="text-sm font-bold text-neutral-900 truncate">
                      {table.name || `Table ${table.code}`}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 opacity-60" />
                        <span>{table.capacity} Seats</span>
                      </span>
                      <span>•</span>
                      <span className="truncate">{table.section || 'Main Dining'}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center gap-2">
                  {/* Quick Toggle Status */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(table)}
                    className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                      isAvailable
                        ? 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {isAvailable ? 'Mark Occupied' : 'Free Up Table'}
                  </button>

                  {/* Open in POS */}
                  <button
                    type="button"
                    onClick={() => handleOpenInPOS(table)}
                    className="py-1.5 px-3 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-2xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
                    title={`Open ${table.code} in POS Checkout`}
                  >
                    <span>POS</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ====================================================
          MODAL: ADD / EDIT TABLE
          ==================================================== */}
      {isModalOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-neutral-200 max-w-md w-full p-6 shadow-2xl space-y-5 animate-scaleUp"
          >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                  <LayoutGrid className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    {editingTable ? `Edit Table ${editingTable.code}` : 'Create New Table'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Enter table code for POS terminal billing
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              
              {/* Row: Table Code + Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Table Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. T-01, T-1, T-2"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono font-bold focus:outline-none focus:border-black uppercase"
                  />
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">Short identifier</span>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Seating Capacity
                  </label>
                  <select
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-semibold focus:outline-none focus:border-black cursor-pointer"
                  >
                    {[1, 2, 3, 4, 6, 8, 10, 12].map(n => (
                      <option key={n} value={String(n)}>{n} Persons</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table Name / Display Label */}
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Table Label / Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Table 01 (Window Side)"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-black"
                />
              </div>

              {/* Floor Section / Area */}
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Floor Section / Zone
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {['Main Dining', 'Family AC', 'Outdoor Terrace', 'VIP Lounge'].map(sec => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, section: sec }))}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                        formData.section === sec
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                          : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.section}
                  onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                  placeholder="Or type custom section..."
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-700 focus:outline-none focus:border-black text-[11px]"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'available', label: 'Available' },
                    { id: 'occupied', label: 'Occupied' },
                    { id: 'reserved', label: 'Reserved' },
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, status: st.id }))}
                      className={`py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                        formData.status === st.id
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                          : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-200 hover:bg-neutral-100 rounded-xl text-neutral-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 hover:bg-black text-white font-bold rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  {editingTable ? 'Save Changes' : 'Create Table'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Dining Table"
        message={`Are you sure you want to delete table ${deleteModal.table?.code}? This action cannot be undone.`}
        confirmText="Delete Table"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, table: null })}
      />

    </div>
  );
}
