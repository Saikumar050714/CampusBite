import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, Clock, ChefHat, Bell, Sparkles, Copy, 
  Check, ShieldAlert, ArrowLeft, RefreshCw, QrCode 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playOrderReadySound, playPinSuccessSound } from '../../utils/sound';

export default function OrderConfirmation({ order, onResetOrder, onRefreshOrder }) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  // Trigger celebration effects upon completion or ready status
  useEffect(() => {
    if (order?.status === 'READY_FOR_PICKUP') {
      playOrderReadySound();
    }
    if (order?.status === 'COMPLETED' && !hasCelebrated) {
      setHasCelebrated(true);
      playPinSuccessSound();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  }, [order?.status, hasCelebrated]);

  if (!order) return null;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  // Determine stage progression
  const stages = [
    { key: 'PENDING', label: 'Order Received', icon: Clock, desc: 'Payment verified & sent to canteen' },
    { key: 'PREPARING', label: 'In the Kitchen', icon: ChefHat, desc: 'Chef is frying & assembling your order' },
    { key: 'READY_FOR_PICKUP', label: 'Ready at Counter', icon: Bell, desc: 'Hot & ready! Walk up to Counter #1' },
    { key: 'COMPLETED', label: 'Picked Up', icon: CheckCircle2, desc: 'PIN verified & handed over' }
  ];

  const getStageIndex = (status) => {
    switch (status) {
      case 'PENDING': return 0;
      case 'PREPARING': return 1;
      case 'READY_FOR_PICKUP': return 2;
      case 'COMPLETED': return 3;
      default: return 0;
    }
  };

  const currentStageIndex = getStageIndex(order.status);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Status */}
      <div className="flex items-center justify-between">
        <button
          onClick={onResetOrder}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu (Order more)</span>
        </button>

        <button
          onClick={onRefreshOrder}
          className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Status</span>
        </button>
      </div>

      {/* Main Verification Card (The Hero Component) */}
      <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden transition-all duration-500 ${
        order.status === 'READY_FOR_PICKUP'
          ? 'bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/60 shadow-2xl shadow-emerald-500/20'
          : order.status === 'COMPLETED'
          ? 'bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-slate-700'
          : 'bg-gradient-to-b from-orange-950/30 via-slate-900 to-slate-950 border-orange-500/40 shadow-2xl shadow-orange-500/10'
      }`}>
        {/* Glow ambient background circles */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Order ID & Instructions */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Order Tracker</span>
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-1">
                Your Unique Order ID
              </span>
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  #{order.order_number}
                </span>
                <button
                  onClick={() => copyToClipboard(order.order_number, 'id')}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Copy Order ID"
                >
                  {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-sm">
              Show this Order ID at Counter #1. When asked, recite your secret 4-digit PIN below to claim your items.
            </p>
          </div>

          {/* Right: Secret 4-digit PIN Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border-2 border-amber-500/60 shadow-xl shadow-amber-500/10 flex flex-col items-center text-center">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Secret Verification PIN</span>
            </div>

            {/* Glowing 4-Digit Box */}
            <div className="flex items-center gap-2 my-2">
              {order.pin_display ? (
                order.pin_display.split('').map((digit, idx) => (
                  <div
                    key={idx}
                    className="w-11 h-13 sm:w-13 sm:h-16 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-amber-500/50 flex items-center justify-center text-2xl sm:text-3xl font-black text-amber-300 shadow-inner"
                  >
                    {digit}
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-400 font-mono">****</div>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(order.pin_display, 'pin')}
                className="text-[11px] font-semibold text-slate-400 hover:text-amber-300 transition-colors flex items-center gap-1"
              >
                {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPin ? 'PIN Copied!' : 'Copy 4-Digit PIN'}</span>
              </button>
            </div>

            <span className="text-[10px] text-slate-500 mt-2 max-w-[190px]">
              🔒 Only state this PIN verbally to the canteen staff at pickup
            </span>
          </div>
        </div>

        {/* Live Status Alert Box */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          {order.status === 'PENDING' && (
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                  ⏳
                </div>
                <div>
                  <h4 className="font-bold text-sm text-orange-300">Order Placed &amp; Paid</h4>
                  <p className="text-xs text-slate-400">Waiting for canteen chef to accept into preparation queue...</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-orange-400 px-3 py-1 rounded-lg bg-orange-500/10">
                Queue Pos: Active
              </span>
            </div>
          )}

          {order.status === 'PREPARING' && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold animate-spin">
                  🍳
                </div>
                <div>
                  <h4 className="font-bold text-sm text-amber-300">Cooking in Progress!</h4>
                  <p className="text-xs text-slate-400">Chef is preparing your snacks now. Est. wait: ~{order.estimated_prep_minutes || 6} mins</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-amber-400 px-3 py-1 rounded-lg bg-amber-500/10">
                In Kitchen
              </span>
            </div>
          )}

          {order.status === 'READY_FOR_PICKUP' && (
            <div className="p-5 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/60 flex items-center justify-between gap-4 animate-bounce">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-500/30">
                  🔔
                </div>
                <div>
                  <h4 className="font-black text-base text-emerald-300">FOOD READY AT COUNTER #1!</h4>
                  <p className="text-xs text-slate-200">
                    Walk straight to the pickup counter now. Say PIN <strong>{order.pin_display}</strong> to take your meal and grab your item!
                  </p>
                </div>
              </div>
            </div>
          )}

          {order.status === 'COMPLETED' && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  🎉
                </div>
                <div>
                  <h4 className="font-bold text-sm text-emerald-300">Order Completed &amp; Collected</h4>
                  <p className="text-xs text-slate-400">PIN verified successfully by canteen staff. Enjoy your snacks!</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400 px-3 py-1 rounded-lg bg-emerald-500/10">
                Verified
              </span>
            </div>
          )}
        </div>

        {/* Multi-step Progress Bar */}
        <div className="mt-8">
          <div className="grid grid-cols-4 gap-2 sm:gap-4 relative">
            {stages.map((stg, index) => {
              const isPast = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;
              const Icon = stg.icon;

              return (
                <div key={stg.key} className="flex flex-col items-center text-center">
                  <div
                    className={`h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center mb-2 transition-all ${
                      isCurrent
                        ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 ring-4 ring-orange-500/20 scale-110'
                        : isPast
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800/80 text-slate-500 border border-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      isCurrent
                        ? 'text-orange-400'
                        : isPast
                        ? 'text-slate-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {stg.label}
                  </span>
                  <span className="text-[10px] text-slate-500 hidden sm:block mt-0.5 max-w-[130px]">
                    {stg.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Order Itemized Summary Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
          Order Summary &amp; Bill
        </h3>

        <div className="divide-y divide-slate-800/80">
          {order.items && order.items.map((it) => (
            <div key={it.id || it.menu_item_id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-orange-400">{it.quantity}x</span>
                <span className="text-slate-200 font-medium">{it.item_name}</span>
              </div>
              <span className="font-semibold text-slate-300">₹{it.subtotal || it.unit_price * it.quantity}</span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-sm">
          <div className="text-xs text-slate-400">
            Payment: <span className="text-slate-200 font-medium">{order.payment_method}</span> ({order.payment_ref})
          </div>
          <div className="text-base font-extrabold text-amber-400">
            Total Paid: ₹{order.total_amount}
          </div>
        </div>

        {order.notes && (
          <div className="p-3 rounded-xl bg-slate-950 text-xs text-slate-400 border border-slate-800">
            <strong className="text-slate-300">Kitchen Note:</strong> {order.notes}
          </div>
        )}
      </div>
    </div>
  );
}
