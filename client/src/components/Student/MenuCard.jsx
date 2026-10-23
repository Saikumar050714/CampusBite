import React from 'react';
import { Plus, Minus, Clock, Flame, Check } from 'lucide-react';

export default function MenuCard({ item, cartItem, onAddToCart, onUpdateQuantity }) {
  const isAvailable = item.is_available === 1;
  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <div
      className={`group relative rounded-2xl overflow-hidden flex flex-col transition-all duration-300 ${
        isAvailable
          ? 'bg-slate-900/60 border border-slate-800 hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/10'
          : 'bg-slate-950/40 border border-slate-900 opacity-60'
      }`}
    >
      {/* Food Image Banner */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-800">
        <img
          src={item.image_url}
          alt={item.name}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            !isAvailable ? 'grayscale' : ''
          }`}
          loading="lazy"
          onError={(e) => {
            // Fallback image if unsplash link fails
            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {/* Veg Badge */}
            <div className="h-5 w-5 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700 flex items-center justify-center p-0.5" title="100% Vegetarian">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>

            {item.badge && (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 shadow-md">
                <Flame className="w-3 h-3 fill-slate-950" />
                {item.badge}
              </span>
            )}
          </div>

          {/* Prep Time Badge */}
          <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-300 border border-slate-700/60 backdrop-blur-md">
            <Clock className="w-3 h-3 text-orange-400" />
            ~{item.prep_time_minutes}m
          </span>
        </div>

        {/* Sold out overlay */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center backdrop-blur-[2px]">
            <span className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs uppercase tracking-wider">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Item Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-base text-slate-100 group-hover:text-orange-400 transition-colors">
              {item.name}
            </h3>
            <span className="font-black text-lg text-amber-400 whitespace-nowrap">
              ₹{item.price}
            </span>
          </div>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
            {item.description}
          </p>
        </div>

        {/* Action Button */}
        <div>
          {!isAvailable ? (
            <button
              disabled
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800/50 text-slate-500 text-xs font-semibold cursor-not-allowed border border-slate-800"
            >
              Unavailable for Rush Hour
            </button>
          ) : quantity > 0 ? (
            <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/30 rounded-xl p-1">
              <button
                onClick={() => onUpdateQuantity(item.id, quantity - 1)}
                className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors active:scale-95"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-sm text-orange-400 px-3">
                {quantity} in Tray
              </span>
              <button
                onClick={() => onUpdateQuantity(item.id, quantity + 1)}
                className="h-8 w-8 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors active:scale-95 shadow-md shadow-orange-500/30"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart(item)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add to Tray</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
