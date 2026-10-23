import React, { useState } from 'react';
import { 
  X, CheckCircle, Shield, QrCode, Smartphone, CreditCard, 
  Loader2, ArrowRight, ExternalLink, Check, Sparkles 
} from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, orderDetails, onConfirmPayment }) {
  const [paymentMode, setPaymentMode] = useState('UPI'); // 'UPI' | 'CAMPUS_WALLET'
  const [upiTab, setUpiTab] = useState('apps'); // 'apps' | 'id' | 'qr'
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [customUpiId, setCustomUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen || !orderDetails) return null;

  const upiApps = [
    {
      id: 'gpay',
      name: 'Google Pay',
      short: 'GPay',
      color: 'from-blue-500/20 to-emerald-500/20 border-emerald-500/50 text-emerald-300',
      tag: 'Popular',
      icon: '🟢'
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      short: 'PhonePe',
      color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/50 text-purple-300',
      tag: 'Fastest',
      icon: '🟣'
    },
    {
      id: 'paytm',
      name: 'Paytm UPI',
      short: 'Paytm',
      color: 'from-sky-500/20 to-blue-500/20 border-sky-500/50 text-sky-300',
      tag: 'Instant',
      icon: '🔵'
    },
    {
      id: 'bhim',
      name: 'BHIM UPI',
      short: 'BHIM',
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/50 text-amber-300',
      tag: 'Govt NPCI',
      icon: '🇮🇳'
    },
    {
      id: 'cred',
      name: 'CRED UPI',
      short: 'CRED',
      color: 'from-slate-700/40 to-slate-800/40 border-slate-600 text-slate-200',
      tag: 'Cashback',
      icon: '⚡'
    },
    {
      id: 'any_installed',
      name: 'Any Installed UPI App',
      short: 'Direct App Chooser',
      color: 'from-orange-500/20 to-amber-500/20 border-orange-500/50 text-orange-300',
      tag: 'System Intent',
      icon: '📲'
    }
  ];

  const handlePayWithUpi = (chosenAppId) => {
    const appToUse = chosenAppId || selectedUpiApp;
    const appObj = upiApps.find((a) => a.id === appToUse) || upiApps[0];

    setIsProcessing(true);
    setStatusMessage(`Redirecting to ${appObj.name}...`);

    // Standard UPI Intent URI for redirecting on mobile or supported desktop browsers
    const upiUri = `upi://pay?pa=campusbite.canteen@upi&pn=CampusBite%20Canteen&mc=5499&tid=TXN${Date.now()}&tr=CB${Date.now()}&tn=Canteen%20Food%20Preorder&am=${orderDetails.totalAmount}&cu=INR`;

    try {
      // Trigger redirect to UPI app if supported on client system/mobile
      window.location.href = upiUri;
    } catch (e) {
      console.log('UPI intent launch attempted:', upiUri);
    }

    setTimeout(() => {
      setStatusMessage(`Authorizing ₹${orderDetails.totalAmount} via ${appObj.name}...`);
    }, 700);

    setTimeout(() => {
      setStatusMessage('Payment verified successfully! Generating secret PIN...');
    }, 1400);

    setTimeout(() => {
      setIsProcessing(false);
      onConfirmPayment({
        paymentMethod: `UPI (${appObj.name})`,
        paymentRef: `UPI-${Math.floor(100000 + Math.random() * 900000)}`
      });
    }, 1900);
  };

  const handlePayWithUpiId = () => {
    if (!customUpiId.trim() || !customUpiId.includes('@')) {
      alert('Please enter a valid UPI ID (e.g. yourname@okaxis)');
      return;
    }

    setIsProcessing(true);
    setStatusMessage(`Sending UPI payment request to ${customUpiId.trim()}...`);

    setTimeout(() => {
      setStatusMessage(`Approval request received! Authorizing ₹${orderDetails.totalAmount}...`);
    }, 800);

    setTimeout(() => {
      setStatusMessage('UPI Payment verified! Generating secret PIN...');
    }, 1500);

    setTimeout(() => {
      setIsProcessing(false);
      onConfirmPayment({
        paymentMethod: `UPI ID (${customUpiId.trim()})`,
        paymentRef: `UPI-REQ-${Math.floor(100000 + Math.random() * 900000)}`
      });
    }, 2000);
  };

  const handlePayWithWallet = () => {
    setIsProcessing(true);
    setStatusMessage('Deducting from Campus SmartCard balance...');

    setTimeout(() => {
      setStatusMessage('SmartCard RFID verified! Generating secret PIN...');
    }, 900);

    setTimeout(() => {
      setIsProcessing(false);
      onConfirmPayment({
        paymentMethod: 'Campus SmartCard',
        paymentRef: `RFID-${Math.floor(100000 + Math.random() * 900000)}`
      });
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-lg bg-[#0f1523] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/40">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-orange-500/20">
              ⚡
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Express Food Checkout</h3>
              <p className="text-xs text-slate-400">Select your preferred UPI app to pay</p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Payable Amount Summary Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/15 via-amber-500/15 to-orange-500/15 border border-orange-500/40 flex items-center justify-between shadow-inner">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
                Total Payable Amount
              </span>
              <div className="text-3xl font-black text-amber-400 tracking-tight">
                ₹{orderDetails.totalAmount}.00
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full inline-block">
                Zero Counter Wait
              </span>
              <p className="text-xs text-slate-300 mt-1 font-medium capitalize">
                {orderDetails.customerName}
              </p>
            </div>
          </div>

          {/* Mode Switcher: UPI vs SmartCard */}
          <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => setPaymentMode('UPI')}
              disabled={isProcessing}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                paymentMode === 'UPI'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Pay with UPI</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMode('CAMPUS_WALLET')}
              disabled={isProcessing}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                paymentMode === 'CAMPUS_WALLET'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Campus SmartCard</span>
            </button>
          </div>

          {/* UPI Flow (Requirement 5) */}
          {paymentMode === 'UPI' && (
            <div className="space-y-4">
              {/* UPI Sub-Tabs */}
              <div className="flex border-b border-slate-800 pb-2 gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setUpiTab('apps')}
                  className={`pb-1 transition-all ${
                    upiTab === 'apps'
                      ? 'text-orange-400 border-b-2 border-orange-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Select UPI App
                </button>
                <button
                  type="button"
                  onClick={() => setUpiTab('id')}
                  className={`pb-1 transition-all ${
                    upiTab === 'id'
                      ? 'text-orange-400 border-b-2 border-orange-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Enter UPI ID
                </button>
                <button
                  type="button"
                  onClick={() => setUpiTab('qr')}
                  className={`pb-1 transition-all ${
                    upiTab === 'qr'
                      ? 'text-orange-400 border-b-2 border-orange-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Scan QR Code
                </button>
              </div>

              {/* Sub-Tab 1: Select UPI App */}
              {upiTab === 'apps' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Click any UPI app to redirect &amp; pay:</span>
                    <span className="text-emerald-400 text-[11px] font-medium">Auto-Redirect Active</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {upiApps.map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        disabled={isProcessing}
                        onClick={() => {
                          setSelectedUpiApp(app.id);
                          handlePayWithUpi(app.id);
                        }}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all group cursor-pointer ${
                          selectedUpiApp === app.id
                            ? 'bg-slate-800 border-orange-500 ring-2 ring-orange-500/20 shadow-lg'
                            : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <span className="text-xl">{app.icon}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 group-hover:border-slate-700">
                            {app.tag}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-white group-hover:text-orange-300 transition-colors">
                            {app.name}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5 flex items-center gap-1">
                            <span>Pay ₹{orderDetails.totalAmount}</span>
                            <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: Enter UPI ID */}
              {upiTab === 'id' && (
                <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Enter your Virtual Payment Address (UPI ID)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. 9876543210@paytm or student@okaxis"
                      value={customUpiId}
                      onChange={(e) => setCustomUpiId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Quick Suffix pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['@okaxis', '@okhdfcbank', '@ybl', '@paytm', '@ibl'].map((suffix) => (
                      <button
                        key={suffix}
                        type="button"
                        onClick={() => {
                          const base = customUpiId.split('@')[0] || 'student';
                          setCustomUpiId(base + suffix);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-400 hover:text-white transition-colors"
                      >
                        {suffix}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handlePayWithUpiId}
                    disabled={isProcessing}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Request ₹{orderDetails.totalAmount} from UPI App</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Sub-Tab 3: Scan QR Code */}
              {upiTab === 'qr' && (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                  <div className="inline-block p-3 rounded-2xl bg-white shadow-xl">
                    {/* Dynamic Simulated UPI QR Code */}
                    <div className="w-36 h-36 border-4 border-slate-950 flex flex-col justify-between p-2 relative bg-white">
                      <div className="flex justify-between">
                        <div className="w-8 h-8 bg-slate-950 border-2 border-white" />
                        <div className="w-8 h-8 bg-slate-950 border-2 border-white" />
                      </div>
                      <div className="flex items-center justify-center font-black text-slate-950 text-xs tracking-tight">
                        ₹{orderDetails.totalAmount}
                      </div>
                      <div className="flex justify-between">
                        <div className="w-8 h-8 bg-slate-950 border-2 border-white" />
                        <div className="h-4 w-4 bg-orange-600 rounded-full mx-auto" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white">Scan with any UPI App</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Google Pay, PhonePe, Paytm, or BHIM
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePayWithUpi('gpay')}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>I have scanned &amp; paid ₹{orderDetails.totalAmount}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Campus SmartCard Flow */}
          {paymentMode === 'CAMPUS_WALLET' && (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Cardholder Name:</span>
                  <div className="text-sm font-bold text-white">{orderDetails.customerName}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Available RFID Balance:</span>
                  <div className="text-sm font-bold text-emerald-400">₹420.00</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePayWithWallet}
                disabled={isProcessing}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>Tap SmartCard &bull; Pay ₹{orderDetails.totalAmount}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Security Guarantee */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>256-Bit Encrypted Campus UPI Gateway Simulation</span>
          </div>

          {/* Processing Status Banner */}
          {isProcessing && (
            <div className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 border border-orange-500/40 flex items-center justify-center gap-3 text-xs sm:text-sm text-slate-100 font-bold animate-pulse">
              <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
