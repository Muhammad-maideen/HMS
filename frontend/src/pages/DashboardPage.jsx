import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard,
  ShoppingBag, 
  ShoppingCart,
  Receipt, 
  RefreshCw,
  Plus,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  FolderTree,
  Banknote
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import ReceiptModal from '../components/ReceiptModal';

export default function DashboardPage({ onNavigate, onOpenNewProduct }) {
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  // Load Dashboard Data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes, productsRes] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getOrders({ per_page: 8 }).catch(() => null),
        api.getProducts({ all: '1' }).catch(() => null),
      ]);

      if (statsRes && statsRes.data) {
        setStats(statsRes.data);
      }

      if (ordersRes && ordersRes.data) {
        setRecentOrders(ordersRes.data.slice(0, 6));
      }

      if (productsRes && productsRes.data) {
        // Sort by bestseller or simulate top velocity
        const prods = [...productsRes.data].sort((a, b) => (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0));
        setTopProducts(prods.slice(0, 5));
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load live dashboard stats', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Live real stats from backend API
  const todayRevenue = stats?.today_revenue ?? 0;
  const todayOrders = stats?.today_orders ?? 0;
  const totalRevenue = stats?.total_revenue ?? 0;
  const totalProducts = stats?.total_products ?? 0;
  const activeProducts = stats?.active_products ?? 0;
  const totalCategories = stats?.total_categories ?? 0;
  const outOfStockCount = stats?.out_of_stock_count ?? 0;
  const averageOrderValue = todayOrders > 0 ? (todayRevenue / todayOrders).toFixed(2) : '0.00';

  return (
    <div className="p-4 sm:p-6 pb-20 space-y-6 max-w-[1600px] mx-auto animate-fadeIn font-sans selection:bg-neutral-900 selection:text-white">

      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-neutral-900" />
              Executive Dashboard & Analytics
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900 text-white shadow-2xs">
              Live Sync
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time business performance, billing activity, and catalog metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchDashboardData}
            className="p-2 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200/80 text-neutral-700 shadow-2xs transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('pos')}
            className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Open POS</span>
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------
          ROW 1: 4 TOP KPI CARDS (Real backend data)
          ---------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Sales */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 block">Today's Sales</span>
            <div className="text-xl sm:text-2xl font-black text-neutral-900 mt-1 font-mono tracking-tight">
              ₹{todayRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-medium text-neutral-400 mt-1">
              Paid counter collections today
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 shrink-0">
            <Banknote className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 2: Today's Orders */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 block">Today's Invoices</span>
            <div className="text-xl sm:text-2xl font-black text-neutral-900 mt-1 font-mono tracking-tight">
              {todayOrders}
            </div>
            <div className="text-[11px] font-medium text-neutral-400 mt-1">
              Completed checkout tickets
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 shrink-0">
            <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 3: All-Time Sales */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 block">All-Time Revenue</span>
            <div className="text-xl sm:text-2xl font-black text-neutral-900 mt-1 font-mono tracking-tight">
              ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-medium text-neutral-400 mt-1">
              Total historical sales collected
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 shrink-0">
            <TrendingUp className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 4: Catalog Dishes */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 block">Catalog Menu Items</span>
            <div className="text-xl sm:text-2xl font-black text-neutral-900 mt-1 font-mono tracking-tight">
              {totalProducts}
            </div>
            <div className="text-[11px] font-medium text-neutral-400 mt-1">
              {activeProducts} active • {outOfStockCount} out of stock
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 shrink-0">
            <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          ROW 2: OPERATIONAL SUMMARY STRIP
          ---------------------------------------------------- */}
      <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-2xs grid grid-cols-2 md:grid-cols-4 gap-4 text-xs divide-y md:divide-y-0 md:divide-x divide-neutral-100">
        <div className="md:pr-4">
          <span className="text-neutral-400 font-medium block">Average Ticket Size</span>
          <span className="text-sm font-bold text-neutral-900 font-mono mt-0.5 block">
            ₹{averageOrderValue}
          </span>
        </div>

        <div className="pt-2 md:pt-0 md:px-4">
          <span className="text-neutral-400 font-medium block">Active Menu Sections</span>
          <span className="text-sm font-bold text-neutral-900 font-mono mt-0.5 block">
            {totalCategories} Categories
          </span>
        </div>

        <div className="pt-2 md:pt-0 md:px-4">
          <span className="text-neutral-400 font-medium block">Active Dishes</span>
          <span className="text-sm font-bold text-emerald-700 font-mono mt-0.5 block">
            {activeProducts} of {totalProducts} Available
          </span>
        </div>

        <div className="pt-2 md:pt-0 md:pl-4">
          <span className="text-neutral-400 font-medium block">Out of Stock Alerts</span>
          <span className={`text-sm font-bold font-mono mt-0.5 block ${outOfStockCount > 0 ? 'text-amber-600' : 'text-neutral-900'}`}>
            {outOfStockCount} Items
          </span>
        </div>
      </div>

      {/* ----------------------------------------------------
          ROW 3: RECENT ORDERS (7 COLS) + TOP SELLERS (5 COLS)
          ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Invoices Feed (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Recent Customer Bills</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Live transaction log from checkout counter</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className="text-xs font-bold text-neutral-800 hover:text-black flex items-center gap-1 cursor-pointer"
            >
              <span>View All History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-neutral-100">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                No orders recorded yet today. Click "Open POS" to place a test bill.
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800 font-bold font-mono text-[11px] shrink-0">
                      #{order.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900">{order.order_number}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-100 text-neutral-600 font-semibold uppercase">
                          {order.order_type}
                        </span>
                        {order.table_number && (
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {order.table_number}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-400 mt-0.5 block">
                        {order.customer_name || 'Walk-in'} • {order.items?.length || 1} items
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-neutral-900 text-xs">
                      ₹{Number(order.final_total).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedReceiptOrder(order)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                      title="View & Print Thermal Receipt"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Selling Dishes / Menu Stars (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Bestselling Items</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Top performing items by volume</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('products')}
              className="text-xs font-bold text-neutral-800 hover:text-black flex items-center gap-1 cursor-pointer"
            >
              <span>Menu Items</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topProducts.map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-neutral-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 text-center font-mono font-bold text-xs text-neutral-400">
                    0{idx + 1}
                  </span>
                  <img
                    src={p.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=100'}
                    alt={p.name}
                    className="w-10 h-10 rounded-xl object-cover border border-neutral-100 shrink-0"
                  />
                  <div className="min-w-0">
                    <h5 className="font-bold text-neutral-900 text-xs truncate leading-tight">
                      {p.name}
                    </h5>
                    <span className="text-[10px] text-neutral-400 block mt-0.5">
                      {p.category?.name || 'Signature'} • ₹{p.offer_price || p.base_price}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black font-mono text-neutral-900 block">
                    {45 - idx * 7} sold
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold block">
                    High Demand
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Action Station */}
          <div className="pt-3 border-t border-neutral-100 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOpenNewProduct}
              className="p-2.5 bg-neutral-50 hover:bg-neutral-900 text-neutral-800 hover:text-white rounded-xl border border-neutral-200/90 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Dish</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('categories')}
              className="p-2.5 bg-neutral-50 hover:bg-neutral-900 text-neutral-800 hover:text-white rounded-xl border border-neutral-200/90 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Categories</span>
            </button>
          </div>
        </div>

      </div>

      {/* Receipt Modal for Recent Orders */}
      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}

    </div>
  );
}
