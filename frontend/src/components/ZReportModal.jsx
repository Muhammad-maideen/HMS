import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  X, 
  Receipt, 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { api, getRole } from '../services/api';
import { useToast } from '../context/ToastContext';
import { printReceiptElement } from '../utils/printUtils';

export default function ZReportModal({ isOpen, onClose }) {
  const reportRef = useRef(null);
  const { addToast } = useToast();
  const currentRole = getRole();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  // Cashier Shift Balancing
  const [openingFloat, setOpeningFloat] = useState(() => {
    return localStorage.getItem('hms_opening_cash_float') || '1000';
  });
  const [actualCashCounted, setActualCashCounted] = useState('');

  // Thermal Width
  const paperWidth = localStorage.getItem('hms_printer_width') || '80mm';
  const is58mm = paperWidth === '58mm';

  useEffect(() => {
    localStorage.setItem('hms_opening_cash_float', openingFloat);
  }, [openingFloat]);

  const fetchZReport = async () => {
    try {
      setLoading(true);
      const res = await api.getZReport();
      setReportData(res.data);
    } catch (err) {
      addToast(err.message || 'Failed to load shift Z-Report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchZReport();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (reportRef.current) {
      printReceiptElement(reportRef.current, {
        title: 'Thermal Z-Report',
        paperWidth,
      });
    } else {
      window.print();
    }
  };

  const floatNum = parseFloat(openingFloat) || 0;
  const cashSales = reportData ? parseFloat(reportData.cash_sales || 0) : 0;
  const expectedCashInDrawer = floatNum + cashSales;
  const actualCash = parseFloat(actualCashCounted) || 0;
  const variance = actualCashCounted ? actualCash - expectedCashInDrawer : null;

  const restaurantName = localStorage.getItem('hms_restaurant_name') || 'ROYAL RESTAURANT';
  const cashierName = localStorage.getItem('hms_auth_user') || `${currentRole.toUpperCase()} #1`;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto print:p-0 print:bg-transparent print:static print:backdrop-blur-none print:filter-none print:overflow-visible font-sans"
    >
      
      {/* Modal Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`bg-white border border-neutral-200 rounded-3xl w-full p-6 shadow-2xl space-y-4 text-neutral-900 relative print:border-none print:shadow-none print:p-0 print:max-w-none print:static ${
        is58mm ? 'max-w-sm' : 'max-w-md'
      }`}>
        
        {/* Header (No-Print) */}
        <div className="no-print flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">Shift Register Closure (Z-Report)</h3>
              <p className="text-[11px] text-neutral-500">Official End-of-Day Terminal Reconciliation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-neutral-500 font-medium">Calculating today's shift totals...</p>
          </div>
        ) : reportData ? (
          <>
            {/* 4 Stat Overview Cards (No-Print) */}
            <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 bg-neutral-900 text-white rounded-2xl space-y-0.5 shadow-xs">
                <div className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Total Sales</div>
                <div className="text-lg font-black font-mono">₹{reportData.total_sales.toFixed(0)}</div>
                <div className="text-[10px] text-emerald-400 font-medium">{reportData.total_orders} bills today</div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-0.5 shadow-2xs">
                <div className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider flex items-center gap-1">
                  <Banknote className="w-3 h-3 text-emerald-600" />
                  <span>Cash Sales</span>
                </div>
                <div className="text-lg font-black font-mono text-emerald-950">₹{reportData.cash_sales.toFixed(0)}</div>
                <div className="text-[10px] text-emerald-700 font-medium">Physical cash</div>
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl space-y-0.5 shadow-2xs">
                <div className="text-[10px] text-sky-800 uppercase font-bold tracking-wider flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-sky-600" />
                  <span>UPI / QR</span>
                </div>
                <div className="text-lg font-black font-mono text-sky-950">₹{reportData.upi_sales.toFixed(0)}</div>
                <div className="text-[10px] text-sky-700 font-medium">Instant transfer</div>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl space-y-0.5 shadow-2xs">
                <div className="text-[10px] text-purple-800 uppercase font-bold tracking-wider flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-purple-600" />
                  <span>Card / POS</span>
                </div>
                <div className="text-lg font-black font-mono text-purple-950">₹{reportData.card_sales.toFixed(0)}</div>
                <div className="text-[10px] text-purple-700 font-medium">Card swipe</div>
              </div>
            </div>

            {/* Interactive Cash Drawer Balancing Inputs (No-Print) */}
            <div className="no-print space-y-3 p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-800">Cash Drawer Balancing</span>
                <span className="text-[10px] text-neutral-400 font-mono">Shift Reconciliation</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                    Opening Cash Float (₹)
                  </label>
                  <input
                    type="number"
                    value={openingFloat}
                    onChange={(e) => setOpeningFloat(e.target.value)}
                    placeholder="1000"
                    className="w-full bg-white border border-neutral-300 rounded-xl px-2.5 py-1.5 font-mono font-bold text-neutral-900 focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                    Physical Cash Counted (₹)
                  </label>
                  <input
                    type="number"
                    value={actualCashCounted}
                    onChange={(e) => setActualCashCounted(e.target.value)}
                    placeholder="Counted cash in drawer"
                    className="w-full bg-white border border-neutral-300 rounded-xl px-2.5 py-1.5 font-mono font-bold text-neutral-900 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Live Reconciliation Banner */}
              <div className="p-2.5 bg-white rounded-xl border border-neutral-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-neutral-400">Expected Cash in Drawer:</div>
                  <div className="font-mono font-bold text-neutral-900">
                    ₹{expectedCashInDrawer.toFixed(2)}
                  </div>
                </div>

                {variance !== null ? (
                  <div className="text-right">
                    <div className="text-[10px] text-neutral-400">Discrepancy:</div>
                    <div className={`font-mono font-bold ${
                      variance === 0 
                        ? 'text-emerald-600' 
                        : variance > 0 
                        ? 'text-blue-600' 
                        : 'text-red-600'
                    }`}>
                      {variance === 0 ? '✓ Balanced' : variance > 0 ? `+₹${variance.toFixed(2)} (Surplus)` : `-₹${Math.abs(variance).toFixed(2)} (Short)`}
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] text-neutral-400 italic">Enter counted cash to balance</span>
                )}
              </div>
            </div>

            {/* =========================================================
                PRINTABLE THERMAL Z-REPORT AREA
                ========================================================= */}
            <div ref={reportRef} className={`printable-zreport-area ${is58mm ? 'thermal-58mm' : 'thermal-80mm'} font-mono space-y-2.5 text-xs text-neutral-900`}>
              
              {/* Report Header */}
              <div className="text-center space-y-0.5 border-b border-dashed border-neutral-300 pb-2">
                <div className="font-bold text-xs uppercase tracking-wider">{restaurantName}</div>
                <div className="text-sm font-black uppercase tracking-tight">*** OFFICIAL Z-REPORT ***</div>
                <div className="text-[10px] text-neutral-500">END-OF-SHIFT REGISTER SUMMARY</div>
              </div>

              {/* Meta details */}
              <div className="text-[10px] space-y-0.5 text-neutral-600 border-b border-dashed border-neutral-300 pb-1.5">
                <div className="flex justify-between">
                  <span>Date:</span>
                  <strong className="text-neutral-900">{reportData.date}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Printed:</span>
                  <span>{reportData.report_timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <strong className="text-neutral-900">{cashierName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Bill Range:</span>
                  <span>{reportData.first_order_number} → {reportData.last_order_number}</span>
                </div>
              </div>

              {/* Total Orders & Volume */}
              <div className="space-y-1 border-b border-dashed border-neutral-300 pb-1.5">
                <div className="flex justify-between font-bold">
                  <span>Total Bills Punched:</span>
                  <span>{reportData.total_orders}</span>
                </div>
                <div className="flex justify-between text-[11px] text-neutral-500">
                  <span>• Dine-in: {reportData.dine_in_count}</span>
                  <span>• Takeaway: {reportData.takeaway_count}</span>
                  <span>• Delivery: {reportData.delivery_count}</span>
                </div>
                <div className="flex justify-between font-bold text-neutral-900 pt-1 border-t border-neutral-200">
                  <span>TOTAL SALES VOLUME:</span>
                  <span>₹{reportData.total_sales.toFixed(2)}</span>
                </div>
              </div>

              {/* Tender Breakdown */}
              <div className="space-y-1 border-b border-dashed border-neutral-300 pb-1.5">
                <div className="text-[10px] font-bold uppercase text-neutral-500">
                  Payment Method Breakdown:
                </div>
                <div className="flex justify-between">
                  <span>Cash Collections:</span>
                  <span className="font-bold font-mono">₹{reportData.cash_sales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>UPI / QR Collections:</span>
                  <span className="font-bold font-mono">₹{reportData.upi_sales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Card Collections:</span>
                  <span className="font-bold font-mono">₹{reportData.card_sales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600 text-[10px] pt-1 border-t border-neutral-200">
                  <span>Discounts Given:</span>
                  <span>₹{reportData.total_discounts.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600 text-[10px]">
                  <span>GST Tax Collected (5%):</span>
                  <span>₹{reportData.total_tax.toFixed(2)}</span>
                </div>
              </div>

              {/* Cash Drawer Reconciliation Slip */}
              <div className="space-y-1 border-b border-dashed border-neutral-300 pb-1.5">
                <div className="text-[10px] font-bold uppercase text-neutral-500">
                  Drawer Reconciliation:
                </div>
                <div className="flex justify-between">
                  <span>Opening Cash Float:</span>
                  <span className="font-mono">₹{floatNum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>+ Cash Revenue:</span>
                  <span className="font-mono">₹{cashSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>= Expected Cash:</span>
                  <span className="font-mono">₹{expectedCashInDrawer.toFixed(2)}</span>
                </div>
                {actualCashCounted && (
                  <>
                    <div className="flex justify-between text-neutral-800">
                      <span>Physical Cash Counted:</span>
                      <span className="font-mono font-bold">₹{actualCash.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1 border-t border-neutral-200">
                      <span>Variance / Discrepancy:</span>
                      <span className="font-mono">
                        {variance === 0 ? '₹0.00 (EXACT)' : `${variance > 0 ? '+' : ''}₹${variance?.toFixed(2)}`}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Signatures for manager handover */}
              <div className="pt-3 space-y-4 text-[10px] text-neutral-500">
                <div className="flex justify-between pt-4 border-t border-dotted border-neutral-400">
                  <span>Cashier Signature</span>
                  <span>Manager / Handover Sign</span>
                </div>
                <div className="text-center text-[9px] text-neutral-400">
                  *** END OF SHIFT REPORT ***
                </div>
              </div>

            </div>

            {/* Actions (No-Print) */}
            <div className="no-print pt-2 space-y-2">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
              >
                <Printer className="w-4 h-4 stroke-[2.5]" />
                <span>Print Thermal Z-Report ({paperWidth})</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium text-xs rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </>
        ) : null}

      </div>

    </div>
  );
}
