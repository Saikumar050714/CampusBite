import React, { useState, useEffect } from 'react';
import { 
  X, Wallet, Receipt, Clock, CheckCircle2, AlertCircle, 
  RefreshCw, Copy, Check, ShieldCheck, ChevronRight, ShoppingBag, 
  ArrowUpRight, User, Phone, IdCard, Edit2, Save, Sparkles 
} from 'lucide-react';

export default function UserAccountModal({ isOpen, onClose, currentUser, onUpdateUser }) {
  const [profile, setProfile] = useState(currentUser || null);
  const [historyData, setHistoryData] = useState({
    stats: { totalPaid: 0, totalOrders: 0, completedOrders: 0, activeOrders: 0 },
    orders: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedOrderId, setCopiedOrderId] = useState(null);
  const [copiedPin, setCopiedPin] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStudentId, setEditStudentId] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  const fetchProfileAndHistory = async () => {
    if (!currentUser?.username) return;
    setLoading(true);
    setError('');

    try {
      const [historyRes, profileRes] = await Promise.all([
        fetch(`/api/orders/user/${encodeURIComponent(currentUser.username)}`),
        fetch(`/api/auth/profile/${encodeURIComponent(currentUser.username)}`)
      ]);

      const historyJson = await historyRes.json();
      const profileJson = await profileRes.json();

      if (historyJson.success) {
        setHistoryData(historyJson);
      }
      if (profileJson.success && profileJson.user) {
        setProfile(profileJson.user);
        setEditFullName(profileJson.user.full_name || profileJson.user.username || '');
        setEditPhone(profileJson.user.phone || '');
        setEditStudentId(profileJson.user.student_id || '');
      }
    } catch (err) {
      console.error('History fetch error:', err);
      setError('Network error loading account history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      setProfile(currentUser);
      setEditFullName(currentUser.full_name || currentUser.username || '');
      setEditPhone(currentUser.phone || '');
      setEditStudentId(currentUser.student_id || '');
      fetchProfileAndHistory();
    }
  }, [isOpen, currentUser?.username]);

  if (!isOpen || !currentUser) return null;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg('');
    setError('');

    try {
      const res = await fetch(`/api/auth/profile/${encodeURIComponent(currentUser.username)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editFullName.trim(),
          phone: editPhone.trim(),
          studentId: editStudentId.trim()
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        setProfile(data.user);
        if (onUpdateUser) {
          onUpdateUser(data.user);
        }
        setIsEditingProfile(false);
        setProfileSuccessMsg('Profile updated successfully!');
        setTimeout(() => setProfileSuccessMsg(''), 4000);
      } else {
        setError(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Save profile error:', err);
      setError('Server error updating profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const copyText = (text, type, id) => {
    navigator.clipboard.writeText(text);
    if (type === 'order') {
      setCopiedOrderId(id);
      setTimeout(() => setCopiedOrderId(null), 2000);
    } else {
      setCopiedPin(id);
      setTimeout(() => setCopiedPin(null), 2000);
    }
  };

  const filteredOrders = historyData.orders.filter((order) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const matchesNumber = order.order_number?.toLowerCase().includes(q);
    const matchesItem = order.items?.some((i) => i.item_name?.toLowerCase().includes(q));
    const matchesRef = order.payment_ref?.toLowerCase().includes(q);
    return matchesNumber || matchesItem || matchesRef;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
            Order Placed
          </span>
        );
      case 'PREPARING':
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            In Kitchen
          </span>
        );
      case 'READY_FOR_PICKUP':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Ready for Pickup!
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Collected
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold uppercase">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex justify-center items-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#0f1523] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header: Individual User Profile */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-orange-500/20 uppercase flex-shrink-0">
              {currentUser?.username?.[0] || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white">
                  {profile?.full_name || currentUser?.username}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-mono font-bold">
                  @{currentUser?.username}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase">
                  Individual Profile
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                {profile?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{profile.phone}</span>
                  </span>
                )}
                {profile?.student_id && (
                  <span className="flex items-center gap-1">
                    <IdCard className="w-3 h-3 text-slate-500" />
                    <span>ID: {profile.student_id}</span>
                  </span>
                )}
                <span>&bull;</span>
                <span>Member account</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 hover:text-white border border-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-orange-400" />
              <span>{isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>
            <button
              onClick={fetchProfileAndHistory}
              disabled={loading}
              title="Refresh History"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile Edit Panel (Toggleable) */}
        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-orange-400 flex items-center gap-1.5 uppercase tracking-wider">
              <User className="w-3.5 h-3.5" />
              <span>Update Your Personal Details</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Student / Roll ID</label>
                <input
                  type="text"
                  value={editStudentId}
                  onChange={(e) => setEditStudentId(e.target.value)}
                  placeholder="e.g. CS-2024-042"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingProfile ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        )}

        {profileSuccessMsg && (
          <div className="p-3 bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{profileSuccessMsg}</span>
          </div>
        )}

        {/* Stats Summary Bar for THIS individual user */}
        <div className="p-5 sm:p-6 bg-slate-900/60 border-b border-slate-800/80">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Paid by this user */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/30 shadow-md">
              <div className="flex items-center justify-between text-emerald-400 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Your Total Paid</span>
                <Wallet className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-emerald-300">
                ₹{historyData.stats.totalPaid}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Strictly your spending</p>
            </div>

            {/* Total Orders */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Your Orders</span>
                <Receipt className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl font-black text-white">
                {historyData.stats.totalOrders}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Pre-orders placed</p>
            </div>

            {/* Completed */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Collected</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">
                {historyData.stats.completedOrders}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Handed over</p>
            </div>

            {/* Active / In Progress */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">In Progress</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-300">
                {historyData.stats.activeOrders}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">In kitchen / pickup</p>
            </div>
          </div>
        </div>

        {/* Content Body: User's Individual Transactions List */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>Personal Order &amp; Payment History</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
                  {filteredOrders.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Only showing transactions placed under account: <strong>{currentUser.username}</strong>
              </p>
            </div>

            {historyData.orders.length > 0 && (
              <input
                type="text"
                placeholder="Filter your orders..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full sm:w-60 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-orange-400" />
              <p className="text-xs">Loading your personal account history...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-14 text-center border border-dashed border-slate-800 rounded-3xl p-6 bg-slate-950/40 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto text-2xl">
                👛
              </div>
              <h4 className="text-sm font-bold text-slate-200">
                {searchFilter ? 'No transactions match your search' : 'No Orders for this Account Yet'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchFilter
                  ? 'Try clearing the search query to see all your orders.'
                  : `You are logged in as "${currentUser.username}". Place a pre-order from the menu to see your payments here!`}
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition-all space-y-3"
                >
                  {/* Top line: Order #, Status, Amount */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-white">
                        {order.order_number}
                      </span>
                      <button
                        onClick={() => copyText(order.order_number, 'order', order.id)}
                        title="Copy Order ID"
                        className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors cursor-pointer"
                      >
                        {copiedOrderId === order.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="text-[11px] text-slate-500">
                        &bull; {new Date(order.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.status)}
                      <div className="text-right">
                        <span className="font-black text-base text-emerald-400">
                          ₹{order.total_amount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details & Secret PIN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/50 text-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                        Payment Status &amp; Method:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-extrabold text-[10px]">
                          PAID &bull; {order.payment_method || 'UPI'}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          Ref: {order.payment_ref}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                        Pickup Verification PIN:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-black tracking-widest text-xs">
                          {order.pin_display}
                        </span>
                        <button
                          onClick={() => copyText(order.pin_display, 'pin', order.id)}
                          className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          {copiedPin === order.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy PIN</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Items list */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Ordered Items:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {order.items?.map((item) => (
                        <span
                          key={item.id}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 text-xs border border-slate-800 flex items-center gap-1.5"
                        >
                          <span className="font-bold text-orange-400">{item.quantity}x</span>
                          <span>{item.item_name}</span>
                          <span className="text-slate-500 text-[10px]">(₹{item.subtotal})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Profile and order history private to @{currentUser.username}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
