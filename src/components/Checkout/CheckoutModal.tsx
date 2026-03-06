import { useState } from 'react';

interface Props {
  amount: number;
  originalAmount: number;
  itemCount: number;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet';

const banks = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda', 'Union Bank of India'];
const wallets = ['Paytm', 'PhonePe', 'Amazon Pay', 'Mobikwik'];

function formatCard(val: string) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(val: string) {
  const d = val.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export default function CheckoutModal({ amount, originalAmount, itemCount, onClose, onSuccess }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');

  // Contact
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Card
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // UPI
  const [upiId, setUpiId] = useState('');

  // Net Banking
  const [bank, setBank] = useState('');

  // Wallet
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
    await new Promise(r => setTimeout(r, 2000));
    try {
      await onSuccess();
    } catch {}
    setStep('success');
  };

  const methods: { id: PaymentMethod; label: string; icon: string }[] = [
    { id: 'card', label: 'Card', icon: '💳' },
    { id: 'upi', label: 'UPI', icon: '📱' },
    { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
    { id: 'wallet', label: 'Wallet', icon: '👛' },
  ];

  const inputBase = 'w-full px-3 py-2.5 text-sm border rounded-md outline-none transition-all focus:ring-2 focus:ring-[#528FF0] focus:border-[#528FF0] bg-white text-gray-800 placeholder-gray-400';
  const errStyle = 'border-red-400';
  const okStyle = 'border-gray-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative flex flex-col bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-hidden" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

        {/* ── Header ── */}
        <div className="bg-[#1a1f36] px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#528FF0] rounded-lg flex items-center justify-center text-white font-bold text-sm">K</div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Kodemy</p>
              <p className="text-gray-400 text-xs">{itemCount} course{itemCount > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white font-bold text-lg">₹{amount.toLocaleString('en-IN')}</p>
            {originalAmount > amount && (
              <p className="text-gray-400 text-xs line-through">₹{originalAmount.toLocaleString('en-IN')}</p>
            )}
          </div>
          <button onClick={onClose} className="ml-4 text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Processing overlay ── */}
        {step === 'processing' && (
          <div className="absolute inset-0 z-10 bg-white flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 border-4 border-[#528FF0] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-700 font-semibold text-base">Processing payment…</p>
            <p className="text-gray-400 text-sm">Please do not close this window</p>
          </div>
        )}

        {/* ── Success overlay ── */}
        {step === 'success' && (
          <div className="absolute inset-0 z-10 bg-white flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
              <svg className="w-11 h-11 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Payment Successful!</h2>
            <p className="text-gray-500 text-sm">₹{amount.toLocaleString('en-IN')} paid to Kodemy</p>
            <p className="text-gray-400 text-xs">You are now enrolled in your course{itemCount > 1 ? 's' : ''}. Redirecting…</p>
          </div>
        )}

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Contact info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Details</h3>
            <div>
              <input className={`${inputBase} ${errors.name ? errStyle : okStyle}`} placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input className={`${inputBase} ${errors.email ? errStyle : okStyle}`} placeholder="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm bg-gray-50 border border-r-0 border-gray-300 rounded-l-md text-gray-500">+91</span>
                  <input className={`flex-1 px-3 py-2.5 text-sm border rounded-r-md outline-none focus:ring-2 focus:ring-[#528FF0] focus:border-[#528FF0] bg-white text-gray-800 placeholder-gray-400 ${errors.phone ? errStyle : okStyle}`} placeholder="Mobile number" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-gray-200" />

          {/* Payment method tabs */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Payment Method</h3>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {methods.map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                    method === m.id
                      ? 'border-[#528FF0] bg-[#528FF0]/5 text-[#528FF0]'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                  <span className="text-lg">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Card fields */}
            {method === 'card' && (
              <div className="space-y-3">
                <div>
                  <div className={`${inputBase} ${errors.cardNumber ? errStyle : okStyle} flex items-center gap-2`}>
                    <span className="text-gray-400 text-base">💳</span>
                    <input className="flex-1 outline-none text-sm bg-transparent placeholder-gray-400" placeholder="Card Number" value={cardNumber} onChange={e => setCardNumber(formatCard(e.target.value))} maxLength={19} />
                  </div>
                  {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input className={`${inputBase} ${errors.expiry ? errStyle : okStyle}`} placeholder="MM / YY" value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} maxLength={5} />
                    {errors.expiry && <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>}
                  </div>
                  <div>
                    <div className="relative">
                      <input className={`${inputBase} ${errors.cvv ? errStyle : okStyle} pr-9`} placeholder="CVV" type="password" value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔒</span>
                    </div>
                    {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* UPI fields */}
            {method === 'upi' && (
              <div>
                <div className={`${inputBase} ${errors.upiId ? errStyle : okStyle} flex items-center gap-2`}>
                  <span className="text-gray-400 text-sm">📱</span>
                  <input className="flex-1 outline-none text-sm bg-transparent placeholder-gray-400" placeholder="Enter UPI ID (e.g. name@upi)" value={upiId} onChange={e => setUpiId(e.target.value)} />
                </div>
                {errors.upiId && <p className="text-red-500 text-xs mt-1">{errors.upiId}</p>}
                <div className="mt-3 flex gap-2 flex-wrap">
                  {['PhonePe', 'GPay', 'Paytm', 'BHIM'].map(app => (
                    <button key={app} onClick={() => setUpiId(`yourname@${app.toLowerCase()}`)}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-full text-gray-600 hover:border-[#528FF0] hover:text-[#528FF0] transition-colors">
                      {app}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Net Banking fields */}
            {method === 'netbanking' && (
              <div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {['SBI', 'HDFC', 'ICICI', 'Axis'].map(b => (
                    <button key={b} onClick={() => setBank(b)}
                      className={`py-2.5 px-3 text-sm border rounded-lg font-medium transition-all ${bank === b ? 'border-[#528FF0] bg-[#528FF0]/5 text-[#528FF0]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {b} Bank
                    </button>
                  ))}
                </div>
                <select className={`${inputBase} ${errors.bank ? errStyle : okStyle}`} value={bank} onChange={e => setBank(e.target.value)}>
                  <option value="">All Banks →</option>
                  {banks.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                {errors.bank && <p className="text-red-500 text-xs mt-1">{errors.bank}</p>}
              </div>
            )}

            {/* Wallet fields */}
            {method === 'wallet' && (
              <div className="grid grid-cols-2 gap-2">
                {wallets.map(w => (
                  <button key={w} onClick={() => setWallet(w)}
                    className={`py-3 px-4 border rounded-lg text-sm font-medium transition-all ${wallet === w ? 'border-[#528FF0] bg-[#528FF0]/5 text-[#528FF0]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {w === 'Paytm' ? '💙' : w === 'PhonePe' ? '💜' : w === 'Amazon Pay' ? '🟠' : '🔵'} {w}
                  </button>
                ))}
                {errors.wallet && <p className="text-red-500 text-xs mt-1 col-span-2">{errors.wallet}</p>}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer / Pay Button ── */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button
            onClick={handlePay}
            disabled={step !== 'form'}
            className="w-full py-3 bg-[#528FF0] hover:bg-[#3a76e0] active:bg-[#2a5fc0] text-white font-bold text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {step === 'processing' ? 'Processing…' : `Pay ₹${amount.toLocaleString('en-IN')}`}
          </button>
          <div className="flex items-center justify-center gap-2 mt-3">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-xs text-gray-400">Secured by <span className="font-semibold text-[#528FF0]">Razorpay</span> · 256-bit SSL</p>
          </div>
        </div>
      </div>
    </div>
  );
}
