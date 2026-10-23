import React from 'react';
import { ShoppingBag, ShieldCheck, Clock, Radio, User, Wallet, LogOut, UtensilsCrossed } from 'lucide-react';

export default function Navbar({ 
  currentUser, 
  onLogout, 
  onOpenAccount, 
  cartCount, 
  onOpenCart, 
  isConnected, 
  pendingOrdersCount, 
  activeOrder 
}) {
  const isStaff = currentUser?.role === 'staff';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0e1424]/90 backdrop-blur-md">
      {/* Top Rush Hour Announcement Banner */}
      <div className="bg-gradient-to-r from-amber-600/30 via-orange-600/30 to-rose-600/30 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Evening Rush Active: Pre-order now and grab your item without waiting in line!</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1 text-[11px]">
              <Radio className={`w-3 h-3 ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`} />
              {isConnected ? 'Real-time Sync Active' : 'Connecting...'}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-[11px] text-slate-300">Counter Pickup Verification: 4-Digit PIN</span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-bold text-xl">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                CampusBite
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Express
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Express Food Pre-order & Zero-Queue Pickup
            </p>
          </div>
        </div>

        {/* Center / Role Indicator */}
        <div className="hidden md:flex items-center gap-2">
          {isStaff ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold">
              <UtensilsCrossed className="w-4 h-4 text-blue-400" />
              <span>Staff Kitchen Dashboard</span>
              {pendingOrdersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">
                  {pendingOrdersCount} new
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
              <span className="text-emerald-400 font-bold">&bull;</span>
              <span>Pickup Counter #1 Express Lane</span>
            </div>
          )}
        </div>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Account / History Button (for user role) */}
          {!isStaff && currentUser && (
            <button
              onClick={onOpenAccount}
              className="flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-all text-xs font-semibold group"
              title="View Account & Payment History"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400 transition-transform group-hover:scale-110" />
              <span className="hidden sm:inline">My Account</span>
              <span className="sm:hidden">Account</span>
            </button>
          )}

          {/* Cart Tray Button (for user role) */}
          {!isStaff && (
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 transition-all font-semibold text-xs group"
            >
              <ShoppingBag className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span className="hidden sm:inline">Your Tray</span>
              {cartCount > 0 ? (
                <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-orange-500 text-white font-bold text-[11px] flex items-center justify-center animate-bounce">
                  {cartCount}
                </span>
              ) : (
                <span className="text-xs text-slate-500">0</span>
              )}
            </button>
          )}

          {/* User Profile Pill & Logout */}
          {currentUser && (
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-800">
              <div 
                onClick={!isStaff ? onOpenAccount : undefined}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition-colors ${!isStaff ? 'cursor-pointer hover:border-slate-700 hover:bg-slate-800/80' : ''}`}
                title={!isStaff ? "Click to view your personal profile & orders" : undefined}
              >
                <div className={`h-7 w-7 rounded-lg ${isStaff ? 'bg-blue-600' : 'bg-gradient-to-br from-orange-500 to-amber-600'} text-white font-black text-xs flex items-center justify-center uppercase shadow-sm`}>
                  {(currentUser.full_name || currentUser.username)?.[0] || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-white capitalize leading-none truncate max-w-[120px]">
                    {currentUser.full_name || currentUser.username}
                  </div>
                  <span className={`text-[10px] ${isStaff ? 'text-blue-400' : 'text-emerald-400'} font-semibold uppercase leading-none mt-0.5 block`}>
                    {isStaff ? 'Staff' : `@${currentUser.username}`}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
