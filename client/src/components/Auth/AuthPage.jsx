import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight, Sparkles, CheckCircle2, AlertCircle, ShieldCheck, Phone, BadgeCheck } from 'lucide-react';

export default function AuthPage({ onLoginSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!username.trim()) {
      setError('Please enter a username.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter a password.');
      return;
    }

    // Direct check for admin/77777 to provide instant feedback or call backend
    if (username.trim().toLowerCase() === 'admin' && password.trim() === '77777') {
      const staffUser = {
        id: 1,
        username: 'admin',
        full_name: 'Canteen Staff Admin',
        phone: '',
        role: 'staff'
      };
      localStorage.setItem('campusbite_user', JSON.stringify(staffUser));
      onLoginSuccess(staffUser);
      return;
    }

    if (isRegisterMode) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 3) {
        setError('Password must be at least 3 characters.');
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegisterMode
        ? {
            username: username.trim(),
            password: password.trim(),
            fullName: fullName.trim() || username.trim(),
            phone: phone.trim()
          }
        : {
            username: username.trim(),
            password: password.trim()
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (!isRegisterMode && data.notFound) {
          setError(data.message || 'Account not found. Please click Register to create your individual account.');
        } else {
          setError(data.message || 'Authentication failed. Please check your details.');
        }
        setLoading(false);
        return;
      }

      // Success - Save unique user profile to localStorage
      localStorage.setItem('campusbite_user', JSON.stringify(data.user));
      setSuccessMsg(isRegisterMode ? 'Individual profile registered! Redirecting to ordering...' : 'Signed in! Redirecting to your personal account...');
      
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 400);
    } catch (err) {
      console.error('Auth error:', err);
      setError('Network connection failed. Please ensure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden">
      {/* Background Glow Accents */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-xl shadow-orange-500/30 text-white font-extrabold text-2xl mb-3 animate-in zoom-in-50 duration-300">
            ⚡
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            CampusBite
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            Express Food Pre-order &bull; Zero-Queue Pickup
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#0f1523]/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Mode Switcher Tabs */}
          <div className="flex p-1 rounded-2xl bg-slate-900/90 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !isRegisterMode
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isRegisterMode
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Username Input */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a unique username"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            {/* Register-only individual profile fields */}
            {isRegisterMode && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <BadgeCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Rivera or Rahul Sharma"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password Input */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-500 hover:text-slate-300 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Register mode) */}
            {isRegisterMode && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 group disabled:opacity-60 cursor-pointer"
            >
              <span>{loading ? 'Please wait...' : isRegisterMode ? 'Create My Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          {/* Toggle helper */}
          <div className="mt-5 pt-4 border-t border-slate-800 text-center">
            {isRegisterMode ? (
              <p className="text-xs text-slate-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(false);
                    setError('');
                  }}
                  className="font-bold text-orange-400 hover:text-orange-300 underline underline-offset-4 cursor-pointer"
                >
                  Sign in to your account
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                New student or member?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setError('');
                  }}
                  className="font-bold text-orange-400 hover:text-orange-300 underline underline-offset-4 cursor-pointer"
                >
                  Register individual account
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Feature Highlights Footer */}
        <div className="mt-6 flex items-center justify-center gap-6 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Individual Profile
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Separate Order History
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Secret PIN Handover
          </span>
        </div>
      </div>
    </div>
  );
}
