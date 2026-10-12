import React, { useState, useEffect } from 'react';
import { 
  Percent, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Calculator,
  Sparkles
} from 'lucide-react';
import { api, getRole } from '../services/api';
import { useToast } from '../context/ToastContext';
import OfferModal from '../components/OfferModal';
import ConfirmationModal from '../components/ConfirmationModal';

export default function OffersPage({ categories = [], refreshTrigger }) {
  const { addToast } = useToast();
  const currentRole = getRole();
  const canModify = currentRole === 'admin' || currentRole === 'manager';

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(''); // 'active', 'scheduled', 'expired', 'inactive'

  const [modalState, setModalState] = useState({ isOpen: false, offer: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, offer: null, loading: false });

  // Simulator
  const [simulatorCode, setSimulatorCode] = useState('ROYAL20');
  const [simulatorSubtotal, setSimulatorSubtotal] = useState('450');
  const [simulatorResult, setSimulatorResult] = useState(null);
  const [simulatorLoading, setSimulatorLoading] = useState(false);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await api.getOffers({ status: statusFilter });
      setOffers(res.data || []);
    } catch (err) {
      addToast(err.message || 'Failed to load offers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [statusFilter, refreshTrigger]);

  const handleToggleStatus = async (offer) => {
    if (!canModify) {
      addToast(`Role '${currentRole}' is not allowed to modify offers`, 'error');
      return;
    }
    try {
      await api.toggleOfferStatus(offer.id);
      addToast(`Offer '${offer.title}' status updated`, 'success');
      fetchOffers();
    } catch (err) {
      addToast(err.message || 'Failed to toggle offer status', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.offer) return;
    try {
      setDeleteModal(prev => ({ ...prev, loading: true }));
      await api.deleteOffer(deleteModal.offer.id);
      addToast(`Offer '${deleteModal.offer.title}' deleted successfully`, 'success');
      setDeleteModal({ isOpen: false, offer: null, loading: false });
      fetchOffers();
    } catch (err) {
      addToast(err.message || 'Failed to delete offer', 'error');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleTestSimulator = async (e) => {
    e.preventDefault();
    if (!simulatorCode.trim() || !simulatorSubtotal) return;

    try {
      setSimulatorLoading(true);
      setSimulatorResult(null);
      const res = await api.validateOffer(simulatorCode, parseFloat(simulatorSubtotal));
      setSimulatorResult({
        success: true,
        data: res,
      });
    } catch (err) {
      setSimulatorResult({
        success: false,
        message: err.message || 'Offer validation failed',
      });
    } finally {
      setSimulatorLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Percent className="w-5 h-5 text-neutral-900" />
            Offers & Promotional Discounts
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200">
              {offers.length} Campaigns
            </span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Create coupon codes, percentage discounts, flat bill rebates, min spend rules, and automatic expiry schedules.
          </p>
        </div>

        {canModify && (
          <button
            onClick={() => setModalState({ isOpen: true, offer: null })}
            className="px-3.5 py-2 bg-black hover:bg-neutral-800 text-white font-medium text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create Offer</span>
          </button>
        )}
      </div>

      {/* Interactive Offer Simulator Banner */}
      <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
        <div className="flex items-center gap-2 text-neutral-900 font-bold text-xs uppercase tracking-wider">
          <Calculator className="w-4 h-4 text-neutral-800" />
          <span>Promo Code & Bill Discount Validator</span>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed max-w-3xl">
          Test real-time promo code calculations against simulated bill subtotals to verify date validity, min order checks, and discount caps.
        </p>

        <form onSubmit={handleTestSimulator} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] text-neutral-600 mb-1 font-medium">Promo Code</label>
            <input
              type="text"
              value={simulatorCode}
              onChange={(e) => setSimulatorCode(e.target.value.toUpperCase())}
              placeholder="ROYAL20"
              className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-neutral-900 font-mono uppercase text-xs focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-[11px] text-neutral-600 mb-1 font-medium">Cart Subtotal (₹)</label>
            <input
              type="number"
              step="0.01"
              value={simulatorSubtotal}
              onChange={(e) => setSimulatorSubtotal(e.target.value)}
              placeholder="500.00"
              className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-neutral-900 font-mono text-xs focus:outline-none focus:border-black"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={simulatorLoading}
              className="w-full py-2 bg-black hover:bg-neutral-800 text-white font-medium text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{simulatorLoading ? 'Testing...' : 'Verify on Backend'}</span>
            </button>
          </div>

          <div className="flex items-center">
            {simulatorResult && (
              <div className={`p-2.5 rounded-lg border text-xs w-full ${
                simulatorResult.success
                  ? 'bg-white border-neutral-300 text-neutral-900'
                  : 'bg-white border-neutral-300 text-neutral-700'
              }`}>
                {simulatorResult.success ? (
                  <div>
                    <span className="font-semibold block">{simulatorResult.data.message}</span>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      Discount: ₹{simulatorResult.data.discount_amount}
                    </span>
                  </div>
                ) : (
                  <div>{simulatorResult.message}</div>
                )}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-neutral-200 pb-3 overflow-x-auto">
        {[
          { id: '', label: 'All Offers' },
          { id: 'active', label: 'Currently Active' },
          { id: 'scheduled', label: 'Scheduled' },
          { id: 'expired', label: 'Expired' },
          { id: 'inactive', label: 'Disabled' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === tab.id
                ? 'bg-black text-white font-semibold shadow-sm'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:text-black hover:bg-neutral-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Offers Cards Grid */}
      {loading ? (
        <div className="p-16 text-center space-y-3">
          <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-neutral-500 font-medium">Loading discount campaigns...</p>
        </div>
      ) : offers.length === 0 ? (
        <div className="p-16 text-center bg-white border border-dashed border-neutral-300 rounded-2xl space-y-1">
          <p className="text-sm font-semibold text-neutral-800">No campaigns found in this view.</p>
          <p className="text-xs text-neutral-500">Create a new offer or switch filter tabs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer) => {
            const isPercentage = offer.discount_type === 'percentage';
            const status = offer.status_label;

            return (
              <div
                key={offer.id}
                className="bg-white rounded-xl p-5 border border-neutral-200 hover:border-black shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 relative overflow-hidden"
              >
                {/* Coupon Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-neutral-100 text-neutral-900 border border-neutral-200">
                        {offer.badge_text || (isPercentage ? `${offer.discount_value}% OFF` : `₹${offer.discount_value} OFF`)}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-neutral-200 bg-white text-neutral-700">
                        {status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-neutral-900 leading-tight">{offer.title}</h3>
                  </div>

                  <div className="p-2 bg-neutral-50 border border-dashed border-neutral-300 rounded-lg text-center shrink-0">
                    <span className="text-[9px] uppercase font-bold text-neutral-400 block">Code</span>
                    <span className="text-xs font-mono font-bold text-neutral-900 tracking-wider">
                      {offer.code}
                    </span>
                  </div>
                </div>

                {/* Description & Rules */}
                <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">
                  {offer.description || 'Applicable at checkout on qualifying order totals.'}
                </p>

                {/* Details Breakdown */}
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1.5 text-xs text-neutral-700">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Discount:</span>
                    <span className="font-semibold text-neutral-900">
                      {isPercentage ? `${offer.discount_value}% Discount` : `Flat ₹${offer.discount_value} OFF`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Min Cart:</span>
                    <span className="font-mono">₹{offer.min_order_amount || '0.00'}</span>
                  </div>
                  {offer.max_discount_amount && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Max Limit:</span>
                      <span className="font-mono text-neutral-900 font-semibold">₹{offer.max_discount_amount}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-200">
                    <span className="text-neutral-500">Target Items:</span>
                    <span className="capitalize font-medium text-neutral-800">{offer.target_type}</span>
                  </div>
                </div>

                {/* Validity timeline */}
                <div className="text-[11px] text-neutral-400 space-y-1 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Valid: {new Date(offer.start_time).toLocaleDateString()} to {new Date(offer.end_time).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleStatus(offer)}
                    disabled={!canModify}
                    className={`flex items-center gap-1.5 text-xs font-semibold ${
                      offer.is_active ? 'text-neutral-900' : 'text-neutral-400'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{offer.is_active ? 'Active' : 'Disabled'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setModalState({ isOpen: true, offer })}
                      disabled={!canModify}
                      className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black rounded-lg transition-all"
                      title="Edit Campaign"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, offer, loading: false })}
                      disabled={!canModify}
                      className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-400 hover:text-black rounded-lg transition-all"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Offer Modal */}
      <OfferModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, offer: null })}
        offer={modalState.offer}
        categories={categories}
        onSaved={fetchOffers}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Promotional Offer?"
        message={`Are you sure you want to permanently delete offer "${deleteModal.offer?.title}" (${deleteModal.offer?.code})?`}
        confirmText="Delete Offer"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, offer: null, loading: false })}
        isLoading={deleteModal.loading}
      />

    </div>
  );
}
