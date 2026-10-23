import React, { useState, useEffect } from 'react';
import { 
  ChefHat, Clock, Bell, CheckCircle, ShieldCheck, 
  RotateCcw, SlidersHorizontal, AlertCircle, ShoppingBag, 
  Check, Flame, ToggleLeft, ToggleRight, DollarSign, Search,
  Trophy, TrendingUp, Trash2, Sparkles, BarChart3, Filter, ArrowRight
} from 'lucide-react';
import PinVerificationModal from './PinVerificationModal';
import { playOrderPlacedSound } from '../../utils/sound';

export default function VendorDashboard({ socket, isConnected }) {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [stats, setStats] = useState({
    activeOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    completedToday: 0,
    todayRevenue: 0
  });
  const [bestsellersData, setBestsellersData] = useState({
    summary: { totalUnitsSold: 0, totalSalesRevenue: 0, uniqueProductsSold: 0, topItem: null },
    items: []
  });
  const [filter, setFilter] = useState('active'); // 'active', 'READY_FOR_PICKUP', 'PREPARING', 'PENDING', 'COMPLETED'
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'menu', 'bestsellers'
  const [searchQuery, setSearchQuery] = useState('');
  const [bestsellerSearch, setBestsellerSearch] = useState('');
  const [selectedOrderForPin, setSelectedOrderForPin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeStatus, setPurgeStatus] = useState('');

  // Fetch initial orders, menu, stats, and bestsellers
  const fetchData = async () => {
    try {
      const [ordersRes, menuRes, statsRes, bestsellersRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/menu'),
        fetch('/api/orders/stats/summary'),
        fetch('/api/orders/analytics/bestsellers')
      ]);

      const ordersData = await ordersRes.json();
      const menuData = await menuRes.json();
      const statsData = await statsRes.json();
      const bestsellersJson = await bestsellersRes.json();

      if (ordersData.success) setOrders(ordersData.orders);
      if (menuData.success) setMenuItems(menuData.items);
      if (statsData.success) setStats(statsData.stats);
      if (bestsellersJson.success) setBestsellersData(bestsellersJson);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time socket event listeners for Canteen Staff
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (newOrder) => {
      console.log('Incoming order received:', newOrder);
      playOrderPlacedSound();
      setOrders((prev) => [newOrder, ...prev]);
      fetchStats();
      fetchBestsellers();
    };

    const handleStatusUpdated = ({ orderNumber, status, order }) => {
      setOrders((prev) =>
        prev.map((o) => (o.order_number === orderNumber ? { ...o, ...order } : o))
      );
      fetchStats();
      fetchBestsellers();
    };

    const handleOrderVerified = ({ orderNumber, order }) => {
      setOrders((prev) =>
        prev.map((o) => (o.order_number === orderNumber ? { ...o, ...order } : o))
      );
      fetchStats();
      fetchBestsellers();
    };

    const handleMenuItemUpdated = (updatedItem) => {
      setMenuItems((prev) =>
        prev.map((it) => (it.id === updatedItem.id ? updatedItem : it))
      );
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_status_updated', handleStatusUpdated);
    socket.on('order_verified', handleOrderVerified);
    socket.on('menu_item_updated', handleMenuItemUpdated);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_status_updated', handleStatusUpdated);
      socket.off('order_verified', handleOrderVerified);
      socket.off('menu_item_updated', handleMenuItemUpdated);
    };
  }, [socket]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/orders/stats/summary');
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch {}
  };

  const fetchBestsellers = async () => {
    try {
      const res = await fetch('/api/orders/analytics/bestsellers');
      const data = await res.json();
      if (data.success) setBestsellersData(data);
    } catch {}
  };

  // Change order status (PREPARING or READY_FOR_PICKUP)
  const updateOrderStatus = async (orderNumber, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderNumber}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.order_number === orderNumber ? data.order : o))
        );
        fetchStats();
        fetchBestsellers();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Toggle item in stock / sold out
  const toggleItemStock = async (itemId) => {
    try {
      const res = await fetch(`/api/menu/${itemId}/toggle`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (data.success) {
        setMenuItems((prev) =>
          prev.map((item) => (item.id === itemId ? data.item : item))
        );
        setBestsellersData((prev) => ({
          ...prev,
          items: prev.items.map((item) =>
            item.menu_item_id === itemId ? { ...item, is_available: data.item.is_available } : item
          )
        }));
      }
    } catch (err) {
      console.error('Failed to toggle stock:', err);
    }
  };

  // Auto-purge 1 month data manual trigger (Requirement 4)
  const handleRunPurge = async () => {
    setIsPurging(true);
    setPurgeStatus('');
    try {
      const res = await fetch('/api/orders/cleanup-old', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 30 })
      });
      const data = await res.json();
      if (data.success) {
        setPurgeStatus(
          data.deletedOrders > 0
            ? `Auto-Purge Executed: Deleted ${data.deletedOrders} orders older than 1 month (${data.deletedItems} items purged).`
            : 'Auto-Purge Check Complete: No orders older than 1 month found in database.'
        );
        fetchData();
      } else {
        setPurgeStatus(data.message || 'Auto-purge completed.');
      }
    } catch (err) {
      console.error('Purge error:', err);
      setPurgeStatus('Error running auto-purge.');
    } finally {
      setIsPurging(false);
      setTimeout(() => setPurgeStatus(''), 7000);
    }
  };

  // Filter orders by status and search query
  const filteredOrders = orders.filter((order) => {
    const matchesFilter =
      filter === 'active'
        ? ['PENDING', 'PREPARING', 'READY_FOR_PICKUP'].includes(order.status)
        : order.status === filter;

    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items?.some((i) => i.item_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  // Filter bestsellers
  const filteredBestsellers = bestsellersData.items.filter((item) => {
    if (!bestsellerSearch.trim()) return true;
    const q = bestsellerSearch.toLowerCase();
    return (
      item.item_name?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q)
    );
  });

  const topItem = bestsellersData.summary?.topItem;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner / Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Canteen Staff Station #1 Live
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Order Fulfillment &amp; Kitchen Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time incoming orders, preparation queue, and secure PIN pickup verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Tab Switcher with Dedicated Most Sold Items Section */}
          <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Order Queue
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Stock Manager ({menuItems.length})
            </button>
            <button
              onClick={() => setActiveTab('bestsellers')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'bestsellers'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                  : 'text-orange-400 hover:text-orange-300'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Most Sold Items</span>
              {topItem && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                  {topItem.count}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            title="Refresh All Data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Active Queue */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active in Queue</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-white">{stats.activeOrders}</span>
            <span className="text-[11px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md">Live</span>
          </div>
        </div>

        {/* Preparing */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col justify-between">
          <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">In Kitchen</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-amber-400">{stats.preparingOrders}</span>
            <ChefHat className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        {/* Ready for Pickup */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between">
          <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Ready at Counter</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-emerald-400">{stats.readyOrders}</span>
            <Bell className="w-5 h-5 text-emerald-400 animate-bounce" />
          </div>
        </div>

        {/* Completed Today */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Collected with PIN</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-slate-200">{stats.completedToday}</span>
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          </div>
        </div>

        {/* Today Revenue */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between col-span-2 lg:col-span-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Revenue</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-amber-400">₹{stats.todayRevenue}</span>
            <span className="text-xs text-emerald-400 font-bold">100% Paid</span>
          </div>
        </div>
      </div>

      {/* Top Sold Item Quick Spotlight Banner */}
      {topItem && activeTab !== 'bestsellers' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-orange-500/15 border border-orange-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-md">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  #1 Top Sold Item
                </span>
                <span className="text-xs font-extrabold text-white">{topItem.name}</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Highest demand snack with <strong className="text-amber-300">{topItem.count} units sold</strong> generating <strong className="text-emerald-400">₹{topItem.revenue}</strong> in revenue.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('bestsellers')}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <span>View All Sold Counts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TAB 1: ORDER QUEUE */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'active', label: 'All Active Queue' },
                { id: 'PENDING', label: '⏳ New / Pending' },
                { id: 'PREPARING', label: '🍳 In Kitchen' },
                { id: 'READY_FOR_PICKUP', label: '🔔 Ready for Pickup' },
                { id: 'COMPLETED', label: '✅ Completed History' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    filter === f.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Order ID, name, snack..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Orders Grid / Queue Cards */}
          {filteredOrders.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
              <div className="text-3xl mb-2">🍽️</div>
              <h3 className="font-bold text-slate-300">No orders match this filter</h3>
              <p className="text-xs text-slate-500 mt-1">Select another filter or wait for students to pre-order.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => {
                const isPending = order.status === 'PENDING';
                const isPreparing = order.status === 'PREPARING';
                const isReady = order.status === 'READY_FOR_PICKUP';
                const isCompleted = order.status === 'COMPLETED';

                return (
                  <div
                    key={order.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isReady
                        ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/40'
                        : isPreparing
                        ? 'bg-amber-950/20 border-amber-500/50 shadow-lg shadow-amber-950/30'
                        : isCompleted
                        ? 'bg-slate-950/60 border-slate-800 opacity-80'
                        : 'bg-slate-900/90 border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Card Header: Order #, Status, Time */}
                      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-3">
                        <div>
                          <span className="font-mono text-sm font-black text-white">
                            {order.order_number}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {new Date(order.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div>
                          {isPending && (
                            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold uppercase">
                              ⏳ New Order
                            </span>
                          )}
                          {isPreparing && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold uppercase">
                              🍳 Cooking
                            </span>
                          )}
                          {isReady && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase animate-pulse">
                              🔔 Ready for PIN
                            </span>
                          )}
                          {isCompleted && (
                            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold uppercase">
                              ✅ Handed Over
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="mb-3">
                        <div className="text-xs font-bold text-slate-200">
                          {order.customer_name}
                        </div>
                        {order.customer_phone && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            {order.customer_phone}
                          </div>
                        )}
                        {order.notes && (
                          <div className="mt-1.5 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 text-[11px]">
                            <strong>Note:</strong> {order.notes}
                          </div>
                        )}
                      </div>

                      {/* Ordered Items List */}
                      <div className="space-y-1.5 mb-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Items to prepare:
                        </span>
                        {order.items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-xs py-1 border-b border-slate-800/40"
                          >
                            <span className="text-slate-200 font-medium">
                              <span className="font-extrabold text-amber-400 mr-2">
                                {item.quantity}x
                              </span>
                              {item.item_name}
                            </span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              ₹{item.subtotal}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div className="text-xs">
                        <span className="text-slate-400 block text-[10px]">Total Paid:</span>
                        <span className="font-black text-amber-400 text-sm">
                          ₹{order.total_amount}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <button
                            onClick={() => updateOrderStatus(order.order_number, 'PREPARING')}
                            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                          >
                            <ChefHat className="w-3.5 h-3.5" />
                            <span>Start Cooking</span>
                          </button>
                        )}

                        {isPreparing && (
                          <button
                            onClick={() => updateOrderStatus(order.order_number, 'READY_FOR_PICKUP')}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>Mark Ready</span>
                          </button>
                        )}

                        {isReady && (
                          <button
                            onClick={() => setSelectedOrderForPin(order)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 animate-pulse cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Verify 4-Digit PIN</span>
                          </button>
                        )}

                        {isCompleted && (
                          <div className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>PIN Verified</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STOCK MANAGER */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">Live Menu Inventory &amp; Stock Toggles</h3>
              <p className="text-xs text-slate-400">
                Instantly mark items as In Stock or Sold Out to update student order trays in real time.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{item.name}</h4>
                    <span className="text-xs text-amber-400 font-semibold">₹{item.price}</span>
                    <span className="text-[11px] text-slate-500 block">{item.category}</span>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => toggleItemStock(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      item.is_available === 1
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {item.is_available === 1 ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-400" />
                        <span>In Stock</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-rose-400" />
                        <span>Sold Out</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SEPARATE SECTION: WHAT ITEM SOLD MOST & NUMBER OF ITEMS SOLD (Requirement 6 & 4) */}
      {activeTab === 'bestsellers' && (
        <div className="space-y-6">
          {/* Section Header */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-orange-950/60 via-slate-900 to-amber-950/60 border border-orange-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold mb-2">
                <Flame className="w-3.5 h-3.5" />
                <span>Sales Intelligence &amp; Most Sold Products</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Item Sales Volume &amp; Best-Seller Rankings
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Clear count of how many times each item was ordered and total units sold. Identify the campus favorites to plan kitchen prep efficiently.
              </p>
            </div>

            {/* Auto Purge 1-Month Control (Requirement 4) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Auto-Purge 1 Month</span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Past 30-day records automatically deleted
                </span>
              </div>
              <button
                onClick={handleRunPurge}
                disabled={isPurging}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>{isPurging ? 'Purging...' : 'Purge Old Data Now'}</span>
              </button>
            </div>
          </div>

          {/* Purge Notification */}
          {purgeStatus && (
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>{purgeStatus}</span>
            </div>
          )}

          {/* Sales KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Champion Card: #1 Most Sold */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent border-2 border-amber-500/40 shadow-xl col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-amber-400 mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  #1 Most Sold Item
                </span>
                <span className="text-xl">👑</span>
              </div>
              <div className="text-lg font-black text-white truncate">
                {topItem ? topItem.name : 'No sales yet'}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-300">
                  {topItem ? topItem.count : 0}
                </span>
                <span className="text-xs text-slate-400 font-bold uppercase">Units Sold</span>
              </div>
              {topItem && (
                <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                  Generated ₹{topItem.revenue} revenue
                </div>
              )}
            </div>

            {/* Total Units Sold Across All Items */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Units Sold</span>
                <ShoppingBag className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {bestsellersData.summary?.totalUnitsSold || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Combined snack portions</p>
            </div>

            {/* Unique Menu Items Sold */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Products Ordered</span>
                <BarChart3 className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {bestsellersData.summary?.uniqueProductsSold || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Different snacks with orders</p>
            </div>

            {/* Cumulative Revenue */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                ₹{bestsellersData.summary?.totalSalesRevenue || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">100% pre-paid via UPI / Card</p>
            </div>
          </div>

          {/* Search bar inside Bestsellers */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Itemized Sales Count Breakdown</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs">
                {filteredBestsellers.length} items
              </span>
            </h3>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search snack sales count..."
                value={bestsellerSearch}
                onChange={(e) => setBestsellerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Ranked List Grid */}
          <div className="space-y-3">
            {filteredBestsellers.map((item, index) => {
              const totalUnits = bestsellersData.summary?.totalUnitsSold || 1;
              const percent = Math.round((item.total_sold_count / (totalUnits || 1)) * 100);
              const isTop = index === 0 && item.total_sold_count > 0;

              return (
                <div
                  key={item.menu_item_id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isTop
                      ? 'bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border-amber-500/40 shadow-lg'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  {/* Left: Rank, Image, Name */}
                  <div className="flex items-center gap-3.5 min-w-[280px]">
                    <div className="flex-shrink-0 w-8 text-center">
                      {index === 0 && item.total_sold_count > 0 ? (
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-amber-400 text-slate-950 font-black text-sm shadow-md">
                          🥇
                        </span>
                      ) : index === 1 && item.total_sold_count > 0 ? (
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-slate-300 text-slate-950 font-black text-sm">
                          🥈
                        </span>
                      ) : index === 2 && item.total_sold_count > 0 ? (
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-amber-700 text-white font-black text-sm">
                          🥉
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono font-bold text-xs">
                          #{index + 1}
                        </span>
                      )}
                    </div>

                    <img
                      src={item.image_url}
                      alt={item.item_name}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-800 flex-shrink-0"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-white">
                          {item.item_name}
                        </h4>
                        {isTop && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                            Top Seller
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                        <span>{item.category}</span>
                        <span>&bull;</span>
                        <span className="text-amber-400 font-semibold">₹{item.price} each</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Sales Count Badge & Visual Progress Bar */}
                  <div className="flex-1 max-w-md space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-400">Total Units Sold:</span>
                      <span className="font-black text-base text-amber-300">
                        {item.total_sold_count} {item.total_sold_count === 1 ? 'unit' : 'units'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isTop
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                        }`}
                        style={{ width: `${Math.max(percent, item.total_sold_count > 0 ? 5 : 0)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{percent}% of all canteen sales</span>
                      <span>In {item.total_orders_count || 0} separate orders</span>
                    </div>
                  </div>

                  {/* Right: Revenue & Stock toggle */}
                  <div className="flex items-center justify-between md:justify-end gap-4 min-w-[180px] pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                        Item Revenue
                      </span>
                      <span className="font-black text-base text-emerald-400">
                        ₹{item.total_revenue || 0}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleItemStock(item.menu_item_id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        item.is_available === 1
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {item.is_available === 1 ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-400" />
                          <span>In Stock</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-rose-400" />
                          <span>Sold Out</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PIN Verification Modal */}
      {selectedOrderForPin && (
        <PinVerificationModal
          isOpen={!!selectedOrderForPin}
          onClose={() => setSelectedOrderForPin(null)}
          order={selectedOrderForPin}
          onVerificationSuccess={(completedOrder) => {
            setOrders((prev) =>
              prev.map((o) => (o.order_number === completedOrder.order_number ? completedOrder : o))
            );
            fetchStats();
            fetchBestsellers();
          }}
        />
      )}
    </div>
  );
}
