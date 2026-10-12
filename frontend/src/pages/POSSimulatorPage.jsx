import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ShoppingBag, 
  ShoppingCart,
  Plus, 
  Minus, 
  Trash2, 
  Receipt, 
  Printer, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Layers, 
  Utensils,
  Zap,
  PauseCircle,
  PlayCircle,
  Keyboard,
  Search,
  X,
  Clock,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Check,
  AlertCircle,
  Tag,
  Package,
  Truck,
  SlidersHorizontal,
  MoreVertical,
  Bookmark,
  Users,
  DollarSign,
  ArrowRight,
  ChevronDown,
  FileText
} from 'lucide-react';
import { api, getRole } from '../services/api';
import { useToast } from '../context/ToastContext';
import ReceiptModal from '../components/ReceiptModal';
import POSKeyboardShortcutsModal from '../components/POSKeyboardShortcutsModal';
import DynamicUPIModal from '../components/DynamicUPIModal';
import CustomItemModal from '../components/CustomItemModal';
import ZReportModal from '../components/ZReportModal';
import VariantSelectModal from '../components/VariantSelectModal';
import { posAudio } from '../utils/posAudio';
import { getTables, onTablesChange } from '../services/tablesService';

// Food images fallback pool matching RestoDash items
const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=360&auto=format&fit=crop&q=80', // Grilled chicken
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=360&auto=format&fit=crop&q=80', // Beef Burger
  'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=360&auto=format&fit=crop&q=80', // Margherita Pizza
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=360&auto=format&fit=crop&q=80', // Caesar Salad
  'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=360&auto=format&fit=crop&q=80', // French Fries
  'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=360&auto=format&fit=crop&q=80', // Chicken Pasta
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=360&auto=format&fit=crop&q=80', // Chocolate Cake
  'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=360&auto=format&fit=crop&q=80', // Lemonade
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=360&auto=format&fit=crop&q=80', // Hot Coffee
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=360&auto=format&fit=crop&q=80', // Veg Sandwich
  'https://images.unsplash.com/photo-1619895092538-128341789043?w=360&auto=format&fit=crop&q=80', // Garlic Bread
  'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=360&auto=format&fit=crop&q=80', // Ice Cream
];

const getItemImage = (item, index = 0) => {
  if (item?.image_url && item.image_url.trim().length > 5) {
    return item.image_url;
  }
  const idx = Math.abs((Number(item?.id) || index) % FOOD_IMAGES.length);
  return FOOD_IMAGES[idx];
};

// Helper: Standardized PLU codes
const getProductPLU = (p) => {
  if (!p) return '';
  return String(100 + Number(p.id));
};

const getComboPLU = (c) => {
  if (!c) return '';
  return `C${c.id}`;
};

// Relative time helper
const getTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

