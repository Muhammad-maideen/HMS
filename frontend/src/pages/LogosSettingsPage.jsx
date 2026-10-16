import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  Sparkles, 
  UploadCloud, 
  Trash2, 
  Printer, 
  CheckCircle2, 
  Image as ImageIcon, 
  Building2, 
  Receipt, 
  RotateCcw, 
  Type, 
  Store, 
  Eye, 
  Check,
  QrCode,
  Smartphone
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ReceiptModal from '../components/ReceiptModal';
import DynamicUPIModal from '../components/DynamicUPIModal';

export default function LogosSettingsPage() {
  const { addToast } = useToast();

  const adminFileInputRef = useRef(null);
  const receiptFileInputRef = useRef(null);

  // Admin Logo state
  const [adminLogo, setAdminLogo] = useState(() => {
    return localStorage.getItem('hms_restaurant_logo') || '';
  });
  const [adminLogoError, setAdminLogoError] = useState(false);

  // Receipt Logo state
  const [receiptLogo, setReceiptLogo] = useState(() => {
    return localStorage.getItem('hms_receipt_logo') || '';
  });
  const [receiptLogoError, setReceiptLogoError] = useState(false);

  // Hotel / Restaurant Name for Receipts & Payments
  const [restaurantName, setRestaurantName] = useState(() => {
    return localStorage.getItem('hms_restaurant_name') || 'Star Biriyani';
  });

  // Display Option 1: Print Logo on Receipt
  const [printReceiptLogo, setPrintReceiptLogo] = useState(() => {
    return localStorage.getItem('hms_print_receipt_logo') !== 'false';
  });

  // Display Option 2: Print Hotel Name on Receipt
  const [printRestaurantName, setPrintRestaurantName] = useState(() => {
    return localStorage.getItem('hms_print_restaurant_name') !== 'false';
  });

  // Merchant UPI ID for Dynamic QR Scanner (empty by default for clean customer onboarding)
  const [upiId, setUpiId] = useState(() => {
    return localStorage.getItem('hms_upi_id') || '';
  });
  const [previewQrUrl, setPreviewQrUrl] = useState('');
  const [showTestUPIModal, setShowTestUPIModal] = useState(false);

  // Test Print Modal
  const [showTestReceipt, setShowTestReceipt] = useState(false);

  // Generate live preview QR code for the settings card
  useEffect(() => {
    const cleanUpi = upiId.trim();
    if (!cleanUpi) {
      setPreviewQrUrl('');
      return;
    }

    const upiUri = `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent(restaurantName || 'Restaurant')}&am=104.00&tr=DEMO-SETTINGS&cu=INR`;
    QRCode.toDataURL(upiUri, {
      width: 200,
      margin: 1.5,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then(url => setPreviewQrUrl(url))
      .catch(err => console.error('Failed to generate preview QR', err));
  }, [upiId, restaurantName]);

  // Sync state with storage events
  useEffect(() => {
    const syncAllSettings = () => {
      setAdminLogo(localStorage.getItem('hms_restaurant_logo') || '');
      setReceiptLogo(localStorage.getItem('hms_receipt_logo') || '');
      setRestaurantName(localStorage.getItem('hms_restaurant_name') || 'Restaurant');
      setPrintReceiptLogo(localStorage.getItem('hms_print_receipt_logo') !== 'false');
      setPrintRestaurantName(localStorage.getItem('hms_print_restaurant_name') !== 'false');
      setUpiId(localStorage.getItem('hms_upi_id') || '');
      setAdminLogoError(false);
      setReceiptLogoError(false);
    };

    window.addEventListener('storage', syncAllSettings);
    window.addEventListener('hms_logo_updated', syncAllSettings);
    window.addEventListener('hms_receipt_logo_updated', syncAllSettings);
    window.addEventListener('hms_receipt_settings_updated', syncAllSettings);
    window.addEventListener('hms_upi_updated', syncAllSettings);
    return () => {
      window.removeEventListener('storage', syncAllSettings);
      window.removeEventListener('hms_logo_updated', syncAllSettings);
      window.removeEventListener('hms_receipt_logo_updated', syncAllSettings);
      window.removeEventListener('hms_receipt_settings_updated', syncAllSettings);
      window.removeEventListener('hms_upi_updated', syncAllSettings);
    };
  }, []);

  // Save Hotel Name
  const handleUpdateRestaurantName = (newName) => {
    setRestaurantName(newName);
    localStorage.setItem('hms_restaurant_name', newName);
    window.dispatchEvent(new Event('hms_receipt_settings_updated'));
  };

  const handleSaveRestaurantName = () => {
    const trimmed = restaurantName.trim() || 'Restaurant';
    setRestaurantName(trimmed);
    localStorage.setItem('hms_restaurant_name', trimmed);
    window.dispatchEvent(new Event('hms_receipt_settings_updated'));
    addToast('Hotel / Restaurant Name saved successfully!', 'success');
  };

  const handleResetRestaurantName = () => {
    const defaultName = localStorage.getItem('hms_restaurant_name') || 'Restaurant';
    setRestaurantName(defaultName);
    localStorage.setItem('hms_restaurant_name', defaultName);
    window.dispatchEvent(new Event('hms_receipt_settings_updated'));
    addToast('Hotel Name refreshed', 'info');
  };

  // UPI ID Handlers
  const handleUpdateUpiId = (val) => {
    setUpiId(val);
  };

  const handleSaveUpiId = () => {
    const trimmed = upiId.trim();
    setUpiId(trimmed);
    if (trimmed) {
      localStorage.setItem('hms_upi_id', trimmed);
      window.dispatchEvent(new Event('hms_upi_updated'));
      addToast(`Merchant UPI ID saved: ${trimmed}. Terminal QR active!`, 'success');
    } else {
      localStorage.removeItem('hms_upi_id');
      window.dispatchEvent(new Event('hms_upi_updated'));
      addToast('Merchant UPI ID cleared. Enter a new UPI ID to enable QR payments.', 'info');
    }
  };

  const handleClearUpiId = () => {
    setUpiId('');
    localStorage.removeItem('hms_upi_id');
    window.dispatchEvent(new Event('hms_upi_updated'));
    addToast('Merchant UPI ID cleared.', 'info');
  };

  // Toggle Print Receipt Logo Option
  const handleTogglePrintReceiptLogo = (val) => {
    setPrintReceiptLogo(val);
    localStorage.setItem('hms_print_receipt_logo', String(val));
    window.dispatchEvent(new Event('hms_receipt_settings_updated'));
    addToast(val ? 'Logo will print on receipts' : 'Logo hidden from receipts', 'info');
  };

  // Toggle Print Restaurant Name Option
  const handleTogglePrintRestaurantName = (val) => {
    setPrintRestaurantName(val);
    localStorage.setItem('hms_print_restaurant_name', String(val));
    window.dispatchEvent(new Event('hms_receipt_settings_updated'));
    addToast(val ? 'Hotel Name will print on receipts' : 'Hotel Name hidden from receipts', 'info');
  };

  // Admin Logo Upload
  const handleAdminLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file (PNG, JPG, SVG, WebP)', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('Admin Logo must be under 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setAdminLogo(dataUrl);
      setAdminLogoError(false);
      localStorage.setItem('hms_restaurant_logo', dataUrl);
      window.dispatchEvent(new Event('hms_logo_updated'));
      addToast('Admin Panel Logo updated successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAdminLogo = () => {
    localStorage.removeItem('hms_restaurant_logo');
    setAdminLogo('');
    setAdminLogoError(false);
    window.dispatchEvent(new Event('hms_logo_updated'));
    if (adminFileInputRef.current) adminFileInputRef.current.value = '';
    addToast('Admin Panel Logo reset to default placeholder', 'info');
  };

  // Receipt Logo Upload
  const handleReceiptLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file (PNG, JPG, SVG, WebP)', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('Receipt Logo must be under 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setReceiptLogo(dataUrl);
      setReceiptLogoError(false);
      localStorage.setItem('hms_receipt_logo', dataUrl);
      window.dispatchEvent(new Event('hms_receipt_logo_updated'));
      addToast('Receipt Print Logo updated successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceiptLogo = () => {
    localStorage.removeItem('hms_receipt_logo');
    setReceiptLogo('');
    setReceiptLogoError(false);
    window.dispatchEvent(new Event('hms_receipt_logo_updated'));
    if (receiptFileInputRef.current) receiptFileInputRef.current.value = '';
    addToast('Receipt Logo removed. Receipts will print text header.', 'info');
  };

  const sampleOrder = {
    order_number: 'ORD-20261011-0001',
    order_type: 'dine_in',
    table_number: 'T-02',
    created_at: new Date().toISOString(),
    subtotal: 145.00,
    tax_amount: 7.25,
    discount_total: 0.00,
    applied_offer_code: '',
    final_total: 152.25,
    payment_method: 'UPI',
    items: [
      { quantity: 1, item_name: 'Mutton Zafrani Biryani', variant_name: 'Half Biryani', line_total: 145.00 },
    ]
  };

  return (
    <div className="p-6 pb-20 space-y-6 max-w-5xl mx-auto animate-fadeIn">
      
      {/* Hidden file inputs */}
      <input
        ref={adminFileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/svg+xml, image/webp"
        onChange={handleAdminLogoUpload}
        className="hidden"
      />
      <input
        ref={receiptFileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/svg+xml, image/webp"
        onChange={handleReceiptLogoUpload}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-neutral-900" />
            Branding & Receipt Bill Settings
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage your hotel name, thermal receipt bill header, and print options dynamically.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTestReceipt(true)}
          className="px-3.5 py-2 bg-neutral-900 hover:bg-black text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Preview & Test Print Bill</span>
        </button>
      </div>

      {/* =========================================================
          SECTION 1: HOTEL NAME & RECEIPT HEADER OPTIONS (BOTH OPTIONS)
          ========================================================= */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Hotel Name & Bill Header Options</h3>
              <p className="text-[11px] text-neutral-500">
                Customize your hotel name and choose whether to print the logo and/or hotel name on the bill
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 font-bold self-start sm:self-auto border border-neutral-200">
            Thermal Print Engine
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Hotel Name Input & Both Options Toggles */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Hotel Name Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Hotel / Restaurant Name (Printed on Bills)</span>
                </label>
                <button
                  type="button"
                  onClick={handleResetRestaurantName}
                  className="text-[11px] text-neutral-500 hover:text-black flex items-center gap-1 cursor-pointer transition-colors"
                  title="Reset to ROYAL RESTAURANT"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => handleUpdateRestaurantName(e.target.value)}
                  onBlur={handleSaveRestaurantName}
                  placeholder="e.g. ROYAL RESTAURANT"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/60 text-neutral-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={handleSaveRestaurantName}
                  className="px-4 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Save</span>
                </button>
              </div>
              <p className="text-[11px] text-neutral-500">
                This exact name will be rendered at the top of POS customer receipts, tax invoices, and kitchen order tokens.
              </p>
            </div>

            {/* 2. Both Options: Print Logo & Print Hotel Name */}
            <div className="p-4 bg-neutral-50/80 border border-neutral-200 rounded-xl space-y-3">
              <div className="text-xs font-bold text-neutral-900">
                Receipt Bill Header Display Settings (Both Options)
              </div>

              {/* Option 1: Print Logo on Receipt */}
              <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg border border-neutral-200/90 shadow-2xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-neutral-700" />
                    <span className="text-xs font-bold text-neutral-900">Print Logo on Bill</span>
                    {printReceiptLogo ? (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">
                        DISABLED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Include your graphic brand logo image at the top of the thermal bill
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={printReceiptLogo}
                    onChange={(e) => handleTogglePrintReceiptLogo(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>

              {/* Option 2: Print Hotel Name on Receipt */}
              <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg border border-neutral-200/90 shadow-2xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-neutral-700" />
                    <span className="text-xs font-bold text-neutral-900">Print Hotel Name on Bill</span>
                    {printRestaurantName ? (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">
                        DISABLED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Print the bold hotel/restaurant title text on the receipt header
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={printRestaurantName}
                    onChange={(e) => handleTogglePrintRestaurantName(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Live Receipt Header Visualizer */}
          <div className="lg:col-span-5 bg-neutral-100/70 border border-neutral-200 rounded-xl p-4 space-y-3 font-mono">
            <div className="flex items-center justify-between font-sans">
              <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-neutral-500" />
                <span>Live Bill Header Preview</span>
              </span>
              <span className="text-[10px] text-neutral-500 bg-white px-2 py-0.5 rounded border border-neutral-200 font-mono">
                80mm Roll
              </span>
            </div>

            {/* Simulated thermal bill paper top */}
            <div className="bg-white border border-dashed border-neutral-300 rounded-lg p-4 shadow-2xs space-y-2 text-center">
              {/* Receipt Logo section */}
              {printReceiptLogo && receiptLogo && !receiptLogoError && (
                <div className="border-b border-dashed border-neutral-300 pb-2 flex justify-center">
                  <img
                    src={receiptLogo}
                    alt="Receipt Logo Preview"
                    onError={() => setReceiptLogoError(true)}
                    className="max-h-12 max-w-[160px] object-contain mx-auto"
                  />
                </div>
              )}
              {printReceiptLogo && (!receiptLogo || receiptLogoError) && (
                <div className="border-b border-dashed border-neutral-300 pb-2 text-[10px] text-neutral-500 bg-neutral-50 p-2 rounded">
                  [Logo Option Enabled - No Logo Uploaded Below]
                </div>
              )}
              {!printReceiptLogo && (
                <div className="text-[10px] text-neutral-400 italic">
                  [Logo Hidden by Option]
                </div>
              )}

              {/* Hotel Name section */}
              {printRestaurantName && (
                <div className="space-y-0.5 pt-0.5">
                  <h4 className="font-bold text-sm text-neutral-900 uppercase tracking-tight">
                    {restaurantName || 'ROYAL RESTAURANT'}
                  </h4>
                  <div className="text-[10px] text-neutral-500">
                    Tax Invoice / Cash Receipt
                  </div>
                </div>
              )}
              {!printRestaurantName && (
                <div className="text-[10px] text-neutral-500 pt-0.5">
                  Tax Invoice / Cash Receipt
                </div>
              )}

              {/* Sample receipt order info teaser */}
              <div className="text-[10px] text-neutral-500 border-t border-dashed border-neutral-200 pt-1.5 space-y-0.5 text-left font-mono">
                <div className="flex justify-between">
                  <span>Order No:</span>
                  <span className="font-bold text-neutral-900">ORD-20261011-0001</span>
                </div>
                <div className="flex justify-between">
                  <span>Type / Table:</span>
                  <span className="font-bold text-neutral-900">DINE-IN • T-02</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] font-sans text-neutral-500 leading-tight">
              Settings update immediately across all POS bill print operations and dialogs.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================
          SECTION 2: DYNAMIC UPI SCANNER & PAYMENT SETTINGS
          ========================================================= */}
      <div id="section-upi-qr" className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Dynamic UPI QR Payment Settings</h3>
              <p className="text-[11px] text-neutral-500">
                Configure your merchant UPI ID (VPA) for dynamic customer scan payments on POS
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold self-start sm:self-auto border border-emerald-200">
            NPCI 2.0 Dynamic QR
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: UPI ID Input & Bank Presets */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. UPI ID Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Merchant UPI ID / VPA</span>
                </label>
                {upiId ? (
                  <button
                    type="button"
                    onClick={handleClearUpiId}
                    className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors font-medium"
                    title="Clear UPI ID"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear UPI ID</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-neutral-400 italic">Unconfigured</span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => handleUpdateUpiId(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveUpiId(); }}
                  placeholder="e.g. yourcafe@okaxis, merchant@paytm or 9876543210@upi"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/60 text-neutral-900 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all placeholder:text-neutral-400 placeholder:font-normal placeholder:font-sans"
                />
                <button
                  type="button"
                  onClick={handleSaveUpiId}
                  className="px-4 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Save</span>
                </button>
              </div>

              {/* Validation info */}
              <div className="flex items-center justify-between text-[11px] pt-0.5">
                {!upiId ? (
                  <span className="text-neutral-400">
                    Enter your merchant VPA to generate your instant payment QR
                  </span>
                ) : upiId.includes('@') ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Valid UPI VPA format</span>
                  </span>
                ) : (
                  <span className="text-amber-600 font-semibold">
                    Must include bank handle (e.g. @okaxis, @paytm, @upi)
                  </span>
                )}
                <span className="text-neutral-400 font-mono text-[10px]">
                  {upiId ? 'Active on POS' : 'Inactive on POS'}
                </span>
              </div>

              <p className="text-[11px] text-neutral-500">
                This UPI ID is embedded into the customer QR scanner and displayed on the checkout terminal. Customers scanning with Google Pay, PhonePe, Paytm, or BHIM will transfer funds directly to this ID.
              </p>
            </div>

            {/* 2. Common Handles Quick Select */}
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Common UPI Bank Handles
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['@okhdfcbank', '@okaxis', '@oksbi', '@paytm', '@ybl', '@ibl', '@upi'].map(handle => (
                  <button
                    key={handle}
                    type="button"
                    onClick={() => {
                      const base = upiId ? (upiId.includes('@') ? upiId.split('@')[0] : upiId) : 'mybusiness';
                      handleUpdateUpiId(`${base}${handle}`);
                    }}
                    className="px-2 py-1 text-[11px] bg-white border border-neutral-200 hover:border-black rounded-lg font-mono text-neutral-700 hover:text-black transition-all cursor-pointer shadow-2xs"
                  >
                    {handle}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Dynamic QR Preview */}
          <div className="lg:col-span-5 bg-neutral-100/70 border border-neutral-200 rounded-xl p-4 space-y-3 font-mono">
            <div className="flex items-center justify-between font-sans">
              <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-neutral-500" />
                <span>Live UPI Scanner Preview</span>
              </span>
              <button
                type="button"
                onClick={() => setShowTestUPIModal(true)}
                className="text-[10px] text-neutral-900 bg-white hover:bg-neutral-50 px-2.5 py-1 rounded-lg border border-neutral-300 font-bold font-sans cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
              >
                <Smartphone className="w-3 h-3" />
                <span>Test Modal</span>
              </button>
            </div>

            {/* Simulated Scanner Display */}
            <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs space-y-2.5 text-center">
              <div className="font-sans font-bold text-sm text-neutral-900">
                {restaurantName || 'Restaurant'}
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 text-[10px] font-mono font-bold border border-neutral-200">
                <span className="text-neutral-400 font-sans">UPI ID:</span>
                <span className={upiId ? 'text-neutral-900' : 'text-neutral-400 italic'}>
                  {upiId || 'Not Configured'}
                </span>
              </div>

              <div className="py-1 px-2 rounded-lg bg-neutral-50 border border-neutral-200/80 font-sans">
                <div className="text-[9px] text-neutral-400 uppercase font-bold">Sample Amount</div>
                <div className="text-lg font-black font-mono text-neutral-900">₹104.00</div>
              </div>

              {/* QR Code */}
              <div className="flex justify-center p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                {previewQrUrl ? (
                  <img src={previewQrUrl} alt="Preview QR" className="w-32 h-32 object-contain" />
                ) : (
                  <div className="w-32 h-32 flex flex-col items-center justify-center p-2 text-center text-neutral-400 bg-neutral-100/50 rounded-lg border border-dashed border-neutral-300">
                    <QrCode className="w-7 h-7 text-neutral-300 mb-1" />
                    <span className="text-[10px] font-sans font-medium text-neutral-400">
                      Enter UPI ID to preview QR
                    </span>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-neutral-400 font-sans">
                Updates instantly on live POS checkout
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 2 Side-by-Side Logo Management Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PANEL 1: ADMIN PANEL LOGO */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Admin Panel Logo</h3>
                  <p className="text-[11px] text-neutral-500">Displayed at the top of the sidebar navigation</p>
                </div>
              </div>
              {adminLogo && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Custom Active
                </span>
              )}
            </div>

            {/* Admin Logo Preview Box */}
            <div className="p-6 rounded-xl bg-neutral-50/70 border border-neutral-200 flex flex-col items-center justify-center min-h-[160px] text-center">
              {adminLogo && !adminLogoError ? (
                <div className="space-y-2">
                  <img
                    src={adminLogo}
                    alt="Admin Logo Preview"
                    onError={() => setAdminLogoError(true)}
                    className="max-h-16 max-w-[240px] object-contain mx-auto"
                  />
                  <span className="text-[10px] text-neutral-400 block font-mono">
                    Current active admin logo
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5 text-neutral-400">
                  <ImageIcon className="w-8 h-8 mx-auto stroke-1" />
                  <p className="text-xs font-semibold text-neutral-600">Default Placeholder Active</p>
                  <p className="text-[11px] text-neutral-400 max-w-xs">
                    Upload your restaurant brand emblem to appear at the top of the admin sidebar.
                  </p>
                </div>
              )}
            </div>

            <div className="text-[11px] text-neutral-500 space-y-1">
              <p>• Recommended format: <strong>PNG or SVG</strong> with transparent background.</p>
              <p>• Ideal aspect ratio: Horizontal banner (~200px × 50px).</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-neutral-100 flex items-center gap-2">
            <button
              type="button"
              onClick={() => adminFileInputRef.current?.click()}
              className="flex-1 py-2.5 px-3 bg-black hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{adminLogo ? 'Change Admin Logo' : 'Upload Admin Logo'}</span>
            </button>

            {adminLogo && (
              <button
                type="button"
                onClick={handleRemoveAdminLogo}
                className="py-2.5 px-3 bg-neutral-100 hover:bg-red-50 text-neutral-600 hover:text-red-600 hover:border-red-200 border border-neutral-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                title="Reset to default"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* PANEL 2: RECEIPT PRINT LOGO */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Receipt Print Logo</h3>
                  <p className="text-[11px] text-neutral-500">Printed at the top of POS bills & tax invoices</p>
                </div>
              </div>
              {receiptLogo && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Custom Active
                </span>
              )}
            </div>

            {/* Receipt Logo Preview Box (Receipt Mockup) */}
            <div className="p-6 rounded-xl bg-neutral-50/70 border border-neutral-200 flex flex-col items-center justify-center min-h-[160px] text-center font-mono">
              {receiptLogo && !receiptLogoError ? (
                <div className="space-y-2 border border-dashed border-neutral-300 p-4 bg-white rounded-lg shadow-xs max-w-xs w-full">
                  <img
                    src={receiptLogo}
                    alt="Receipt Logo Preview"
                    onError={() => setReceiptLogoError(true)}
                    className="max-h-14 max-w-[180px] object-contain mx-auto"
                  />
                  <div className="border-t border-dashed border-neutral-200 pt-1 text-[10px] text-neutral-500 uppercase tracking-wider">
                    RECEIPT LOGO ACTIVE
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-neutral-400">
                  <Receipt className="w-8 h-8 mx-auto stroke-1" />
                  <p className="text-xs font-semibold text-neutral-600">No Receipt Logo Uploaded</p>
                  <p className="text-[11px] text-neutral-400 max-w-xs">
                    Upload your custom receipt logo to print at the top of customer bills.
                  </p>
                </div>
              )}
            </div>

            <div className="text-[11px] text-neutral-500 space-y-1">
              <p>• Optimized for thermal paper: <strong>Black & white or high-contrast PNG</strong>.</p>
              <p>• Works on standard 80mm thermal printers and desktop A4 printers.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-neutral-100 flex items-center gap-2">
            <button
              type="button"
              onClick={() => receiptFileInputRef.current?.click()}
              className="flex-1 py-2.5 px-3 bg-black hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{receiptLogo ? 'Change Receipt Logo' : 'Upload Receipt Logo'}</span>
            </button>

            {receiptLogo && (
              <button
                type="button"
                onClick={handleRemoveReceiptLogo}
                className="py-2.5 px-3 bg-neutral-100 hover:bg-red-50 text-neutral-600 hover:text-red-600 hover:border-red-200 border border-neutral-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                title="Reset to default"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Test Print Modal */}
      {showTestReceipt && (
        <ReceiptModal
          order={sampleOrder}
          onClose={() => setShowTestReceipt(false)}
          isTestPrint={true}
        />
      )}

      {/* Test Dynamic UPI Modal */}
      {showTestUPIModal && (
        <DynamicUPIModal
          isOpen={showTestUPIModal}
          onClose={() => setShowTestUPIModal(false)}
          amount={104.00}
          orderNumber="DEMO-104"
          onConfirmPayment={() => setShowTestUPIModal(false)}
        />
      )}

    </div>
  );
}
