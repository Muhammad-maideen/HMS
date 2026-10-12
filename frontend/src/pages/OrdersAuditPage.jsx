import React, { useState, useEffect } from 'react';
import { ReceiptText, Search, RefreshCw, Eye, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import ReceiptModal from '../components/ReceiptModal';

export default function OrdersAuditPage({ refreshTrigger }) {
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders({ search });
      setOrders(res.data || []);
    } catch (err) {
      addToast(err.message || 'Failed to load order history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, refreshTrigger]);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-neutral-900" />
            Order Billing History & Audit Vault
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200">
              {orders.length} Invoices Recorded
            </span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Verification vault for customer invoices. Line items, unit prices, discounts, and totals are permanently preserved at checkout time.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="p-2 text-neutral-600 hover:text-black bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg shadow-sm transition-all self-start md:self-auto"
          title="Refresh Orders"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-black' : ''}`} />
        </button>
      </div>

      {/* Security Guarantee Banner */}
      <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center gap-2.5 text-xs text-neutral-700">
        <ShieldCheck className="w-4 h-4 text-neutral-900 shrink-0" />
        <span>
          <strong>Audit Compliance:</strong> Any subsequent edits made to menu items, offer percentages, or combo deals will <strong>never</strong> alter these previously generated records.
        </span>
      </div>

      {/* Search */}
      <div className="bg-white border border-neutral-200 rounded-xl p-3.5 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number (e.g. ORD-2026...) or customer..."
            className="w-full bg-white border border-neutral-200 rounded-lg pl-9 pr-3.5 py-1.5 text-neutral-900 text-xs placeholder:text-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
          />
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="p-16 text-center space-y-3">
          <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-neutral-500 font-medium">Loading invoice logs...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-16 text-center bg-white border border-dashed border-neutral-300 rounded-2xl space-y-1">
          <p className="text-sm font-semibold text-neutral-800">No invoices found.</p>
          <p className="text-xs text-neutral-500">Go to Live POS Terminal to simulate and place test orders.</p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider font-semibold text-[11px] border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Invoice / Time</th>
                  <th className="py-3 px-4">Order Type</th>
                  <th className="py-3 px-4">Items Count</th>
                  <th className="py-3 px-4">Applied Offer</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Bill Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">View Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-neutral-900 block text-xs">{ord.order_number}</span>
                      <span className="text-[10px] text-neutral-400">
                        {new Date(ord.created_at).toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3 px-4 uppercase text-neutral-700 text-[11px]">
                      {ord.order_type} {ord.table_number && `(${ord.table_number})`}
                    </td>

                    <td className="py-3 px-4 text-neutral-600">
                      {ord.items?.length || 0} items
                    </td>

                    <td className="py-3 px-4">
                      {ord.applied_offer_code ? (
                        <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-900 text-[10px] font-medium border border-neutral-200">
                          {ord.applied_offer_code}
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-neutral-600">
                      {ord.discount_total > 0 ? (
                        <span className="text-neutral-900 font-semibold">-₹{ord.discount_total}</span>
                      ) : (
                        '₹0.00'
                      )}
                    </td>

                    <td className="py-3 px-4 font-bold text-neutral-900 text-xs">
                      ₹{ord.final_total}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200 text-[10px] font-medium uppercase">
                        {ord.payment_status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 hover:text-black rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historical Bill Modal with Print & Dynamic Receipt Logo */}
      {selectedOrder && (
        <ReceiptModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

    </div>
  );
}