export default function POSSimulatorPage({ onOrderPlaced, onLogout, externalSearch = '' }) {
  const { addToast } = useToast();
  const currentRole = getRole();

  const [products, setProducts] = useState([]);
  const [combos, setCombos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');

  // Top KPI Stats (Matches RestoDash 4 KPI Cards)
  const [statsData, setStatsData] = useState({
    today_revenue: 1250.00,
    today_orders: 32,
    customers_count: 28,
    total_due: 320.50,
  });

  // Cart state persisted in localStorage
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orderType, setOrderType] = useState(() => {
    return localStorage.getItem('pos_order_type') || 'dine_in';
  });

  const [tableNumber, setTableNumber] = useState(() => {
    return localStorage.getItem('pos_table_number') || 'T-01';
  });

  const [isEditingTable, setIsEditingTable] = useState(false);
  const [diningTables, setDiningTables] = useState(() => getTables());
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const tablePickerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onTablesChange((updated) => {
      setDiningTables(updated);
    });
    return unsubscribe;
  }, []);

  const [customerName, setCustomerName] = useState(() => {
    return localStorage.getItem('pos_customer_name') || 'Walk-in Guest';
  });

  const [customerPhone, setCustomerPhone] = useState(() => {
    return localStorage.getItem('pos_customer_phone') || '+91 98450 12345';
  });

  const [paymentMethod, setPaymentMethod] = useState(() => {
    return localStorage.getItem('pos_payment_method') || 'cash';
  });

  // Promo Code
  const [promoCode, setPromoCode] = useState(() => {
    return localStorage.getItem('pos_promo_code') || '';
  });

  const [appliedOffer, setAppliedOffer] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_applied_offer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [validatingOffer, setValidatingOffer] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Speed Punch & Barcode states
  const speedInputRef = useRef(null);
  const [speedQuery, setSpeedQuery] = useState('');
  const [speedDropdownOpen, setSpeedDropdownOpen] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showSpeedBar, setShowSpeedBar] = useState(false);

  // Parked Bills (Hold / Recall)
  const [parkedBills, setParkedBills] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_parked_bills');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const barcodeBufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  // Surcharges & Modals
  const [parcelChargeEnabled, setParcelChargeEnabled] = useState(false);
  const [deliveryChargeEnabled, setDeliveryChargeEnabled] = useState(false);
  const [autoRoundOff, setAutoRoundOff] = useState(true);
  const [tenderAmount, setTenderAmount] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const [showUPIModal, setShowUPIModal] = useState(false);
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [showZReportModal, setShowZReportModal] = useState(false);
  const [selectedProductForVariantModal, setSelectedProductForVariantModal] = useState(null);
  const [cartMenuOpen, setCartMenuOpen] = useState(false);
  const cartMenuRef = useRef(null);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pos_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('pos_order_type', orderType);
  }, [orderType]);

  useEffect(() => {
    localStorage.setItem('pos_table_number', tableNumber);
  }, [tableNumber]);

  useEffect(() => {
    localStorage.setItem('pos_payment_method', paymentMethod);
  }, [paymentMethod]);

  useEffect(() => {
    try {
      localStorage.setItem('pos_parked_bills', JSON.stringify(parkedBills));
    } catch (e) {
      console.error(e);
    }
  }, [parkedBills]);

  // Load Catalog & Stats Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodsRes, combosRes, catsRes, statsRes] = await Promise.all([
        api.getProducts({ all: '1', is_active: '1' }),
        api.getCombos({ active_only: '1' }),
        api.getCategories({ active_only: '1' }),
        api.getDashboardStats().catch(() => null),
      ]);
      setProducts(prodsRes.data || []);
      setCombos(combosRes.data || []);
      setCategories(catsRes.data || []);

      if (statsRes && statsRes.data) {
        setStatsData({
          today_revenue: statsRes.data.today_revenue > 0 ? statsRes.data.today_revenue : 1250.00,
          today_orders: statsRes.data.today_orders > 0 ? statsRes.data.today_orders : 32,
          customers_count: Math.max(statsRes.data.today_orders || 0, 28),
          total_due: statsRes.data.out_of_stock_count ? statsRes.data.out_of_stock_count * 40 : 320.50,
        });
      }
    } catch (err) {
      addToast(err.message || 'Failed to load POS catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for external open modal events from TopNavbar or Sidebar
  useEffect(() => {
    const openZ = () => setShowZReportModal(true);
    const openK = () => setShowShortcutsModal(true);
    window.addEventListener('hms_open_zreport', openZ);
    window.addEventListener('hms_open_shortcuts', openK);
    return () => {
      window.removeEventListener('hms_open_zreport', openZ);
      window.removeEventListener('hms_open_shortcuts', openK);
    };
  }, []);

  // Sync external search from top navbar
  useEffect(() => {
    if (externalSearch !== undefined && externalSearch !== null) {
      setMenuSearch(externalSearch);
    }
  }, [externalSearch]);

  // Close cart menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (cartMenuRef.current && !cartMenuRef.current.contains(e.target)) {
        setCartMenuOpen(false);
      }
      if (tablePickerRef.current && !tablePickerRef.current.contains(e.target)) {
        setTablePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Cart Operations
  const addToCartProduct = (product, variant = null, customQty = 1) => {
    if (!product.is_available || product.stock_quantity <= 0) {
      posAudio.error();
      addToast(`'${product.name}' is out of stock!`, 'error');
      return;
    }

    const price = variant 
      ? (variant.offer_price && variant.offer_price < variant.regular_price ? variant.offer_price : variant.regular_price)
      : (product.offer_price && product.offer_price < product.base_price ? product.offer_price : product.base_price);

    const cartKey = `prod_${product.id}_${variant ? (variant.id || variant.variant_name) : 'base'}`;

    setCart(prev => {
      const existing = prev.find(item => item.key === cartKey);
      if (existing) {
        return prev.map(item => item.key === cartKey ? { ...item, quantity: item.quantity + customQty } : item);
      } else {
        return [
          ...prev,
          {
            key: cartKey,
            item_type: 'product',
            product_id: product.id,
            combo_id: null,
            variant_id: variant?.id || null,
            name: product.name,
            variant_name: variant ? variant.variant_name : null,
            unit_price: price,
            quantity: customQty,
            image_url: getItemImage(product),
            product_ref: product,
          }
        ];
      }
    });

    posAudio.punch();
    addToast(`Added ${customQty > 1 ? `${customQty}x ` : ''}${product.name}`, 'info', 1000);
  };

  const addToCartCombo = (combo, customQty = 1) => {
    if (!combo.is_available) {
      posAudio.error();
      addToast(`Combo '${combo.name}' is unavailable!`, 'error');
      return;
    }

    const cartKey = `combo_${combo.id}`;
    setCart(prev => {
      const existing = prev.find(item => item.key === cartKey);
      if (existing) {
        return prev.map(item => item.key === cartKey ? { ...item, quantity: item.quantity + customQty } : item);
      } else {
        return [
          ...prev,
          {
            key: cartKey,
            item_type: 'combo',
            product_id: null,
            combo_id: combo.id,
            variant_id: null,
            name: combo.name,
            variant_name: null,
            unit_price: combo.combo_price,
            quantity: customQty,
            image_url: combo.image_url || getItemImage(null, combo.id),
          }
        ];
      }
    });

    posAudio.punch();
    addToast(`Added ${combo.name}`, 'info', 1000);
  };

  const handleAddCustomItem = (customItem) => {
    const cartKey = `custom_${Date.now()}`;
    setCart(prev => [
      ...prev,
      {
        key: cartKey,
        item_type: 'custom',
        is_custom: true,
        product_id: null,
        combo_id: null,
        variant_id: null,
        name: customItem.name,
        variant_name: null,
        unit_price: customItem.unit_price,
        quantity: customItem.quantity,
        image_url: FOOD_IMAGES[0],
      }
    ]);
    posAudio.punch();
    addToast(`Added custom item: ${customItem.name}`, 'success');
  };

  const updateQuantity = (key, delta) => {
    posAudio.punch();
    setCart(prev => prev.map(item => {
      if (item.key === key) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (key) => {
    posAudio.punch();
    setCart(prev => prev.filter(item => item.key !== key));
  };

  // Calculations
  const itemsSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  }, [cart]);

  const surchargesTotal = useMemo(() => {
    let s = 0;
    if (parcelChargeEnabled) s += 20;
    if (deliveryChargeEnabled) s += 40;
    return s;
  }, [parcelChargeEnabled, deliveryChargeEnabled]);

  const rawSubtotal = itemsSubtotal + surchargesTotal;

  const discountTotal = useMemo(() => {
    if (!appliedOffer) return 0;
    return appliedOffer.discount_amount || 0;
  }, [appliedOffer]);

  const taxableAmount = Math.max(0, rawSubtotal - discountTotal);
  const taxAmount = +(taxableAmount * 0.05).toFixed(2); // 5% GST
  const subtotalWithTax = taxableAmount + taxAmount;

  const finalTotal = useMemo(() => {
    if (autoRoundOff) {
      return Math.round(subtotalWithTax);
    }
    return +subtotalWithTax.toFixed(2);
  }, [subtotalWithTax, autoRoundOff]);

  const roundOffDifference = +(finalTotal - subtotalWithTax).toFixed(2);

  // Cash change return
  const tenderNum = parseFloat(tenderAmount) || 0;
  const changeReturn = Math.max(0, tenderNum - finalTotal);
  const amountDue = Math.max(0, finalTotal - tenderNum);

  // Park / Hold Bill
  const handleParkBill = () => {
    if (cart.length === 0) {
      addToast('Cannot hold an empty bill', 'error');
      return;
    }

    if (parkedBills.length >= 5) {
      addToast('Parked bills queue is full (max 5 held bills)', 'error');
      return;
    }

    const billSnapshot = {
      id: `park_${Date.now()}`,
      parkedAt: Date.now(),
      label: `${tableNumber || 'Walk-in'}`,
      orderType,
      tableNumber,
      customerName,
      customerPhone,
      cart: [...cart],
      appliedOffer,
      parcelChargeEnabled,
      deliveryChargeEnabled,
      itemCount: cart.reduce((s, i) => s + i.quantity, 0),
      finalTotal,
    };

    setParkedBills(prev => [billSnapshot, ...prev]);
    setCart([]);
    setAppliedOffer(null);
    setParcelChargeEnabled(false);
    setDeliveryChargeEnabled(false);
    setTenderAmount('');

    posAudio.punch();
    addToast(`Order for ${billSnapshot.label} saved as draft!`, 'info');
  };

  const handleRecallBill = (bill) => {
    if (cart.length > 0) {
      addToast('Active register has items. Park or clear current bill first.', 'error');
      return;
    }

    setCart(bill.cart || []);
    setOrderType(bill.orderType || 'dine_in');
    setTableNumber(bill.tableNumber || 'Table 05');
    setCustomerName(bill.customerName || 'Walk-in Guest');
    setCustomerPhone(bill.customerPhone || '+91 98450 12345');
    setAppliedOffer(bill.appliedOffer || null);
    setParcelChargeEnabled(Boolean(bill.parcelChargeEnabled));
    setDeliveryChargeEnabled(Boolean(bill.deliveryChargeEnabled));

    setParkedBills(prev => prev.filter(b => b.id !== bill.id));
    posAudio.punch();
    addToast(`Restored draft order for ${bill.label}!`, 'success');
  };

  const handleDiscardParkedBill = (billId, e) => {
    e.stopPropagation();
    setParkedBills(prev => prev.filter(b => b.id !== billId));
    addToast('Discarded draft bill', 'info');
  };

  // Speed Punch autocomplete suggestions
  const speedSuggestions = useMemo(() => {
    const clean = speedQuery.trim();
    if (!clean) return [];

    let cleanTarget = clean;
    const multMatch = clean.match(/^(\d+)\s*[*xX]\s*(.+)$/);
    if (multMatch) {
      cleanTarget = multMatch[2].trim();
    }
    const lowerClean = cleanTarget.toLowerCase();

    const matchedProducts = products.filter(p => {
      const plu = getProductPLU(p).toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      return (
        plu.includes(lowerClean) ||
        String(p.id) === cleanTarget ||
        sku.includes(lowerClean) ||
        p.name.toLowerCase().includes(lowerClean)
      );
    }).map(p => ({
      type: 'product',
      item: p,
      plu: `#${getProductPLU(p)}`,
      name: p.name,
      price: p.offer_price || p.base_price,
      isAvailable: p.is_available && p.stock_quantity > 0,
    }));

    const matchedCombos = combos.filter(c => {
      const plu = getComboPLU(c).toLowerCase();
      return (
        plu.includes(lowerClean) ||
        String(c.id) === cleanTarget ||
        c.name.toLowerCase().includes(lowerClean)
      );
    }).map(c => ({
      type: 'combo',
      item: c,
      plu: `#${getComboPLU(c)}`,
      name: c.name,
      price: c.combo_price,
      isAvailable: c.is_available,
    }));

    return [...matchedProducts, ...matchedCombos].slice(0, 6);
  }, [speedQuery, products, combos]);

  // Execute Speed Punch
  const handleExecutePunch = (rawQuery) => {
    const input = rawQuery || speedQuery;
    if (!input || !input.trim()) return;

    let qty = 1;
    let target = input.trim();

    const multMatch = target.match(/^(\d+)\s*[*xX]\s*(.+)$/);
    if (multMatch) {
      qty = parseInt(multMatch[1], 10) || 1;
      target = multMatch[2].trim();
    }

    const lowerTarget = target.toLowerCase();

    let matchedProduct = products.find(p => {
      const plu = getProductPLU(p);
      return plu === target || String(p.id) === target || p.name.toLowerCase().includes(lowerTarget);
    });

    let matchedCombo = combos.find(c => {
      const comboPlu = getComboPLU(c).toLowerCase();
      return comboPlu === lowerTarget || String(c.id) === target || c.name.toLowerCase().includes(lowerTarget);
    });

    if (matchedProduct) {
      const variant = matchedProduct.variants && matchedProduct.variants.length > 0 
        ? matchedProduct.variants[0] 
        : null;
      addToCartProduct(matchedProduct, variant, qty);
      setSpeedQuery('');
      setSpeedDropdownOpen(false);
      speedInputRef.current?.focus();
      return;
    }

    if (matchedCombo) {
      addToCartCombo(matchedCombo, qty);
      setSpeedQuery('');
      setSpeedDropdownOpen(false);
      speedInputRef.current?.focus();
      return;
    }

    posAudio.error();
    addToast(`No menu item found for "${target}"`, 'error');
  };

  // Global Keyboard & Anywhere Speed Punch Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Don't intercept if any modal is currently open
      if (
        showShortcutsModal || 
        showUPIModal || 
        showCustomItemModal || 
        showZReportModal || 
        selectedProductForVariantModal || 
        completedOrder
      ) {
        return;
      }

      // Check if user is typing in another specific input/textarea (search, note, tender, table edit)
      const activeEl = document.activeElement;
      const activeTag = activeEl?.tagName;
      const isTypingInOtherInput = (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') 
        && activeEl !== speedInputRef.current;

      if (isTypingInOtherInput) {
        return;
      }

      // Allow browser shortcuts with modifiers (Ctrl+C, Ctrl+R, etc.)
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      // 1. Function Keys
      if (e.key === 'F1') {
        e.preventDefault();
        speedInputRef.current?.focus();
        speedInputRef.current?.select();
        setSpeedDropdownOpen(true);
        return;
      }
      if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0) handleParkBill();
        else if (parkedBills.length > 0) handleRecallBill(parkedBills[0]);
        return;
      }
      if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0 && !isCheckingOut) {
          setPaymentMethod('cash');
          handleCheckout();
        }
        return;
      }
      if (e.key === 'F8') {
        e.preventDefault();
        setPaymentMethod('upi');
        if (cart.length > 0) setShowUPIModal(true);
        return;
      }
      if (e.key === '?' && activeEl !== speedInputRef.current) {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
        return;
      }

      // 2. Escape key
      if (e.key === 'Escape') {
        setSpeedDropdownOpen(false);
        if (activeEl === speedInputRef.current) {
          speedInputRef.current?.blur();
        }
        return;
      }

      // 3. Enter key (Punch item from anywhere)
      if (e.key === 'Enter') {
        if (speedQuery.trim()) {
          e.preventDefault();
          handleExecutePunch();
          return;
        }
      }

      // 4. Backspace key when NOT already in speed input
      if (e.key === 'Backspace' && activeEl !== speedInputRef.current) {
        if (speedQuery.length > 0) {
          e.preventDefault();
          setSpeedQuery(prev => prev.slice(0, -1));
          speedInputRef.current?.focus();
          return;
        }
      }

      // 5. Global typing capture anywhere on POS page (Numbers, Letters, *, x, +, etc.)
      if (e.key.length === 1) {
        // Ignore standalone space if speedQuery is empty
        if (e.key === ' ' && !speedQuery) {
          return;
        }

        // If focus is NOT already on speed input, direct keystroke straight into speed punch
        if (activeEl !== speedInputRef.current) {
          e.preventDefault();
          speedInputRef.current?.focus();
          setSpeedQuery(prev => prev + e.key);
          setSpeedDropdownOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    cart, 
    parkedBills, 
    isCheckingOut, 
    finalTotal, 
    speedQuery, 
    showShortcutsModal, 
    showUPIModal, 
    showCustomItemModal, 
    showZReportModal, 
    selectedProductForVariantModal, 
    completedOrder
  ]);

  // Apply Promo Code
  const handleApplyPromo = async (e) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    if (rawSubtotal <= 0) {
      addToast('Add items before applying promo code', 'error');
      return;
    }

    try {
      setValidatingOffer(true);
      const res = await api.validateOffer(promoCode.trim(), rawSubtotal);
      setAppliedOffer({
        code: res.offer.code,
        discount_amount: res.discount_amount,
        title: res.offer.title,
      });
      addToast(`Promo applied: Saved ₹${res.discount_amount}!`, 'success');
    } catch (err) {
      setAppliedOffer(null);
      addToast(err.message || 'Invalid promo code', 'error');
    } finally {
      setValidatingOffer(false);
    }
  };

  // Finalize Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      addToast('Cart is empty', 'error');
      return;
    }

    try {
      setIsCheckingOut(true);

      const payloadItems = [
        ...cart.map(item => ({
          item_type: item.item_type || 'product',
          product_id: item.item_type === 'product' && !item.is_custom ? item.product_id : null,
          combo_id: item.item_type === 'combo' ? item.combo_id : null,
          variant_id: item.variant_id || null,
          item_name: item.name,
          unit_price: item.unit_price,
          quantity: item.quantity,
          special_notes: orderNote || null,
        })),
        ...(parcelChargeEnabled ? [{
          item_type: 'custom',
          item_name: 'Parcel Packaging Box',
          unit_price: 20,
          quantity: 1,
        }] : []),
        ...(deliveryChargeEnabled ? [{
          item_type: 'custom',
          item_name: 'Delivery Surcharge',
          unit_price: 40,
          quantity: 1,
        }] : []),
      ];

      const payload = {
        order_type: orderType,
        table_number: orderType === 'dine_in' ? tableNumber : null,
        customer_name: customerName,
        customer_phone: customerPhone,
        payment_method: paymentMethod,
        offer_code: appliedOffer ? appliedOffer.code : null,
        items: payloadItems,
      };

      const res = await api.createOrder(payload);
      const order = res.data;

      setShowUPIModal(false);
      setCompletedOrder(order);
      setCart([]);
      setAppliedOffer(null);
      setParcelChargeEnabled(false);
      setDeliveryChargeEnabled(false);
      setTenderAmount('');
      setOrderNote('');
      setShowNoteInput(false);

      posAudio.checkout();
      addToast(`Order ${order.order_number} confirmed!`, 'success');
      
      fetchData();
      if (onOrderPlaced) onOrderPlaced();
    } catch (err) {
      addToast(err.message || 'Checkout failed', 'error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Filter products by Category & Search
  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeCategory !== 'all' && activeCategory !== 'combos' && activeCategory !== 'popular') {
      list = list.filter(p => p.category_id === parseInt(activeCategory));
    }
    if (selectedSubCategory !== 'all') {
      list = list.filter(p => p.category_id === parseInt(selectedSubCategory));
    }
    if (menuSearch.trim()) {
      const q = menuSearch.trim().toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        getProductPLU(p).includes(q) ||
        (p.category?.name && p.category.name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [products, activeCategory, selectedSubCategory, menuSearch]);

  return (
    <div className="p-4 sm:p-6 pb-6 sm:pb-8 space-y-6 max-w-[1600px] mx-auto animate-fadeIn font-sans selection:bg-neutral-900 selection:text-white">

      {/* ----------------------------------------------------
          ROW 1: 4 RESTODASH STAT CARDS (MONOCHROME LUXURY)
          ---------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Today's Sales */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 block">Today's Sales</span>
            <div className="text-xl sm:text-2xl font-black text-neutral-900 mt-1 font-mono tracking-tight">
              ₹{statsData.today_revenue?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-neutral-800">
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full font-bold">▲ 12.5%</span>
              <span className="text-neutral-400">vs yesterday</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 shrink-0">
            <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 block">Total Orders</span>
            <div className="text-xl sm:text-2xl font-black text-neutral-900 mt-1 font-mono tracking-tight">
              {statsData.today_orders}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-neutral-800">
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full font-bold">▲ 8</span>
              <span className="text-neutral-400">from yesterday</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 shrink-0">
            <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 3: Customers */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 block">Customers</span>
            <div className="text-xl sm:text-2xl font-black text-neutral-900 mt-1 font-mono tracking-tight">
              {statsData.customers_count}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-neutral-800">
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full font-bold">▲ 5</span>
              <span className="text-neutral-400">new guests</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 shrink-0">
            <Users className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 4: Total Due */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 block">Total Due</span>
            <div className="text-xl sm:text-2xl font-black text-neutral-900 mt-1 font-mono tracking-tight">
              ₹{statsData.total_due?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-neutral-800">
              <span className="text-neutral-600 bg-neutral-100 px-1.5 py-0.2 rounded-full font-bold">▼ 4.2%</span>
              <span className="text-neutral-400">vs yesterday</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 shrink-0">
            <Banknote className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

      </div>

      {/* Draft / Parked Bills Banner (If any) */}
      {parkedBills.length > 0 && (
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-900 animate-ping inline-block shrink-0" />
            <div>
              <span className="text-xs font-bold text-neutral-900">
                Draft Orders ({parkedBills.length} Held)
              </span>
              <p className="text-[11px] text-neutral-500">
                Click <strong>Recall</strong> to restore order back to active checkout
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {parkedBills.map((b) => (
              <div
                key={b.id}
                className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 hover:border-black rounded-xl text-xs flex items-center gap-2.5 transition-all"
              >
                <div>
                  <span className="font-bold text-neutral-900">{b.label}</span>
                  <span className="text-neutral-400 font-mono ml-1.5">₹{b.finalTotal?.toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRecallBill(b)}
                  className="px-2 py-0.5 bg-neutral-900 hover:bg-black text-white text-[11px] font-semibold rounded-lg cursor-pointer"
                >
                  Recall
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDiscardParkedBill(b.id, e)}
                  className="text-neutral-400 hover:text-red-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          PERMANENT FAST PUNCH COMMAND BAR (TYPE 101 + ENTER TO ADD TO CART)
          ---------------------------------------------------- */}
      <div className="relative">
        <div className="flex items-center bg-white rounded-2xl border-2 border-neutral-900 shadow-sm p-1.5 focus-within:ring-4 focus-within:ring-neutral-900/10 transition-all">
          
          {/* Left Indicator Badge */}
          <div className="pl-3 pr-3.5 py-1 flex items-center gap-2.5 border-r border-neutral-200 shrink-0">
            <div className="w-7 h-7 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-black shadow-2xs">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div className="hidden sm:block text-left leading-none">
              <div className="text-[11px] font-black uppercase tracking-wider text-neutral-900">
                Speed Punch
              </div>
              <div className="text-[9px] text-neutral-400 mt-0.5 font-medium">
                Type Anywhere + Enter
              </div>
            </div>
          </div>

          {/* Quick Code Punch Input (e.g. 101, 102, 3*101) */}
          <input
            ref={speedInputRef}
            type="text"
            value={speedQuery}
            onChange={(e) => {
              setSpeedQuery(e.target.value);
              setSpeedDropdownOpen(true);
            }}
            onFocus={() => setSpeedDropdownOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleExecutePunch();
              }
              if (e.key === 'Escape') {
                setSpeedDropdownOpen(false);
                speedInputRef.current?.blur();
              }
            }}
            placeholder="Type anywhere on screen (e.g. 101 or 3*101) and press Enter..."
            className="w-full bg-transparent px-3.5 py-2 text-xs sm:text-sm font-mono font-bold text-neutral-900 placeholder:text-neutral-400 placeholder:font-normal focus:outline-none"
          />

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 shrink-0 pr-1">
            {speedQuery && (
              <button
                type="button"
                onClick={() => {
                  setSpeedQuery('');
                  setSpeedDropdownOpen(false);
                }}
                className="p-1 text-neutral-400 hover:text-black cursor-pointer"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleExecutePunch()}
              className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              title="Add code to bill"
            >
              <span>+ Add to Cart</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 rounded-md bg-neutral-800 text-[10px] font-mono font-bold text-neutral-300">
                ↵ Enter
              </kbd>
            </button>
          </div>
        </div>

        {/* Live Suggestions Dropdown (Shows matching item, PLU, price) */}
        {speedDropdownOpen && speedSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-neutral-200 rounded-2xl shadow-2xl z-50 divide-y divide-neutral-100 overflow-hidden animate-fadeIn">
            <div className="px-3.5 py-1.5 bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
              <span>Matching Items (Click to punch or press Enter)</span>
              <span>PLU Code</span>
            </div>
            {speedSuggestions.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (item.type === 'product') {
                    if (item.item.variants && item.item.variants.length > 1) {
                      setSelectedProductForVariantModal(item.item);
                    } else {
                      addToCartProduct(item.item, item.item.variants?.[0] || null);
                    }
                  } else {
                    addToCartCombo(item.item);
                  }
                  setSpeedQuery('');
                  setSpeedDropdownOpen(false);
                }}
                className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-neutral-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold bg-neutral-900 text-white px-2 py-0.5 rounded text-[11px]">
                    {item.plu}
                  </span>
                  <span className="font-bold text-neutral-900">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-neutral-900">₹{item.price}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-bold">
                    + Add
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Helper guide strip */}
        <div className="flex items-center justify-between px-2 pt-1.5 text-[11px] text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-medium text-neutral-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Global Speed Punch Ready (Type Anywhere)</span>
            </span>
            <span>•</span>
            <span>Type any code or barcode directly</span>
          </div>
          <div className="font-mono text-neutral-500">
            Multiplier format: <strong className="text-neutral-800">Qty*Code</strong> (e.g. 2*101)
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          MAIN TWO-COLUMN WORKSPACE: LEFT CATALOG + RIGHT CART
          ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ====================================================
            LEFT SECTION: CATEGORY TABS, SUB-BAR & PRODUCTS GRID
            ==================================================== */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Row 2: Category Tabs & Filter Button (Matching RestoDash) */}
          <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
            <div className="flex items-center gap-1.5 flex-nowrap">
              {/* All Items */}
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('all');
                  setSelectedSubCategory('all');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-white hover:bg-neutral-100 text-neutral-600 hover:text-black border border-neutral-200/80'
                }`}
              >
                All Items ({products.length})
              </button>

              {/* Combos */}
              <button
                type="button"
                onClick={() => setActiveCategory('combos')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === 'combos'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-white hover:bg-neutral-100 text-neutral-600 hover:text-black border border-neutral-200/80'
                }`}
              >
                Combos ({combos.length})
              </button>

              {/* Dynamic categories from database */}
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(String(c.id));
                    setSelectedSubCategory(String(c.id));
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === String(c.id)
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-white hover:bg-neutral-100 text-neutral-600 hover:text-black border border-neutral-200/80'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Fast Punch Quick Focus Button */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  speedInputRef.current?.focus();
                  speedInputRef.current?.select();
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold border bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-200/80 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="Focus Code Punch Input (F1)"
              >
                <Zap className="w-3.5 h-3.5 fill-black text-black" />
                <span className="hidden sm:inline">Focus Code Input</span>
                <kbd className="px-1.5 py-0.2 rounded bg-neutral-100 font-mono text-[9px] text-neutral-500 font-bold border border-neutral-200">
                  F1
                </kbd>
              </button>
            </div>
          </div>

          {/* Sub-bar: Search menu items... & All Categories dropdown */}
          <div className="bg-white rounded-2xl p-2.5 border border-neutral-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && menuSearch.trim()) {
                    e.preventDefault();
                    handleExecutePunch(menuSearch);
                    setMenuSearch('');
                  }
                }}
                placeholder="Search menu items or enter code (e.g. 101) + Enter..."
                className="w-full pl-9 pr-8 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 bg-neutral-50/70 hover:bg-neutral-100/60 focus:bg-white rounded-xl border border-neutral-200/80 focus:border-neutral-900 focus:outline-none transition-all font-sans"
              />
              {menuSearch && (
                <button
                  type="button"
                  onClick={() => setMenuSearch('')}
                  className="absolute right-2.5 top-2 text-neutral-400 hover:text-black p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="relative shrink-0 w-full sm:w-48">
              <select
                value={selectedSubCategory}
                onChange={(e) => {
                  setSelectedSubCategory(e.target.value);
                  if (e.target.value !== 'all') {
                    setActiveCategory(e.target.value);
                  }
                }}
                className="w-full appearance-none bg-neutral-50/70 hover:bg-neutral-100/60 text-xs font-semibold text-neutral-800 py-2 pl-3.5 pr-8 rounded-xl border border-neutral-200/80 focus:border-neutral-900 focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* ====================================================
              ROW 3: PRODUCTS CATALOG GRID (Matching RestoDash 4 Cols)
              ==================================================== */}
          {loading ? (
            <div className="p-20 text-center space-y-3 bg-white rounded-2xl border border-neutral-200/80">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-neutral-500 font-medium">Loading RestoDash Menu...</p>
            </div>
          ) : activeCategory === 'combos' ? (
            
            /* SHOW COMBOS */
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {combos.map((combo, idx) => (
                <div 
                  key={combo.id}
                  className="bg-white rounded-2xl p-3 border border-neutral-200/80 hover:border-black shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-full h-32 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-100 relative">
                      <img
                        src={combo.image_url || getItemImage(null, idx)}
                        alt={combo.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 text-[10px] font-mono font-bold bg-neutral-900 text-white px-2 py-0.5 rounded-md shadow-2xs">
                        #{getComboPLU(combo)}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <h4 className="text-xs font-bold text-neutral-900 line-clamp-1 leading-snug">
                        {combo.name}
                      </h4>
                      <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                        {combo.description || 'Special Combo Deal'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between">
                    <div>
                      {combo.regular_price && (
                        <span className="text-[10px] line-through text-neutral-400 font-mono block">
                          ₹{combo.regular_price}
                        </span>
                      )}
                      <span className="text-sm font-black font-mono text-neutral-900">
                        ₹{combo.combo_price}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => addToCartCombo(combo)}
                      disabled={!combo.is_available}
                      className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-900 text-neutral-900 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                      title="Add combo to order"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          ) : (

            /* SHOW PRODUCTS */
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((p, idx) => {
                const isOutOfStock = !p.is_available || p.stock_quantity <= 0;
                const hasOffer = p.offer_price && p.offer_price < p.base_price;
                const pluCode = getProductPLU(p);
                const displayImg = getItemImage(p, idx);
                const hasVariants = p.variants && p.variants.length > 1;
                const singleVariant = p.variants && p.variants.length === 1 ? p.variants[0] : null;

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl p-3 border border-neutral-200/80 hover:border-black shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Food Image */}
                      <div 
                        onClick={() => hasVariants && setSelectedProductForVariantModal(p)}
                        className={`w-full h-32 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-100 relative ${
                          hasVariants ? 'cursor-pointer' : ''
                        }`}
                        title={hasVariants ? "Click to view all portions" : ""}
                      >
                        <img
                          src={displayImg}
                          alt={p.name}
                          onError={(e) => {
                            e.currentTarget.src = FOOD_IMAGES[idx % FOOD_IMAGES.length];
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        
                        {/* PLU Badge */}
                        <span className="absolute top-2 left-2 text-[10px] font-mono font-bold bg-neutral-900/90 backdrop-blur-2xs text-white px-2 py-0.5 rounded-md shadow-2xs">
                          #{pluCode}
                        </span>

                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-wider">
                            Sold Out
                          </div>
                        )}
                      </div>

                      {/* Title & Category */}
                      <div className="mt-2.5">
                        <span className="text-[10px] font-medium text-neutral-400 block truncate">
                          {p.category?.name || 'General'}
                        </span>
                        <h4 
                          onClick={() => hasVariants && setSelectedProductForVariantModal(p)}
                          className={`text-xs font-bold text-neutral-900 line-clamp-1 leading-snug ${
                            hasVariants ? 'hover:underline cursor-pointer' : ''
                          }`}
                        >
                          {p.name}
                        </h4>
                      </div>
                    </div>

                    {/* PRICE & VARIANT SELECTION SECTION */}
                    {hasVariants ? (
                      /* PRODUCT HAS MULTIPLE PORTIONS / VARIANTS (CLEAN FULL-WIDTH STACKED ALIGNMENT) */
                      <div className="mt-2.5 pt-2 border-t border-neutral-100 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider pb-0.5">
                          <span>Select Portion</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProductForVariantModal(p);
                            }}
                            className="text-[10px] text-neutral-500 hover:text-black font-semibold underline cursor-pointer"
                          >
                            All ({p.variants.length})
                          </button>
                        </div>

                        {/* Full-width neatly aligned variant strips (Zero text truncation, perfectly aligned prices & badges) */}
                        <div className="space-y-1.5">
                          {p.variants.slice(0, 3).map((v) => {
                            const vPrice = v.offer_price && v.offer_price < v.regular_price ? v.offer_price : v.regular_price;
                            const inCartItem = cart.find(i => i.product_id === p.id && i.variant_id === v.id);
                            const inCartQty = inCartItem?.quantity || 0;

                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCartProduct(p, v);
                                }}
                                disabled={isOutOfStock || v.is_available === false}
                                className={`w-full px-2.5 py-1.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer group/v ${
                                  inCartQty > 0
                                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                                    : 'bg-neutral-50 hover:bg-neutral-900 text-neutral-800 hover:text-white border-neutral-200/90 hover:border-black'
                                }`}
                                title={`Add 1x ${v.variant_name} (₹${vPrice})`}
                              >
                                <span className="text-xs font-bold truncate leading-tight flex-1">
                                  {v.variant_name}
                                </span>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs font-black font-mono">
                                    ₹{vPrice}
                                  </span>
                                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-colors ${
                                    inCartQty > 0
                                      ? 'bg-white text-black'
                                      : 'bg-neutral-200 group-hover/v:bg-white text-neutral-800 group-hover/v:text-black'
                                  }`}>
                                    {inCartQty > 0 ? inCartQty : '+'}
                                  </span>
                                </div>
                              </button>
                            );
                          })}

                          {/* If more than 3 variants, show quick modal trigger */}
                          {p.variants.length > 3 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProductForVariantModal(p);
                              }}
                              className="w-full py-1 text-center text-[10px] font-bold text-neutral-500 hover:text-black hover:underline cursor-pointer"
                            >
                              + {p.variants.length - 3} more portions (View All)
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* SINGLE PORTION PRODUCT (NO VARIANTS) */
                      <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between">
                        <div>
                          {hasOffer ? (
                            <>
                              <span className="text-[10px] line-through text-neutral-400 font-mono block">
                                ₹{p.base_price}
                              </span>
                              <span className="text-sm font-black font-mono text-neutral-900">
                                ₹{p.offer_price}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-black font-mono text-neutral-900">
                              ₹{p.base_price}
                            </span>
                          )}
                        </div>

                        {/* Circular '+' Button */}
                        <button
                          type="button"
                          onClick={() => addToCartProduct(p, singleVariant)}
                          disabled={isOutOfStock}
                          className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-900 text-neutral-900 hover:text-white disabled:opacity-40 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="Add to Current Order"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Button matching RestoDash */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                fetchData();
                addToast('Catalog up to date', 'info', 1000);
              }}
              className="px-5 py-2 bg-white hover:bg-neutral-50 border border-neutral-200/90 text-neutral-800 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Load More</span>
              <span>↓</span>
            </button>
          </div>

        </div>

        {/* ====================================================
            RIGHT SECTION: CURRENT ORDER CART & CHECKOUT PANEL
            ==================================================== */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sticky top-3 lg:h-[calc(100vh-4.5rem)] flex flex-col overflow-hidden">
          
          {/* Header & Order Type Tabs (Fixed at Top) */}
          <div className="p-4 pb-3 border-b border-neutral-100 shrink-0 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-neutral-900">Current Order</h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Table Pill with Quick Selector Dropdown */}
                <div className="relative" ref={tablePickerRef}>
                  {isEditingTable ? (
                    <input
                      type="text"
                      autoFocus
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      onBlur={() => setIsEditingTable(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsEditingTable(false)}
                      className="px-2 py-0.5 rounded-full text-[11px] font-mono border border-black focus:outline-none w-20 text-center"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setTablePickerOpen(prev => !prev)}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-neutral-100 border border-neutral-200 text-neutral-800 hover:border-black cursor-pointer transition-colors flex items-center gap-1"
                      title="Click to choose or edit table"
                    >
                      <span>{tableNumber}</span>
                      <ChevronDown className="w-3 h-3 text-neutral-400" />
                    </button>
                  )}

                  {/* Quick Table Picker Dropdown */}
                  {tablePickerOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-neutral-200/90 p-3 z-50 text-xs animate-fadeIn space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100">
                        <span className="font-bold text-neutral-900 text-xs">Select Table</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingTable(true);
                            setTablePickerOpen(false);
                          }}
                          className="text-[10px] text-neutral-500 hover:text-black underline cursor-pointer"
                        >
                          Custom Name
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                        {diningTables.map((t) => {
                          const isSelected = tableNumber.toUpperCase() === t.code.toUpperCase();
                          return (
                            <button
                              key={t.id || t.code}
                              type="button"
                              onClick={() => {
                                setTableNumber(t.code);
                                setTablePickerOpen(false);
                                setIsEditingTable(false);
                              }}
                              className={`p-2 rounded-xl text-center font-mono transition-all cursor-pointer border ${
                                isSelected
                                  ? 'bg-neutral-900 text-white border-neutral-900 font-bold shadow-2xs'
                                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200/80 font-semibold'
                              }`}
                            >
                              <div className="text-xs">{t.code}</div>
                              <div className={`text-[9px] mt-0.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                                {t.capacity}p • {t.status === 'occupied' ? 'Busy' : 'Free'}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Three Dots Menu */}
                <div className="relative" ref={cartMenuRef}>
                  <button
                    type="button"
                    onClick={() => setCartMenuOpen(prev => !prev)}
                    className="p-1 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {cartMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-neutral-200/90 py-1.5 z-50 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomItemModal(true);
                          setCartMenuOpen(false);
                        }}
                        className="w-full px-3 py-1.5 text-left hover:bg-neutral-50 flex items-center gap-2 text-neutral-700"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>+ Custom Item</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowZReportModal(true);
                          setCartMenuOpen(false);
                        }}
                        className="w-full px-3 py-1.5 text-left hover:bg-neutral-50 flex items-center gap-2 text-neutral-700"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Shift Z-Report</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowShortcutsModal(true);
                          setCartMenuOpen(false);
                        }}
                        className="w-full px-3 py-1.5 text-left hover:bg-neutral-50 flex items-center gap-2 text-neutral-700"
                      >
                        <Keyboard className="w-3.5 h-3.5" />
                        <span>Keyboard Guide</span>
                      </button>
                      {cart.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setCart([]);
                            setCartMenuOpen(false);
                            addToast('Cart cleared', 'info');
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-red-50 text-red-600 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear All Items</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dine In / Takeaway / Delivery Pill Tabs */}
            <div className="grid grid-cols-3 gap-1.5 bg-neutral-100 p-1 rounded-xl">
              {[
                { id: 'dine_in', label: 'Dine In' },
                { id: 'takeaway', label: 'Takeaway' },
                { id: 'delivery', label: 'Delivery' },
              ].map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setOrderType(type.id)}
                  className={`py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    orderType === type.id
                      ? 'bg-white text-neutral-900 shadow-2xs'
                      : 'text-neutral-500 hover:text-black'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Selected Tables Line (T-01, T-02, T-03...) - Only shown for Dine In */}
            {orderType === 'dine_in' && (
              <div className="pt-0.5 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500 px-0.5">
                  <span className="font-bold text-neutral-700">Select Table:</span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Active: <strong className="text-neutral-900 font-bold">{tableNumber}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
                  {diningTables.map((t) => {
                    const isSelected = tableNumber.toUpperCase() === t.code.toUpperCase();
                    return (
                      <button
                        key={t.id || t.code}
                        type="button"
                        onClick={() => {
                          setTableNumber(t.code);
                          setIsEditingTable(false);
                        }}
                        title={`${t.name || t.code} • ${t.capacity || 4} Seats • ${t.section || 'Main'}`}
                        className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-neutral-900 text-white shadow-xs ring-1 ring-black scale-102'
                            : 'bg-neutral-100 hover:bg-neutral-200/90 text-neutral-700 border border-neutral-200/80 hover:text-black'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isSelected 
                            ? 'bg-emerald-400 animate-pulse' 
                            : t.status === 'occupied' 
                            ? 'bg-amber-400' 
                            : 'bg-emerald-500'
                        }`} />
                        <span>{t.code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Middle: Cart Items List + Notes & Surcharges (Scrollable Area) */}
          <div className="flex-1 overflow-y-auto min-h-0 p-4 py-2.5 space-y-2.5">
            {/* Order Item List */}
            <div className="space-y-2 divide-y divide-neutral-100">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 rounded-xl space-y-1">
                  <ShoppingCart className="w-6 h-6 mx-auto opacity-30 text-neutral-500" />
                  <p className="font-semibold text-neutral-600">No items selected</p>
                  <p className="text-[11px] text-neutral-400">Click '+' on any menu card to add to order</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.key} className="pt-2 flex items-center justify-between text-xs gap-2.5">
                    {/* Thumbnail */}
                    <img
                      src={item.image_url || FOOD_IMAGES[0]}
                      alt={item.name}
                      className="w-10 h-10 rounded-xl object-cover border border-neutral-100 shrink-0"
                    />

                    {/* Title & Price */}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-neutral-900 truncate">{item.name}</h5>
                      {item.variant_name && (
                        <span className="text-[10px] text-neutral-400 block truncate">{item.variant_name}</span>
                      )}
                      <span className="font-mono text-neutral-500 text-[11px]">
                        ₹{item.unit_price}
                      </span>
                    </div>

                    {/* Quantity Controller Pill: [-  1  +] */}
                    <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50/50 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, -1)}
                        className="px-2 py-1 hover:bg-neutral-200 text-neutral-600 transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-1.5 font-mono font-bold text-neutral-900 text-xs min-w-[18px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, 1)}
                        className="px-2 py-1 hover:bg-neutral-200 text-neutral-600 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Delete Trash Icon */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.key)}
                      className="p-1 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* + Add Note (RestoDash style) */}
            <div className="pt-1">
              {showNoteInput ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Special instructions (e.g. less spicy)..."
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-black"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNoteInput(true)}
                  className="text-[11px] font-semibold text-neutral-500 hover:text-black flex items-center gap-1 cursor-pointer"
                >
                  <span>+ Add Note</span>
                </button>
              )}
            </div>

            {/* Surcharges (Parcel & Delivery) */}
            <div className="flex items-center gap-2 pt-1.5 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setParcelChargeEnabled(prev => !prev)}
                className={`flex-1 py-1 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  parcelChargeEnabled
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                }`}
              >
                <Package className="w-3 h-3" />
                <span>Parcel (+₹20)</span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryChargeEnabled(prev => !prev)}
                className={`flex-1 py-1 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  deliveryChargeEnabled
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                }`}
              >
                <Truck className="w-3 h-3" />
                <span>Delivery (+₹40)</span>
              </button>
            </div>
          </div>

          {/* Bottom Pinned Footer: Totals, Payment & Charge / Print Bill Button */}
          <div className="shrink-0 border-t border-neutral-100 bg-white p-4 pt-3 space-y-2.5 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
            {/* Cost Breakdown Summary (Subtotal, Discount, Tax, Total) */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-neutral-500">
                <span>Subtotal</span>
                <span className="font-mono text-neutral-900">₹{itemsSubtotal.toFixed(2)}</span>
              </div>

              {discountTotal > 0 && (
                <div className="flex items-center justify-between text-neutral-900 font-semibold">
                  <span>Discount</span>
                  <span className="font-mono">-₹{discountTotal.toFixed(2)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-neutral-500">
                <span>Tax (5%)</span>
                <span className="font-mono text-neutral-900">₹{taxAmount.toFixed(2)}</span>
              </div>

              <div className="pt-1.5 border-t border-neutral-200 flex items-center justify-between text-sm font-bold text-neutral-900">
                <span>Total</span>
                <span className="text-lg font-black font-mono">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Selector (Cash, UPI, Card) */}
            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'upi', label: 'UPI / QR', icon: Smartphone },
                { id: 'card', label: 'Card', icon: CreditCard },
              ].map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-1.5 rounded-xl flex items-center justify-center gap-1 border text-xs font-semibold transition-all cursor-pointer ${
                      paymentMethod === m.id
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                        : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Smart Cash Tender Register Drawer (When Cash is chosen) */}
            {paymentMethod === 'cash' && cart.length > 0 && (
              <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5 animate-fadeIn text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-800 text-[11px]">Cash Handed:</span>
                  <button
                    type="button"
                    onClick={() => setTenderAmount(String(finalTotal))}
                    className="text-[10px] font-bold text-neutral-600 hover:text-black underline cursor-pointer"
                  >
                    Exact (₹{finalTotal})
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={tenderAmount}
                    onChange={(e) => setTenderAmount(e.target.value)}
                    placeholder={`e.g. ${finalTotal}`}
                    className="flex-1 bg-white border border-neutral-300 rounded-lg px-2 py-1 font-mono font-bold text-xs focus:outline-none focus:border-black"
                  />
                  {[100, 200, 500].map(den => (
                    <button
                      key={den}
                      type="button"
                      onClick={() => setTenderAmount(String(den))}
                      className="px-2 py-1 rounded-lg bg-white border border-neutral-200 font-mono text-[10px] font-bold hover:border-black cursor-pointer"
                    >
                      ₹{den}
                    </button>
                  ))}
                </div>

                {tenderNum >= finalTotal && tenderNum > 0 && (
                  <div className="p-1.5 bg-neutral-900 text-white rounded-lg text-center font-mono font-bold text-xs">
                    Change to Return: ₹{changeReturn.toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {/* Dynamic UPI On-Screen QR button (When UPI is chosen) */}
            {paymentMethod === 'upi' && cart.length > 0 && (
              <button
                type="button"
                onClick={() => setShowUPIModal(true)}
                className="w-full py-1.5 bg-neutral-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Show On-Screen QR Code</span>
              </button>
            )}

            {/* Big Action Buttons (Charge & Save as Draft) */}
            <div className="space-y-1.5 pt-0.5">
              {/* Primary: Charge & Print Bill -> */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isCheckingOut || cart.length === 0}
                className="w-full py-2.5 sm:py-3 bg-neutral-900 hover:bg-black disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <span>{isCheckingOut ? 'Processing...' : `Charge ₹${finalTotal.toFixed(2)} & Print Bill`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Secondary: Save as Draft (Hold Bill) */}
              <button
                type="button"
                onClick={handleParkBill}
                disabled={cart.length === 0}
                className="w-full py-2 bg-white hover:bg-neutral-50 disabled:opacity-40 text-neutral-800 border border-neutral-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
              >
                <Bookmark className="w-3.5 h-3.5 text-neutral-500" />
                <span>Save as Draft</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Modals */}
      {completedOrder && (
        <ReceiptModal
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
        />
      )}

      <POSKeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      <DynamicUPIModal
        isOpen={showUPIModal}
        onClose={() => setShowUPIModal(false)}
        amount={finalTotal}
        orderNumber={`ORD-${Date.now().toString().slice(-4)}`}
        onConfirmPayment={handleCheckout}
      />

      <CustomItemModal
        isOpen={showCustomItemModal}
        onClose={() => setShowCustomItemModal(false)}
        onAddCustomItem={handleAddCustomItem}
      />

      <ZReportModal
        isOpen={showZReportModal}
        onClose={() => setShowZReportModal(false)}
      />

      {/* Quick Portion / Variant Selection Modal */}
      <VariantSelectModal
        product={selectedProductForVariantModal}
        isOpen={Boolean(selectedProductForVariantModal)}
        onClose={() => setSelectedProductForVariantModal(null)}
        onAddToCart={addToCartProduct}
      />

    </div>
  );
}
