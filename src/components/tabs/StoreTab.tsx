import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Heart, 
  Calendar, 
  CreditCard, 
  Phone, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Plus, 
  Minus, 
  Trash2, 
  Download, 
  Share2, 
  Video, 
  MessageCircle, 
  Clock, 
  User, 
  Mail,
  ArrowRight,
  Globe,
  Receipt,
  Zap,
  Copy,
  Smartphone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, CartItem, DonationFund, PaymentGateway, Donation, ServiceBooking } from '../../types';
import { StorageService } from '../../services/storageService';
import { MoorsDepositModal } from '../modals/MoorsDepositModal';

interface StoreTabProps {
  products: Product[];
  onDonationSuccess?: (donation: Donation) => void;
}

export const StoreTab: React.FC<StoreTabProps> = ({ products, onDonationSuccess }) => {
  const [subTab, setSubTab] = useState<'store' | 'give' | 'booking'>('store');
  const [currency, setCurrency] = useState<'USD' | 'ZiG' | 'GBP' | 'ZAR'>('USD');
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartModal, setShowCartModal] = useState<boolean>(false);

  // Giving Form State
  const [giveFund, setGiveFund] = useState<DonationFund>('Tithe');
  const [giveAmount, setGiveAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway>('EcoCash');
  const [donorPhone, setDonorPhone] = useState<string>(StorageService.getCurrentUser().phone || '0772123456');
  const [isAnonymousDonation, setIsAnonymousDonation] = useState<boolean>(false);
  const [activeReceipt, setActiveReceipt] = useState<Donation | null>(null);
  const [showMoorsModal, setShowMoorsModal] = useState<boolean>(false);
  const [copiedUssdCode, setCopiedUssdCode] = useState<boolean>(false);

  const PAYMENT_ACCOUNT_NUMBER = '0771445642';

  // 1-on-1 Booking Form State
  const [bookingService, setBookingService] = useState<ServiceBooking['service_type']>('Prophetic Mentorship');
  const [bookingDate, setBookingDate] = useState<string>('2026-09-15');
  const [bookingTime, setBookingTime] = useState<string>('02:00 PM CAT');
  const [bookingName, setBookingName] = useState<string>(StorageService.getCurrentUser().full_name);
  const [bookingPhone, setBookingPhone] = useState<string>(StorageService.getCurrentUser().phone);
  const [bookingLocation, setBookingLocation] = useState<string>(StorageService.getCurrentUser().cell_group || 'Harare, Zimbabwe');
  const [bookingEmail, setBookingEmail] = useState<string>('believer@gatewayzim.org');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [confirmedBooking, setConfirmedBooking] = useState<ServiceBooking | null>(null);

  // Currency Exchange helper
  const getPrice = (usd: number) => {
    if (currency === 'ZiG') return `${Math.round(usd * 14.8)} ZiG`;
    if (currency === 'GBP') return `£${Math.round(usd * 0.78)}`;
    if (currency === 'ZAR') return `R${Math.round(usd * 18.5)}`;
    return `$${usd} USD`;
  };

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, selectedSize: 'M' }];
    });
    confetti({
      particleCount: 15,
      spread: 40,
      origin: { y: 0.8 }
    });
  };

  const totalCartUsd = cart.reduce((sum, item) => sum + (item.product.price_usd * item.quantity), 0);

  const handleProcessDonation = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmt = customAmount ? parseFloat(customAmount) : giveAmount;
    if (!finalAmt || finalAmt <= 0) return;

    const user = StorageService.getCurrentUser();
    const impactMap: Record<DonationFund, string> = {
      'Tithe': 'Ministry operations, broadcast satellites & pastoral sustenance',
      'Firstfruits': 'Altar dedication and new territory advancement in 2026',
      'Seed Faith': 'Harare Evangelistic Crusade & Souls outreach',
      'Building Foundation': 'Cathedral Roofing Phase 2 Construction in Belvedere',
      'Missions & Evangelism': 'Rural Mashonaland & Matabeleland church plants',
      'Apostolic Honorarium': 'Direct apostolic blessing and prophetic mantle honoring'
    };

    const donation = StorageService.recordDonation({
      donor_id: user.id,
      donor_name: isAnonymousDonation ? 'Anonymous Covenant Partner' : user.full_name,
      amount: finalAmt,
      currency: currency,
      fund_type: giveFund,
      payment_method: paymentGateway,
      impact_tag: impactMap[giveFund] || 'Kingdom Advancement',
      is_anonymous: isAnonymousDonation
    });

    setActiveReceipt(donation);
    confetti({
      particleCount: 50,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const handleProcessBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const newBooking = StorageService.createBooking({
      user_name: bookingName,
      user_phone: bookingPhone,
      user_email: bookingEmail,
      service_type: bookingService,
      date: bookingDate,
      time_slot: bookingTime,
      deposit_amount: bookingService === 'Prophetic Mentorship' ? 50 : 30,
      deposit_paid: true,
      notes: `Location: ${bookingLocation} | ${bookingNotes}`,
      reminder_phone: bookingPhone
    });

    setConfirmedBooking(newBooking);
    confetti({
      particleCount: 40,
      spread: 70
    });

    // Dispatch directly to WhatsApp number +263780699988
    const waText = `*PAID 1-ON-1 PASTORAL CONSULTATION BOOKING*
----------------------------------------
*Name:* ${bookingName}
*Phone:* ${bookingPhone}
*Location (Where I am):* ${bookingLocation}
*Preferred Date:* ${bookingDate}
*Preferred Time:* ${bookingTime}
*Service:* ${bookingService}
*Notes:* ${bookingNotes || 'Apostolic consultation request'}
----------------------------------------
_Forwarded to ministry intake desk._`;
    window.open(`https://wa.me/263780699988?text=${encodeURIComponent(waText)}`, '_blank');
  };

  const handleProcessOrderCheckout = () => {
    if (cart.length === 0) return;
    const user = StorageService.getCurrentUser();
    StorageService.createOrder({
      user_name: user.full_name,
      user_phone: user.phone,
      items: cart,
      total_usd: totalCartUsd,
      payment_method: paymentGateway,
      delivery_address: 'Main Church Pick-up Desk / Belvedere Cathedral Hub'
    });

    setCart([]);
    setShowCartModal(false);
    confetti({
      particleCount: 40,
      spread: 70
    });
  };

  return (
    <div className="space-y-4 pb-24 max-w-4xl mx-auto px-3 sm:px-4 pt-2">
      
      {/* 1. Header Toolbar with Sub-tabs and Currency Switcher */}
      <div className="bg-[#001F3F] border border-[#D4AF37]/30 rounded-2xl p-3.5 sm:p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif-church text-base sm:text-lg font-bold text-[#D4AF37]">
            Gateway Store & Giving
          </h2>
          <p className="text-xs text-white/60">
            Ministry publications, online giving & pastoral counseling
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sub-Tab Switcher */}
          <div className="flex items-center gap-1 bg-[#001122] p-1 rounded-xl border border-white/10">
            <button
              id="tab-sub-store"
              onClick={() => setSubTab('store')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
                subTab === 'store' ? 'bg-[#D4AF37] text-[#001F3F] shadow-sm' : 'text-white/60 hover:text-white'
              }`}
            >
              Store & Books
              {cart.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-bold">
                  {cart.length}
                </span>
              )}
            </button>
            <button
              id="tab-sub-give"
              onClick={() => setSubTab('give')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                subTab === 'give' ? 'bg-[#D4AF37] text-[#001F3F] shadow-sm' : 'text-white/60 hover:text-white'
              }`}
            >
              Give & Tithe
            </button>
            <button
              id="tab-sub-booking"
              onClick={() => setSubTab('booking')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                subTab === 'booking' ? 'bg-[#D4AF37] text-[#001F3F] shadow-sm' : 'text-white/60 hover:text-white'
              }`}
            >
              1-on-1 Sessions
            </button>
          </div>

          {/* Currency Switcher */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
            className="bg-[#001122] border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-xs rounded-xl px-2 py-1.5 focus:outline-none"
          >
            <option value="USD">USD ($)</option>
            <option value="ZiG">ZiG (ZW)</option>
            <option value="GBP">GBP (£)</option>
            <option value="ZAR">ZAR (R)</option>
          </select>
        </div>
      </div>

      {/* 2. SUB-TAB: GIVING & DONATIONS */}
      {subTab === 'give' && (
        <div className="space-y-4">
          
          {/* Streamlined Mobile Money & Online Giving Account Card */}
          <div className="bg-[#001F3F] border border-[#D4AF37]/50 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#D4AF37] text-[#001F3F] text-[10px] font-bold uppercase">
                  Mobile Giving
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  EcoCash *151# Push Active
                </span>
              </div>
              
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-white/60">Account Number:</span>
                <span className="text-base font-mono font-black text-[#D4AF37] tracking-wider">
                  {PAYMENT_ACCOUNT_NUMBER}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(PAYMENT_ACCOUNT_NUMBER);
                    setCopiedUssdCode(true);
                    setTimeout(() => setCopiedUssdCode(false), 2000);
                  }}
                  className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[11px] text-white flex items-center gap-1 transition-all"
                  title="Copy Account Number"
                >
                  <Copy className="w-3 h-3 text-[#D4AF37]" />
                  <span>{copiedUssdCode ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <p className="text-xs text-white/70">
                Direct credit for Tithe, Firstfruits, Seed Faith & Building Fund.
              </p>
            </div>

            <button
              id="btn-open-moors-deposit"
              onClick={() => setShowMoorsModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2f] text-[#001F3F] font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all shrink-0 active:scale-[0.98]"
            >
              <Zap className="w-3.5 h-3.5 fill-[#001F3F]" />
              <span>Instant EcoCash Push</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Giving Form Card */}
            <div className="md:col-span-7 bg-[#001F3F] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif-church font-bold text-base text-white">
                    Sow Your Seed
                  </h3>
                  <p className="text-xs text-white/60">
                    Account: <strong className="text-[#D4AF37]">{PAYMENT_ACCOUNT_NUMBER}</strong>
                  </p>
                </div>
              </div>

              <form onSubmit={handleProcessDonation} className="space-y-3.5">
                {/* Fund Type Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Select Giving Fund
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {(['Tithe', 'Firstfruits', 'Seed Faith', 'Building Foundation', 'Missions & Evangelism', 'Apostolic Honorarium'] as DonationFund[]).map(fund => (
                      <button
                        type="button"
                        key={fund}
                        onClick={() => setGiveFund(fund)}
                        className={`p-2 rounded-xl text-left border transition-all text-xs font-semibold ${
                          giveFund === fund
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {fund}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Presets */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Amount ({currency})
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {[20, 50, 100, 250].map(amt => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => {
                          setGiveAmount(amt);
                          setCustomAmount('');
                        }}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                          giveAmount === amt && !customAmount
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-500/40'
                        }`}
                      >
                        {currency === 'USD' ? `$${amt}` : currency === 'ZiG' ? `${amt * 15} ZiG` : `${currency} ${amt}`}
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={`Or enter custom amount in ${currency}...`}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Payment Gateway Picker */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Payment Method (Target: {PAYMENT_ACCOUNT_NUMBER})
                    </label>
                    <span className="text-[10px] text-amber-400 font-mono">
                      Acct: {PAYMENT_ACCOUNT_NUMBER}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['EcoCash', 'OneMoney', 'Paynow', 'Stripe', 'PayPal', 'Bank Transfer'] as PaymentGateway[]).map(gw => (
                      <button
                        type="button"
                        key={gw}
                        onClick={() => setPaymentGateway(gw)}
                        className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all ${
                          paymentGateway === gw
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>{gw === 'EcoCash' ? '📱 EcoCash' : gw === 'Paynow' ? '🇿🇼 Paynow' : gw === 'Stripe' ? '💳 Card / Stripe' : gw}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone / Mobile Prompt */}
                {(paymentGateway === 'EcoCash' || paymentGateway === 'OneMoney' || paymentGateway === 'Paynow') && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-300">
                        {paymentGateway} Mobile Number for USSD Push (*151#)
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Target: {PAYMENT_ACCOUNT_NUMBER}
                      </span>
                    </div>
                    <input
                      type="tel"
                      required
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      placeholder="e.g. 0772123456 or 0712345678"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                    <p className="text-[11px] text-slate-400">
                      A secure pin prompt will be sent directly to your phone to authorize transfer to <strong className="text-amber-300">{PAYMENT_ACCOUNT_NUMBER}</strong>.
                    </p>
                  </div>
                )}

                {/* Anonymous Checkbox */}
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isAnonymousDonation}
                    onChange={(e) => setIsAnonymousDonation(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-amber-500"
                  />
                  <span>Keep Donation Anonymous on Kingdom Impact Tickers</span>
                </label>

                {/* Submit CTA */}
                <button
                  id="btn-submit-giving"
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <Heart className="w-4 h-4 fill-slate-950" />
                  <span>Authorize Giving of {customAmount ? `${currency} ${customAmount}` : `${currency} ${giveAmount}`}</span>
                </button>
              </form>
            </div>

          {/* Ministry Impact & Privacy Assurance Column */}
          <div className="md:col-span-5 space-y-4">
            
            {/* Impact Metrics Box */}
            <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-4 space-y-3">
              <h4 className="font-serif-church font-bold text-[#D4AF37] text-sm">
                Where Your Seed Goes
              </h4>
              <div className="space-y-2 text-xs">
                <div className="bg-[#001122] p-2.5 rounded-xl border border-white/5">
                  <p className="font-bold text-white">📡 Gospel Broadcasts</p>
                  <p className="text-white/60 text-[11px] mt-0.5">
                    Funding low-data streaming & radio across Zimbabwe & Diaspora.
                  </p>
                </div>
                <div className="bg-[#001122] p-2.5 rounded-xl border border-white/5">
                  <p className="font-bold text-white">🍲 Widows & Orphans Care</p>
                  <p className="text-white/60 text-[11px] mt-0.5">
                    Monthly grocery hampers distributed to vulnerable families.
                  </p>
                </div>
                <div className="bg-[#001122] p-2.5 rounded-xl border border-white/5">
                  <p className="font-bold text-white">🏛️ Cathedral Building Fund</p>
                  <p className="text-white/60 text-[11px] mt-0.5">
                    Phase 2 cathedral development in Belvedere, Harare.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl text-xs text-[#D4AF37] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="text-[11px]">Official giving receipts generated immediately upon completion.</span>
              </div>
            </div>

          </div>

        </div>
        </div>
      )}

      {/* 3. SUB-TAB: BOOK 1-ON-1 PASTORAL SERVICE */}
      {subTab === 'booking' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          <div className="md:col-span-7 bg-slate-900 border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold uppercase">
                APOSTOLIC COUNSELING & IMPARTATION
              </span>
              <h3 className="font-serif-church font-bold text-base sm:text-lg text-white mt-1">
                Book a 1-on-1 Session with Apostle Joe Daniels
              </h3>
              <p className="text-xs text-slate-400">
                Available in-person at Cathedral Office or via secure private Zoom / Google Meet.
              </p>
            </div>

            <form onSubmit={handleProcessBooking} className="space-y-3.5">
              
              {/* Service Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Ministry Focus
                </label>
                <select
                  value={bookingService}
                  onChange={(e) => setBookingService(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Prophetic Mentorship">Prophetic Mentorship & Spiritual Direction ($50 Deposit)</option>
                  <option value="Pastoral Counseling">Pastoral Counseling & Family Healing ($30 Deposit)</option>
                  <option value="Business & Estate Dedication">Business & Estate Dedication / Covenant Wealth ($50 Deposit)</option>
                  <option value="Premarital Guidance">Premarital Guidance & Foundation ($30 Deposit)</option>
                  <option value="Deliverance & Healing">Deliverance & Personal Warfare ($30 Deposit)</option>
                </select>
              </div>

              {/* Date & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Available Time Slot (CAT)
                  </label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="10:00 AM CAT">10:00 AM CAT (Morning)</option>
                    <option value="02:00 PM CAT">02:00 PM CAT (Afternoon)</option>
                    <option value="04:30 PM CAT">04:30 PM CAT (Late Afternoon)</option>
                    <option value="08:00 PM CAT">08:00 PM CAT (Diaspora Evening)</option>
                  </select>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    WhatsApp Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={bookingPhone}
                    onChange={(e) => setBookingPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Location (Where you are)
                  </label>
                  <input
                    type="text"
                    required
                    value={bookingLocation}
                    onChange={(e) => setBookingLocation(e.target.value)}
                    placeholder="e.g. Harare, London, Bulawayo"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Brief Prayer or Discussion Background
                </label>
                <textarea
                  rows={2}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Share a short note on what you would like to bring before Apostle Joe Daniels..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Submit CTA */}
              <button
                id="btn-confirm-booking-submit"
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Confirm Session & Generate Zoom/SMS Link</span>
              </button>

            </form>
          </div>

          {/* Booking Summary / Confirmation View */}
          <div className="md:col-span-5 space-y-4">
            {confirmedBooking ? (
              <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-2xl p-5 space-y-3 text-center shadow-2xl">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-serif-church font-bold text-white text-base">
                  1-on-1 Session Confirmed!
                </h4>
                <p className="text-xs text-slate-300">
                  Your appointment with <span className="text-amber-400 font-bold">Apostle Joe Daniels</span> has been recorded.
                </p>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left text-xs space-y-1.5">
                  <p><span className="text-slate-500">Service:</span> <span className="font-bold text-amber-300">{confirmedBooking.service_type}</span></p>
                  <p><span className="text-slate-500">Date/Time:</span> {confirmedBooking.date} • {confirmedBooking.time_slot}</p>
                  <p><span className="text-slate-500">Status:</span> <span className="text-emerald-400 font-bold">Confirmed</span></p>
                  <p className="pt-1 border-t border-slate-800 truncate">
                    <span className="text-slate-500">Zoom:</span>{' '}
                    <a href={confirmedBooking.zoom_link} target="_blank" rel="noreferrer" className="text-blue-400 underline">
                      {confirmedBooking.zoom_link}
                    </a>
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <a
                    href={`https://wa.me/${confirmedBooking.reminder_phone.replace(/[^0-9]/g, '')}?text=Shalom%20${encodeURIComponent(confirmedBooking.user_name)},%20your%201-on-1%20prophetic%20session%20with%20Apostle%20Joe%20Daniels%20is%20confirmed%20for%20${confirmedBooking.date}%20at%20${confirmedBooking.time_slot}.%20Zoom%20link:%20${confirmedBooking.zoom_link}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send Reminder to WhatsApp</span>
                  </a>

                  <a
                    href={confirmedBooking.zoom_link}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Video className="w-4 h-4" />
                    <span>Launch Private Zoom Meeting</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="font-serif-church font-bold text-amber-400 text-sm">
                  Apostolic 1-on-1 Guidelines
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>Sessions are conducted strictly in confidence and covered by the blood covenant.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>You will receive an automated WhatsApp reminder and Zoom access code 1 hour before scheduled time.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>For international / diaspora partners, times are automatically synced with your local timezone.</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 4. SUB-TAB: STORE (BOOKS, APPAREL, MEDIA) */}
      {subTab === 'store' && (
        <div className="space-y-4">
          
          {/* Cart Header trigger if items exist */}
          {cart.length > 0 && (
            <div className="bg-amber-500 text-slate-950 p-3 rounded-2xl flex items-center justify-between font-bold shadow-lg">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <span>{cart.length} item(s) in Cart: {getPrice(totalCartUsd)}</span>
              </div>
              <button
                id="btn-view-cart-checkout"
                onClick={() => setShowCartModal(true)}
                className="px-4 py-1.5 bg-slate-950 text-amber-300 rounded-xl text-xs font-bold hover:bg-slate-900"
              >
                Checkout Now
              </button>
            </div>
          )}

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {products.map(prod => (
              <div
                key={prod.id}
                className="bg-[#001F3F] border border-white/10 hover:border-[#D4AF37]/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-all shadow-md"
              >
                <div>
                  <div className="relative aspect-square bg-[#001122] overflow-hidden">
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#001F3F]/90 text-[10px] font-bold text-[#D4AF37] border border-[#D4AF37]/30">
                      {prod.category}
                    </span>
                    {prod.is_bestseller && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#001F3F] text-[10px] font-black uppercase">
                        Bestseller
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 space-y-1">
                    <h4 className="font-bold text-sm text-white line-clamp-1">
                      {prod.name}
                    </h4>
                    <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>
                    <div className="pt-2 flex items-baseline gap-2">
                      <span className="text-base font-black text-[#D4AF37]">
                        {getPrice(prod.price_usd)}
                      </span>
                      <span className="text-[10px] text-white/50 font-medium">
                        ({prod.price_zig} ZiG)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#001122]/60 border-t border-white/5">
                  <button
                    id={`btn-add-product-${prod.id}`}
                    onClick={() => handleAddToCart(prod)}
                    className="w-full py-2 bg-[#D4AF37] hover:bg-[#c49f2f] text-[#001F3F] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* 5. Printable / Downloadable Official Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-center">
            
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-400/40">
              <Receipt className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                OFFICIAL KINGDOM GIVING RECEIPT
              </span>
              <h3 className="font-serif-church text-lg font-bold text-white mt-0.5">
                Gateway Church Zimbabwe
              </h3>
              <p className="text-xs text-slate-400">Apostle Joe Daniels Ministry</p>
            </div>

            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-xs text-left space-y-2 font-mono">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Receipt No:</span>
                <span className="font-bold text-amber-300">{activeReceipt.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Partner:</span>
                <span className="text-white">{activeReceipt.donor_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fund:</span>
                <span className="text-amber-400 font-bold">{activeReceipt.fund_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Via:</span>
                <span className="text-white">{activeReceipt.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Impact Allocation:</span>
                <span className="text-emerald-400 font-bold text-[11px]">{activeReceipt.impact_tag}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1.5 text-sm">
                <span className="text-slate-300 font-bold">Total Given:</span>
                <span className="text-amber-300 font-black">{activeReceipt.currency} {activeReceipt.amount}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              "The Lord remember all thine offerings, and accept thy burnt sacrifice. Selah." — Psalm 20:3
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setActiveReceipt(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 flex items-center justify-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Receipt</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. Cart & Checkout Modal */}
      {showCartModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-serif-church font-bold text-amber-400 text-base">
                Your Kingdom Store Cart
              </h3>
              <button onClick={() => setShowCartModal(false)} className="text-xs text-slate-400">✕</button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {cart.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <p className="font-bold text-white">{item.product.name}</p>
                    <p className="text-slate-400">{getPrice(item.product.price_usd)} × {item.quantity}</p>
                  </div>
                  <button
                    onClick={() => setCart(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-white">
              <span>Total Payable:</span>
              <span className="text-amber-400">{getPrice(totalCartUsd)}</span>
            </div>

            <button
              onClick={handleProcessOrderCheckout}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow"
            >
              Confirm Purchase & Pay via {paymentGateway}
            </button>
          </div>
        </div>
      )}

      {/* 7. Moors Betting App Style Instant Online Deposit Modal */}
      <MoorsDepositModal
        isOpen={showMoorsModal}
        onClose={() => setShowMoorsModal(false)}
        onDepositSuccess={(donation) => {
          setActiveReceipt(donation);
          if (onDonationSuccess) {
            onDonationSuccess(donation);
          }
        }}
        defaultFund={giveFund}
        initialAmount={customAmount ? parseFloat(customAmount) || 20 : giveAmount}
      />

    </div>
  );
};
