import React, { useState, useEffect, useRef } from 'react';
import { Printer, X, CheckCircle2, Scissors, Utensils, Receipt as ReceiptIcon } from 'lucide-react';
import { printReceiptElement } from '../utils/printUtils';

export default function ReceiptModal({ order, onClose, isTestPrint = false }) {
  const receiptRef = useRef(null);
  const [receiptLogo, setReceiptLogo] = useState(() => {
    return localStorage.getItem('hms_receipt_logo') || '';
  });
  const [logoError, setImageError] = useState(false);

  // Hotel / Restaurant Name
  const [restaurantName, setRestaurantName] = useState(() => {
    return localStorage.getItem('hms_restaurant_name') || 'ROYAL RESTAURANT';
  });

  // Display Option 1: Print Logo on Receipt
  const [printReceiptLogo, setPrintReceiptLogo] = useState(() => {
    return localStorage.getItem('hms_print_receipt_logo') !== 'false';
  });

  // Display Option 2: Print Hotel Name on Receipt
  const [printRestaurantName, setPrintRestaurantName] = useState(() => {
    return localStorage.getItem('hms_print_restaurant_name') !== 'false';
  });

  // Thermal Printer Roll Width ('80mm' or '58mm')
  const [paperWidth, setPaperWidth] = useState(() => {
    return localStorage.getItem('hms_printer_width') || '80mm';
  });

  // Dual Print Kitchen/Collection Token Slip
  const [includeTokenSlip, setIncludeTokenSlip] = useState(() => {
    return localStorage.getItem('hms_print_token_slip') !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('hms_printer_width', paperWidth);
  }, [paperWidth]);

  useEffect(() => {
    localStorage.setItem('hms_print_token_slip', includeTokenSlip);
  }, [includeTokenSlip]);

  useEffect(() => {
    const handleUpdate = () => {
      setReceiptLogo(localStorage.getItem('hms_receipt_logo') || '');
      setRestaurantName(localStorage.getItem('hms_restaurant_name') || 'ROYAL RESTAURANT');
      setPrintReceiptLogo(localStorage.getItem('hms_print_receipt_logo') !== 'false');
      setPrintRestaurantName(localStorage.getItem('hms_print_restaurant_name') !== 'false');
      setImageError(false);
    };
    window.addEventListener('hms_receipt_logo_updated', handleUpdate);
    window.addEventListener('hms_receipt_settings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('hms_receipt_logo_updated', handleUpdate);
      window.removeEventListener('hms_receipt_settings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleToggleLogo = (checked) => {
    setPrintReceiptLogo(checked);
    localStorage.setItem('hms_print_receipt_logo', String(checked));
    window.dispatchEvent(new Event('hms_receipt_settings_updated'));
  };

  const handleToggleHotelName = (checked) => {
    setPrintRestaurantName(checked);
    localStorage.setItem('hms_print_restaurant_name', String(checked));
    window.dispatchEvent(new Event('hms_receipt_settings_updated'));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!order) return null;

  const handlePrint = () => {
    if (receiptRef.current) {
      printReceiptElement(receiptRef.current, {
        title: `Receipt-${order.order_number || 'Order'}`,
        paperWidth,
      });
    } else {
      window.print();
    }
  };

  const hasLogo = Boolean(receiptLogo) && !logoError;
  const is58mm = paperWidth === '58mm';
  const tokenNumber = order.id ? String(order.id).slice(-3).padStart(3, '0') : order.order_number?.slice(-3) || '001';

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs animate-fadeIn p-3 sm:p-6 flex justify-center items-start min-h-screen print:p-0 print:bg-transparent print:static print:backdrop-blur-none print:filter-none print:overflow-visible"
    >
      
      {/* Modal Card - With my-auto so it centers when fits, but doesn't get clipped at top if tall */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`my-auto bg-white border border-neutral-200 rounded-3xl w-full p-5 sm:p-6 shadow-2xl space-y-4 font-mono text-neutral-900 relative print:border-none print:shadow-none print:p-0 print:max-w-none print:static ${
        is58mm ? 'max-w-xs text-[11px]' : 'max-w-sm text-xs'
      }`}>
        
        {/* Controls Bar (Hidden on Print) */}
        <div className="no-print space-y-2.5 pb-3 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-sans font-bold text-sm text-neutral-900">
              <Printer className="w-4 h-4" />
              <span>{isTestPrint ? 'Thermal Receipt Test Preview' : 'Thermal Receipt Preview'}</span>
            </div>
            
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Close Receipt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Test Bill Print Options (Only appears in Test Print, NOT in Live POS Bill) */}
          {isTestPrint && (
            <div className="space-y-2.5 pt-1 animate-fadeIn">
              {/* Width Selector & Token Slip */}
              <div className="flex items-center justify-between gap-2 font-sans text-xs">
                {/* 80mm vs 58mm Preset */}
                <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setPaperWidth('80mm')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      paperWidth === '80mm'
                        ? 'bg-black text-white shadow-2xs'
                        : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    80mm Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperWidth('58mm')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      paperWidth === '58mm'
                        ? 'bg-black text-white shadow-2xs'
                        : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    58mm Mini Roll
                  </button>
                </div>

                {/* Token Slip Checkbox */}
                <label className="flex items-center gap-1.5 text-[11px] text-neutral-700 font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeTokenSlip}
                    onChange={(e) => setIncludeTokenSlip(e.target.checked)}
                    className="rounded border-neutral-300 accent-black text-black w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>+ Token Slip</span>
                </label>
              </div>

              {/* Both Options: Print Logo & Print Hotel Name Quick Toggles */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 font-sans text-[11px] text-neutral-700">
                {/* Option 1: Print Logo */}
                <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-black transition-colors" title="Toggle Logo on Receipt">
                  <input
                    type="checkbox"
                    checked={printReceiptLogo}
                    onChange={(e) => handleToggleLogo(e.target.checked)}
                    className="rounded border-neutral-300 accent-black text-black w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="font-semibold">Logo</span>
                </label>

                {/* Option 2: Print Hotel Name */}
                <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-black transition-colors" title="Toggle Hotel Name on Receipt">
                  <input
                    type="checkbox"
                    checked={printRestaurantName}
                    onChange={(e) => handleToggleHotelName(e.target.checked)}
                    className="rounded border-neutral-300 accent-black text-black w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="font-semibold">Hotel Name</span>
                </label>

                <span className="text-[10px] text-neutral-400 font-mono">
                  Test Preview
                </span>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================
            PRINTABLE THERMAL RECEIPT AREA (Customer Bill + Token Slip)
            ========================================================= */}
        <div ref={receiptRef} className={`printable-receipt-area ${is58mm ? 'thermal-58mm' : 'thermal-80mm'} space-y-3 pt-1`}>
          
          {/* Header & Logo */}
          {printReceiptLogo && hasLogo && (
            <div className="text-center border-b border-dashed border-neutral-300 pb-2 pt-1">
              <div className="flex justify-center items-center">
                <img
                  src={receiptLogo}
                  alt="Receipt Logo"
                  onError={() => setImageError(true)}
                  className={`object-contain ${is58mm ? 'max-h-12 max-w-[140px]' : 'max-h-16 max-w-[180px]'}`}
                />
              </div>
            </div>
          )}

          {/* Business Name Header */}
          <div className="text-center space-y-0.5">
            {printRestaurantName && (
              <h4 className={`font-bold tracking-tight text-neutral-900 ${is58mm ? 'text-xs' : 'text-sm'}`}>
                {restaurantName || 'ROYAL RESTAURANT'}
              </h4>
            )}
            <div className="text-[10px] text-neutral-500">
              Tax Invoice / Cash Receipt
            </div>
          </div>

          {/* Meta Info */}
          <div className="space-y-0.5 text-neutral-700 text-[11px] border-t border-b border-dashed border-neutral-300 py-1.5">
            <div className="flex justify-between">
              <span>Order No:</span>
              <strong className="text-neutral-900 font-bold">{order.order_number}</strong>
            </div>
            <div className="flex justify-between">
              <span>Type:</span>
              <strong className="text-neutral-900 uppercase font-bold">{order.order_type}</strong>
            </div>
            {order.table_number && (
              <div className="flex justify-between">
                <span>Table:</span>
                <strong className="text-neutral-900 font-bold">{order.table_number}</strong>
              </div>
            )}
            <div className="flex justify-between text-[10px] text-neutral-500">
              <span>Date:</span>
              <span>{new Date(order.created_at || Date.now()).toLocaleString()}</span>
            </div>
          </div>

          {/* Line Items Snapshot */}
          <div className="space-y-1.5 py-1">
            <div className="flex justify-between font-bold border-b border-dashed border-neutral-300 pb-1 text-[10px] uppercase">
              <span>Item / Qty</span>
              <span>Amount</span>
            </div>
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-neutral-800 gap-1 leading-snug">
                <div className="flex-1 pr-1">
                  <div className="font-semibold">{item.quantity}x {item.item_name}</div>
                  {item.variant_name && item.variant_name !== 'Custom / Open Item' && (
                    <div className="text-[10px] text-neutral-500 font-sans">({item.variant_name})</div>
                  )}
                </div>
                <div className="font-bold text-neutral-900 shrink-0">
                  ₹{parseFloat(item.line_total).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-1 text-neutral-700 text-xs border-t border-dashed border-neutral-300 pt-1.5">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono text-neutral-900 font-medium">₹{parseFloat(order.subtotal || 0).toFixed(2)}</span>
            </div>
            {parseFloat(order.discount_total || 0) > 0 && (
              <div className="flex justify-between text-neutral-900 font-bold">
                <span>Discount ({order.applied_offer_code || 'Promo'}):</span>
                <span>-₹{parseFloat(order.discount_total).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>GST Tax (5%):</span>
              <span className="font-mono text-neutral-900 font-medium">₹{parseFloat(order.tax_amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-neutral-900 pt-1.5 border-t border-neutral-300">
              <span>TOTAL PAID:</span>
              <span>₹{parseFloat(order.final_total || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Details */}
          <div className="pt-1.5 text-center text-[10px] text-neutral-500 border-t border-dashed border-neutral-300 space-y-0.5">
            <div>
              Payment: <strong className="font-bold text-neutral-800 uppercase">{order.payment_method || 'CASH'}</strong>
            </div>
            <div className="text-[10px] text-neutral-600 font-medium">
              Thank you for dining with us!
            </div>
          </div>

          {/* =========================================================
              PHASE 3 FEATURE: KITCHEN / TOKEN SLIP (DUAL PRINT)
              ========================================================= */}
          {includeTokenSlip && (
            <div className="pt-3 space-y-2 border-t-2 border-dashed border-black">
              
              {/* Scissor Tear Indicator */}
              <div className="text-center text-[10px] font-bold text-neutral-500 tracking-widest flex items-center justify-center gap-1">
                <Scissors className="w-3 h-3 rotate-90" />
                <span>TEAR HERE FOR KITCHEN</span>
                <Scissors className="w-3 h-3 -rotate-90" />
              </div>

              {/* Kitchen Token Box */}
              <div className="p-2 border-2 border-black rounded-lg text-center space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider bg-black text-white py-0.5 rounded">
                  *** KITCHEN ORDER TOKEN ***
                </div>
                
                <div className="text-2xl font-black font-mono tracking-tight text-neutral-900">
                  TOKEN #{tokenNumber}
                </div>

                <div className="text-xs font-bold uppercase text-neutral-800">
                  {order.order_type === 'dine_in' ? `DINE-IN • TABLE ${order.table_number || 'N/A'}` : order.order_type}
                </div>

                <div className="text-[10px] text-neutral-500">
                  Time: {new Date(order.created_at || Date.now()).toLocaleTimeString()}
                </div>
              </div>

              {/* Kitchen Items Checklist with Large Bold Quantities */}
              <div className="space-y-1 pt-1">
                <div className="font-bold text-[10px] uppercase border-b border-neutral-300 pb-0.5">
                  Items to Prepare:
                </div>
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-xs font-bold text-neutral-900 py-0.5">
                    <span className="font-mono text-sm px-1.5 py-0.2 bg-neutral-100 rounded border border-neutral-300 shrink-0">
                      {item.quantity}x
                    </span>
                    <div className="flex-1 min-w-0">
                      <span>{item.item_name}</span>
                      {item.variant_name && item.variant_name !== 'Custom / Open Item' && (
                        <span className="text-[10px] text-neutral-600 block font-normal">
                          ({item.variant_name})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center text-[9px] text-neutral-400 pt-1 border-t border-dashed border-neutral-300">
                End of Token Slip #{tokenNumber}
              </div>

            </div>
          )}

        </div>

        {/* Action Buttons (Hidden on Print) */}
        <div className="pt-2 flex flex-col gap-2 no-print font-sans">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full py-3 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            <span>Print {paperWidth} Receipt {includeTokenSlip ? '+ Token Slip' : ''}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Close Preview</span>
            <kbd className="text-[10px] text-neutral-400 font-mono">Esc</kbd>
          </button>
        </div>

      </div>

    </div>
  );
}
