import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MenuCard from './components/Student/MenuCard';
import CartDrawer from './components/Student/CartDrawer';
import PaymentModal from './components/Student/PaymentModal';
import OrderConfirmation from './components/Student/OrderConfirmation';
import UserAccountModal from './components/Student/UserAccountModal';
import VendorDashboard from './components/Vendor/VendorDashboard';
import AuthPage from './components/Auth/AuthPage';
import socket from './utils/socket';
import { 
  Search, Sparkles, Clock, ArrowRight, ShieldCheck, 
  Flame, CheckCircle, RefreshCw, AlertCircle 
} from 'lucide-react';
import { playOrderPlacedSound } from './utils/sound';

export default function App() {
  // Current authenticated user session (persisted in localStorage)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('campusbite_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Active view role: 'student' | 'vendor'
  const [activeRole, setActiveRole] = useState(() => {
    try {
      const saved = localStorage.getItem('campusbite_user');
      if (saved) {
        const u = JSON.parse(saved);
        return u.role === 'staff' ? 'vendor' : 'student';
      }
    } catch {}
    return 'student';
  });

  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart & Checkout state
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [pendingCheckoutData, setPendingCheckoutData] = useState(null);

  // Active student order (strictly tied to individual currentUser)
  const [activeOrder, setActiveOrder] = useState(null);

  // Socket state
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  // Load menu items
  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (data.success) {
        setMenuItems(data.items);
      }
    } catch (err) {
      console.error('Failed to load menu:', err);
    }
  };

  // Sync active order specifically for the logged-in user from the server
  const fetchUserActiveOrder = async (username) => {
    if (!username || username === 'admin') return;
    try {
      const res = await fetch(`/api/orders/user/${encodeURIComponent(username)}/active`);
      const data = await res.json();
      if (data.success) {
        setActiveOrder(data.activeOrder || null);
      }
    } catch (err) {
      console.error('Failed to sync user active order:', err);
    }
  };

  // Whenever currentUser changes (login, logout, switch account):
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'staff') {
        setActiveRole('vendor');
        setActiveOrder(null);
        setCart([]);
      } else {
        setActiveRole('student');
        // Load active order specific to this individual user
        try {
          const userKey = `campusbite_active_order_${currentUser.username}`;
          const saved = localStorage.getItem(userKey);
          setActiveOrder(saved ? JSON.parse(saved) : null);
        } catch {
          setActiveOrder(null);
        }
        // Fetch active order from server for this individual user
        fetchUserActiveOrder(currentUser.username);
      }
    } else {
      setActiveOrder(null);
      setCart([]);
      setActiveRole('student');
    }
  }, [currentUser?.username, currentUser?.role]);

  // Save active order to user-specific localStorage key
  useEffect(() => {
    if (currentUser?.username && currentUser.role !== 'staff') {
      const userKey = `campusbite_active_order_${currentUser.username}`;
      if (activeOrder && (activeOrder.username === currentUser.username || !activeOrder.username)) {
        localStorage.setItem(userKey, JSON.stringify(activeOrder));
      } else if (!activeOrder) {
        localStorage.removeItem(userKey);
      }
    }
  }, [activeOrder, currentUser?.username]);

  // Refresh active order status
  const refreshActiveOrder = async () => {
    if (!activeOrder?.order_number) return;
    try {
      const res = await fetch(`/api/orders/${activeOrder.order_number}`);
      const data = await res.json();
      if (data.success) {
        setActiveOrder(data.order);
      }
    } catch (err) {
      console.error('Failed to refresh order status:', err);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // Socket connection & real-time events
  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onNewOrder() {
      setPendingOrdersCount((c) => c + 1);
    }

    function onStatusUpdated({ orderNumber, order }) {
      if (activeOrder && activeOrder.order_number === orderNumber) {
        setActiveOrder(order);
      }
    }

    function onOrderVerified({ orderNumber, order }) {
      if (activeOrder && activeOrder.order_number === orderNumber) {
        setActiveOrder(order);
      }
    }

    function onMenuItemUpdated(updatedItem) {
      setMenuItems((prev) =>
        prev.map((it) => (it.id === updatedItem.id ? updatedItem : it))
      );
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('new_order', onNewOrder);
    socket.on('order_status_updated', onStatusUpdated);
    socket.on('order_verified', onOrderVerified);
    socket.on('menu_item_updated', onMenuItemUpdated);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new_order', onNewOrder);
      socket.off('order_status_updated', onStatusUpdated);
      socket.off('order_verified', onOrderVerified);
      socket.off('menu_item_updated', onMenuItemUpdated);
    };
  }, [activeOrder]);

  // Auth Handlers
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user.role === 'staff') {
      setActiveRole('vendor');
    } else {
      setActiveRole('student');
    }
  };

  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('campusbite_user', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    localStorage.removeItem('campusbite_user');
    setCurrentUser(null);
    setActiveOrder(null);
    setCart([]);
    setPendingCheckoutData(null);
    setActiveRole('student');
  };

  // Cart operations
  const handleAddToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (itemId, newQty) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== itemId));
    } else {
      setCart((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i))
      );
    }
  };

  const handleRemoveItem = (itemId) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Checkout flow: Open Mock Payment
  const handleProceedToPayment = (checkoutInfo) => {
    setPendingCheckoutData(checkoutInfo);
    setIsCartOpen(false);
    setIsPaymentModalOpen(true);
  };

  // Payment completed -> Create actual order on server with user attribution
  const handleConfirmPayment = async ({ paymentMethod, paymentRef }) => {
    try {
      const orderPayload = {
        customerName: pendingCheckoutData.customerName || currentUser?.full_name || currentUser?.username,
        customerPhone: pendingCheckoutData.customerPhone || currentUser?.phone || null,
        notes: pendingCheckoutData.notes,
        paymentMethod,
        paymentRef,
        username: currentUser?.username,
        userId: currentUser?.id || null,
        items: cart.map((i) => ({ id: i.id, quantity: i.quantity }))
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        playOrderPlacedSound();
        setActiveOrder(data.order);
        setCart([]);
        setIsPaymentModalOpen(false);
      } else {
        alert(data.message || 'Failed to place order.');
      }
    } catch (err) {
      console.error('Order creation error:', err);
      alert('Network error while placing order. Please check server.');
    }
  };

  // If user is not logged in, render the unified Register / Login page
  if (!currentUser) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Categories list
  const categories = ['All', 'Evening Snacks', 'Quick Bites', 'Beverages', 'South Indian'];

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAccount={() => setIsAccountModalOpen(true)}
        cartCount={cartTotalCount}
        onOpenCart={() => setIsCartOpen(true)}
        isConnected={isConnected}
        pendingOrdersCount={pendingOrdersCount}
        activeOrder={activeOrder}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeRole === 'vendor' ? (
          /* Staff / Canteen Owner Dashboard */
          <VendorDashboard socket={socket} isConnected={isConnected} />
        ) : (
          /* Customer / Student Flow */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
            {/* If Student Has an Active Order, show prominent banner */}
            {activeOrder && activeOrder.status !== 'COMPLETED' && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 border-2 border-orange-500/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-500 text-white font-black flex items-center justify-center text-lg shadow-md shadow-orange-500/30">
                    ⚡
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">Active Order #{activeOrder.order_number}</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                        {activeOrder.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Secret Pickup PIN: <strong className="text-amber-300 font-mono tracking-widest text-sm">{activeOrder.pin_display}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      const el = document.getElementById('order-confirmation-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>View Pickup Screen</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* If viewing active order detail screen */}
            {activeOrder ? (
              <div id="order-confirmation-section">
                <OrderConfirmation
                  order={activeOrder}
                  onResetOrder={() => setActiveOrder(null)}
                  onRefreshOrder={refreshActiveOrder}
                />
              </div>
            ) : null}

            {/* Menu Header Hero Banner with Updated Tagline */}
            <div className="relative rounded-3xl overflow-hidden p-6 sm:p-10 bg-gradient-to-r from-orange-950/60 via-slate-900 to-amber-950/60 border border-orange-500/20 shadow-2xl">
              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>College Canteen Express Pre-Order</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  Skip the Queue <br />
                  <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                    Grab your Item
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Pre-order hot snacks, pay securely online, and collect at Counter #1 using your secret 4-digit verification PIN when your order is called.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Guaranteed Hot Food
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    PIN-Protected Handover
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Zero Wait at Counter
                  </span>
                </div>
              </div>
            </div>

            {/* Category Navigation & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search samosa, chai, dosa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            {/* Menu Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-extrabold text-white">
                  {selectedCategory === 'All' ? 'Evening Menu Specials' : selectedCategory}
                </h2>
                <span className="text-xs text-slate-400 font-medium">
                  {filteredMenuItems.length} items available
                </span>
              </div>

              {filteredMenuItems.length === 0 ? (
                <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
                  <div className="text-3xl mb-2">🔍</div>
                  <h3 className="font-bold text-slate-300">No snacks match your search</h3>
                  <p className="text-xs text-slate-500 mt-1">Try another category or clear your search term.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {filteredMenuItems.map((item) => {
                    const cartItem = cart.find((i) => i.id === item.id);
                    return (
                      <MenuCard
                        key={item.id}
                        item={item}
                        cartItem={cartItem}
                        onAddToCart={handleAddToCart}
                        onUpdateQuantity={handleUpdateQuantity}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Cart Drawer Modal */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onProceedToPayment={handleProceedToPayment}
        currentUser={currentUser}
      />

      {/* Advance Payment Simulation Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        orderDetails={pendingCheckoutData}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* User Individual Account & Profile Modal */}
      <UserAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">CampusBite</span>
            <span>&bull;</span>
            <span>Smart College Canteen Queue Optimization</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Powered by Node.js, Express, WebSockets, SQLite &amp; React
          </div>
        </div>
      </footer>
    </div>
  );
}
