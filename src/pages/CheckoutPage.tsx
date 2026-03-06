import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import { Check, Lock } from 'lucide-react';

interface LocationState {
  amount: number;
  originalAmount: number;
  itemCount: number;
  courseTitle?: string;
  onSuccessAction: 'cart' | 'single';
  subjectId?: number;
}

type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet';

const BANKS = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
  'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda', 'Union Bank of India',
];
const WALLETS = ['Paytm', 'PhonePe', 'Amazon Pay', 'Mobikwik'];

function formatCard(val: string) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(val: string) {
  const d = val.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

const inputCls = 'w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#1c1d1f] focus:ring-1 focus:ring-[#1c1d1f] text-[#1c1d1f] bg-white placeholder-gray-400 transition-colors';
const errCls = 'border-red-400 focus:border-red-400 focus:ring-red-400';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  // If navigated without state, go home
  if (!state) {
    navigate('/');
    return null;
  }

  const { amount, originalAmount, itemCount, courseTitle, onSuccessAction, subjectId } = state;

  const [method, setMethod] = useState<PaymentMethod>('card');
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');

  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');
  const [phone, setPhone]   = useState('');

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry]         = useState('');
  const [cvv, setCvv]               = useState('');

  const [upiId, setUpiId]   = useState('');
  const [bank, setBank]     = useState('');
  const [wallet, setWallet] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required';
    if (!phone.match(/^[6-9]\d{9}$/)) e.phone = 'Valid 10-digit mobile number required';
    if (method === 'card') {
      if (cardNumber.replace(/\s/g, '').length !== 16) e.cardNumber = 'Enter valid 16-digit card number';
      if (!expiry.match(/^\d{2}\/\d{2}$/)) e.expiry = 'MM/YY format required';
      if (cvv.length < 3) e.cvv = 'Enter valid CVV';
    } else if (method === 'upi') {
      if (!upiId.match(/^[\w.\-]+@[\w]+$/)) e.upiId = 'Enter valid UPI ID (e.g. name@upi)';
    } else if (method === 'netbanking') {
      if (!bank) e.bank = 'Please select a bank';
    } else if (method === 'wallet') {
      if (!wallet) e.wallet = 'Please select a wallet';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = async () => {
    if (!validate()) return;
    setStep('processing');

    // Simulate payment processing
    await new Promise(r => setTimeout(r, 2000));

    try {
      // Dynamic import to avoid circular deps — we call the store directly
      const { default: useCartStore } = await import('@/store/cartStore');
      const store = useCartStore.getState();

      if (onSuccessAction === 'cart') {
        await store.purchaseAll();
      } else if (onSuccessAction === 'single' && subjectId) {
        await store.purchaseSingle(subjectId);
      }
    } catch {
      // ignore — still show success screen
    }

    setStep('success');
    setTimeout(() => navigate('/profile'), 3000);
  };

  const methods: { id: PaymentMethod; label: string; emoji: string }[] = [
    { id: 'card', label: 'Credit / Debit Card', emoji: '💳' },
    { id: 'upi', label: 'UPI', emoji: '📱' },
    { id: 'netbanking', label: 'Net Banking', emoji: '🏦' },
    { id: 'wallet', label: 'Wallet', emoji: '👛' },
  ];

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-[#f7f9fa] flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center pt-[72px]">
          <div className="w-14 h-14 border-4 border-[#1c1d1f] border-t-transparent rounded-full animate-spin mb-6" />
          <h2 className="text-xl font-bold text-[#1c1d1f] mb-2">Processing Payment…</h2>
          <p className="text-gray-500 text-sm">Please do not close or refresh this page</p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#f7f9fa] flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center pt-[72px] px-6">
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center max-w-md w-full shadow-sm">
            <div className="w-20 h-20 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-[#1c1d1f] font-serif mb-2">Payment Successful!</h1>
            <p className="text-gray-500 mb-1">₹{amount.toLocaleString('en-IN')} paid to Kodemy</p>
            <p className="text-sm text-gray-400 mb-6">
              You are now enrolled in {itemCount} course{itemCount > 1 ? 's' : ''}. Redirecting to My Learning…
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="px-6 py-2.5 bg-[#1c1d1f] text-white font-bold text-sm rounded hover:bg-black transition-colors"
            >
              Go to My Learning
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fa] flex flex-col">
      <Header />
      <main className="flex-grow pt-[72px]">
        {/* Page header */}
        <div className="bg-[#1c1d1f] text-white py-8">
          <div className="max-w-5xl mx-auto px-6">
            <h1 className="text-2xl font-bold font-serif mb-1">Checkout</h1>
            <p className="text-gray-400 text-sm">
              {itemCount} course{itemCount > 1 ? 's' : ''}
              {courseTitle ? ` · ${courseTitle}` : ''}
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">
          <div className="flex flex-col-reverse lg:flex-row gap-6 md:gap-8">

            {/* ── Left Column: Payment Form ── */}
            <div className="flex-1 space-y-4 md:space-y-6">

              {/* Contact Details */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
                <h2 className="text-base font-bold text-[#1c1d1f] mb-4 pb-3 border-b border-gray-100">Contact Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Full Name</label>
                    <input className={`${inputCls} ${errors.name ? errCls : ''}`} placeholder="Enter your full name" value={name} onChange={e => setName(e.target.value)} />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Email Address</label>
                      <input type="email" className={`${inputCls} ${errors.email ? errCls : ''}`} placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Mobile Number</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 text-sm bg-gray-50 border border-r-0 border-gray-300 rounded-l text-gray-500 font-medium">+91</span>
                        <input className={`flex-1 px-3 py-2.5 border border-gray-300 rounded-r text-sm focus:outline-none focus:border-[#1c1d1f] focus:ring-1 focus:ring-[#1c1d1f] text-[#1c1d1f] bg-white placeholder-gray-400 transition-colors ${errors.phone ? errCls : ''}`} placeholder="10-digit mobile number" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} />
                      </div>
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
                <h2 className="text-base font-bold text-[#1c1d1f] mb-4 pb-3 border-b border-gray-100">Payment Method</h2>

                {/* Method tabs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                  {methods.map(m => (
                    <button key={m.id} onClick={() => setMethod(m.id)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded border text-xs font-bold transition-all ${
                        method === m.id
                          ? 'border-[#1c1d1f] bg-[#1c1d1f] text-white'
                          : 'border-gray-200 text-gray-500 hover:border-[#1c1d1f] hover:text-[#1c1d1f]'
                      }`}>
                      <span className="text-xl">{m.emoji}</span>
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Card */}
                {method === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Card Number</label>
                      <input className={`${inputCls} ${errors.cardNumber ? errCls : ''} tracking-widest`} placeholder="0000 0000 0000 0000" value={cardNumber} onChange={e => setCardNumber(formatCard(e.target.value))} maxLength={19} />
                      {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Expiry Date</label>
                        <input className={`${inputCls} ${errors.expiry ? errCls : ''}`} placeholder="MM / YY" value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} maxLength={5} />
                        {errors.expiry && <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">CVV</label>
                        <input type="password" className={`${inputCls} ${errors.cvv ? errCls : ''}`} placeholder="•••" value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} />
                        {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      Your card details are encrypted with 256-bit SSL
                    </p>
                  </div>
                )}

                {/* UPI */}
                {method === 'upi' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">UPI ID</label>
                      <input className={`${inputCls} ${errors.upiId ? errCls : ''}`} placeholder="yourname@upi" value={upiId} onChange={e => setUpiId(e.target.value)} />
                      {errors.upiId && <p className="text-red-500 text-xs mt-1">{errors.upiId}</p>}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">Quick Select</p>
                      <div className="flex flex-wrap gap-2">
                        {['PhonePe', 'GPay', 'Paytm', 'BHIM'].map(app => (
                          <button key={app} onClick={() => setUpiId(`yourname@${app.toLowerCase()}`)}
                            className="px-3 py-1.5 border border-gray-200 rounded text-xs font-medium text-gray-600 hover:border-[#1c1d1f] hover:text-[#1c1d1f] transition-colors">
                            {app}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Net Banking */}
                {method === 'netbanking' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {['SBI', 'HDFC', 'ICICI', 'Axis'].map(b => (
                        <button key={b} onClick={() => setBank(b)}
                          className={`py-3 px-4 border rounded text-sm font-bold transition-all ${bank === b ? 'border-[#1c1d1f] bg-[#1c1d1f] text-white' : 'border-gray-200 text-gray-600 hover:border-[#1c1d1f]'}`}>
                          {b} Bank
                        </button>
                      ))}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">All Banks</label>
                      <select title="Select Bank" className={`${inputCls} ${errors.bank ? errCls : ''}`} value={bank} onChange={e => setBank(e.target.value)}>
                        <option value="">Select your bank</option>
                        {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                      {errors.bank && <p className="text-red-500 text-xs mt-1">{errors.bank}</p>}
                    </div>
                  </div>
                )}

                {/* Wallet */}
                {method === 'wallet' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {WALLETS.map(w => (
                        <button key={w} onClick={() => setWallet(w)}
                          className={`py-3 px-4 border rounded text-sm font-bold transition-all ${wallet === w ? 'border-[#1c1d1f] bg-[#1c1d1f] text-white' : 'border-gray-200 text-gray-600 hover:border-[#1c1d1f]'}`}>
                          {w}
                        </button>
                      ))}
                    </div>
                    {errors.wallet && <p className="text-red-500 text-xs">{errors.wallet}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* ── Right Column: Order Summary ── */}
            <div className="lg:w-[340px] flex-shrink-0">
              <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 lg:sticky lg:top-[90px]">
                <h2 className="text-base font-bold text-[#1c1d1f] mb-4 pb-3 border-b border-gray-100">Order Summary</h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Original Price</span>
                    <span className="text-gray-400 line-through">₹{originalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  {originalAmount > amount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Discount</span>
                      <span className="text-green-600 font-medium">- ₹{(originalAmount - amount).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-3 flex justify-between">
                    <span className="font-bold text-[#1c1d1f]">Total</span>
                    <span className="text-2xl font-bold text-[#1c1d1f]">₹{amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {originalAmount > amount && (
                  <div className="bg-[#f0fdf4] border border-green-200 text-green-700 text-xs font-medium px-3 py-2 rounded mb-4">
                    🎉 You save ₹{(originalAmount - amount).toLocaleString('en-IN')} on this order!
                  </div>
                )}

                <button
                  onClick={handlePay}
                  className="w-full py-3.5 bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold text-base rounded transition-colors mb-3"
                >
                  Pay ₹{amount.toLocaleString('en-IN')}
                </button>

                <button
                  onClick={() => navigate(-1)}
                  className="w-full py-2.5 border border-gray-300 text-[#1c1d1f] font-bold text-sm rounded hover:border-[#1c1d1f] transition-colors"
                >
                  ← Back
                </button>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    256-bit SSL Encryption · 30-day refund guarantee
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <span className="text-xs text-gray-400">Powered by</span>
                    <span className="text-xs font-bold text-[#528FF0]">Razorpay</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
