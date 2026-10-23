import React, { useState, useRef, useEffect } from 'react';
import { X, KeyRound, CheckCircle, AlertTriangle, ShieldCheck, ArrowRight, Delete } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playPinSuccessSound, playPinErrorSound } from '../../utils/sound';

export default function PinVerificationModal({ isOpen, onClose, order, onVerificationSuccess }) {
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    if (isOpen) {
      setPinDigits(['', '', '', '']);
      setErrorMessage('');
      setIsSuccess(false);
      setShake(false);
      setTimeout(() => {
        inputRefs[0]?.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const handleDigitChange = (index, value) => {
    // Only accept numeric single digit
    const cleaned = value.replace(/[^0-9]/g, '');
    const newDigits = [...pinDigits];

    if (cleaned.length > 0) {
      newDigits[index] = cleaned[cleaned.length - 1];
      setPinDigits(newDigits);
      setErrorMessage('');

      // Auto-advance to next input
      if (index < 3) {
        inputRefs[index + 1]?.current?.focus();
      }
    } else {
      newDigits[index] = '';
      setPinDigits(newDigits);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs[index - 1]?.current?.focus();
    }
    if (e.key === 'Enter') {
      const fullPin = pinDigits.join('');
      if (fullPin.length === 4) {
        submitVerification(fullPin);
      }
    }
  };

  const handleKeypadPress = (val) => {
    if (val === 'backspace') {
      const lastFilledIndex = pinDigits.map(d => d !== '').lastIndexOf(true);
      if (lastFilledIndex >= 0) {
        const newDigits = [...pinDigits];
        newDigits[lastFilledIndex] = '';
        setPinDigits(newDigits);
        inputRefs[lastFilledIndex]?.current?.focus();
      }
      return;
    }

    if (val === 'clear') {
      setPinDigits(['', '', '', '']);
      inputRefs[0]?.current?.focus();
      return;
    }

    // Find first empty digit slot
    const firstEmptyIndex = pinDigits.findIndex(d => d === '');
    if (firstEmptyIndex !== -1) {
      const newDigits = [...pinDigits];
      newDigits[firstEmptyIndex] = String(val);
      setPinDigits(newDigits);
      setErrorMessage('');

      if (firstEmptyIndex < 3) {
        inputRefs[firstEmptyIndex + 1]?.current?.focus();
      }
    }
  };

  const submitVerification = async (pinString) => {
    const enteredPin = pinString || pinDigits.join('');
    if (enteredPin.length !== 4) {
      setErrorMessage('Please enter all 4 digits of the PIN.');
      playPinErrorSound();
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/orders/${order.order_number}/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enteredPin })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsSuccess(true);
        playPinSuccessSound();
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {}

        setTimeout(() => {
          onVerificationSuccess(data.order);
          onClose();
        }, 1500);
      } else {
        playPinErrorSound();
        setErrorMessage(data.message || 'Incorrect PIN! Verification failed.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        // Clear input for retry
        setPinDigits(['', '', '', '']);
        inputRefs[0]?.current?.focus();
      }
    } catch (err) {
      playPinErrorSound();
      setErrorMessage('Network error verifying PIN. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`w-full max-w-md bg-[#101728] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden transition-transform ${
        shake ? 'animate-bounce text-rose-500' : 'animate-in zoom-in-95 duration-200'
      }`}>
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-100">Counter Pickup Verification</h3>
              <p className="text-xs text-slate-400">Order #{order.order_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Customer & Items Brief */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Customer Name</span>
              <span className="text-base font-bold text-white">{order.customer_name}</span>
              <p className="text-xs text-slate-400 mt-0.5">
                {order.items?.length || 0} items &bull; Total: ₹{order.total_amount}
              </p>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                Paid Advance
              </span>
            </div>
          </div>

          {/* Verification Prompt */}
          <div className="text-center space-y-1">
            <label className="text-sm font-bold text-slate-200 block">
              Ask student for their 4-digit secret PIN:
            </label>
            <p className="text-xs text-slate-400">
              Student must recite the PIN shown on their phone screen.
            </p>
          </div>

          {/* 4-Digit PIN Boxes */}
          <div className="flex justify-center gap-3">
            {pinDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                disabled={isVerifying || isSuccess}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`w-14 h-16 rounded-2xl bg-slate-950 border-2 text-center text-3xl font-black text-white focus:outline-none transition-all shadow-inner ${
                  isSuccess
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : errorMessage
                    ? 'border-rose-500 focus:border-rose-400'
                    : 'border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                }`}
              />
            ))}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Flash */}
          {isSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-bold flex items-center justify-center gap-2 animate-in zoom-in-95">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span>PIN Verified! Hand over food to student.</span>
            </div>
          )}

          {/* Touchscreen / POS Keypad */}
          <div className="pt-2">
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={isVerifying || isSuccess}
                  onClick={() => handleKeypadPress(num)}
                  className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-100 font-bold text-lg border border-slate-800 transition-all shadow-sm"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                disabled={isVerifying || isSuccess}
                onClick={() => handleKeypadPress('clear')}
                className="py-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-800 transition-all"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={isVerifying || isSuccess}
                onClick={() => handleKeypadPress(0)}
                className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-100 font-bold text-lg border border-slate-800 transition-all shadow-sm"
              >
                0
              </button>
              <button
                type="button"
                disabled={isVerifying || isSuccess}
                onClick={() => handleKeypadPress('backspace')}
                className="py-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-800 transition-all"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <button
            onClick={() => submitVerification(pinDigits.join(''))}
            disabled={isVerifying || isSuccess || pinDigits.join('').length !== 4}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <span>Checking PIN hash...</span>
            ) : isSuccess ? (
              <span>Verified &amp; Handed Over!</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify PIN &amp; Release Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
