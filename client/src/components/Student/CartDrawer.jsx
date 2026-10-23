import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToPayment,
  currentUser
}) {
  const [customerName, setCustomerName] = useState(currentUser?.full_name || currentUser?.username || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.full_name || currentUser.username || '');
      setCustomerPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Maximum prep time
  const maxPrepTime = cartItems.reduce((max, item) => Math.max(max, item.prep_time_minutes || 5), 5);
  const estimatedPrep = Math.min(25, maxPrepTime + Math.floor(cartItems.length * 1.5));

  const handleCheckout = () => {
    if (!customerName.trim()) {
      setError('Please provide your name or student ID so the canteen staff knows whose order it is.');
      return;
    }
    setError('');
    onProceedToPayment({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      notes: notes.trim(),
      totalAmount,
      estimatedPrep,
      username: currentUser?.username || customerName.trim(),
      userId: currentUser?.id || null
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/75 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-[#0f1523] border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-bold">
              🛒
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-100">Your Snack Tray</h2>
              <p className="text-xs text-slate-400">{totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} selected</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {cartItems.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-slate-800/80 flex items-center justify-center text-2xl mb-3">
                🥟
              </div>
              <h3 className="font-semibold text-slate-200">Your tray is empty</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Browse our evening snacks, samosas, and chai to pre-order before your bus departs!
              </p>
            </div>
          ) : (
            <>
              {/* Item List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Selected Snacks</span>
                  <button
                    onClick={onClearCart}
                    className="text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1 text-[11px]"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear all
                  </button>
                </div>

                <div className="space-y-2.5">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-slate-200 truncate">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-xs text-amber-400 font-bold">
                          ₹{item.price} each &bull; <span className="text-slate-300">₹{item.price * item.quantity}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="text-slate-400 hover:text-white p-0.5"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-slate-100 min-w-[16px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="text-orange-400 hover:text-orange-300 p-0.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-slate-600 hover:text-rose-400 p-1 transition-colors"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student Details Form */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Pickup & Student Details
                </span>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Student Name / Roll No. *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul Sharma (CS-3B)"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Phone Number (for SMS & verification)
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Special Kitchen Request (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Extra mint chutney, less spicy, separate packing"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Verification Info Box */}
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold text-blue-200 block">Zero Queue Secret PIN Protection:</span>
                  Once you pay, you will receive a 4-digit secret PIN. The canteen counter will only release your food when you provide this PIN!
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Drawer Footer */}
        {cartItems.length > 0 && (
          <div className="p-5 border-t border-slate-800 bg-slate-900/80 space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal ({totalItemsCount} items)</span>
                <span>₹{totalAmount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Queue Express Fee</span>
                <span className="text-emerald-400 font-medium">FREE (Campus Promotion)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Prep Time</span>
                <span className="text-orange-400 font-semibold">~{estimatedPrep} mins</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between text-base font-extrabold text-white">
                <span>Total Amount</span>
                <span className="text-amber-400">₹{totalAmount}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 group"
            >
              <span>Pay &amp; Generate Pickup PIN</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
