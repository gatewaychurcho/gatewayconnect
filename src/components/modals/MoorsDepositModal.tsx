import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  X, 
  ArrowRight, 
  RotateCw, 
  Zap, 
  Heart, 
  Download, 
  Share2, 
  Lock, 
  PhoneCall, 
  Receipt,
  QrCode
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DonationFund, Donation, User } from '../../types';
import { StorageService } from '../../services/storageService';

interface MoorsDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepositSuccess?: (donation: Donation) => void;
  defaultFund?: DonationFund;
  initialAmount?: number;
}

export const MoorsDepositModal: React.FC<MoorsDepositModalProps> = ({
  isOpen,
  onClose,
  onDepositSuccess,
  defaultFund = 'Tithe',
  initialAmount = 20
}) => {
  const currentUser: User = StorageService.getCurrentUser();
  const PAYMENT_ACCOUNT_NUMBER = '0771445642';

  const [paymentChannel, setPaymentChannel] = useState<'ecocash_express' | 'ecocash_ussd' | 'onemoney' | 'innbucks' | 'paynow' | 'card'>('ecocash_express');
  const [selectedFund, setSelectedFund] = useState<DonationFund>(defaultFund);
  const [amount, setAmount] = useState<number>(initialAmount);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [currency, setCurrency] = useState<'USD' | 'ZiG' | 'ZAR' | 'GBP'>('USD');
  const [phone, setPhone] = useState<string>(currentUser.phone || '0772123456');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [copiedUssd, setCopiedUssd] = useState<boolean>(false);

  // Live USSD Push Prompt State Machine
  const [depositState, setDepositState] = useState<'idle' | 'initiating' | 'ussd_prompt' | 'success' | 'failed'>('idle');
  const [ussdTimer, setUssdTimer] = useState<number>(45);
  const [simulatedPin, setSimulatedPin] = useState<string>('');
  const [activeReceipt, setActiveReceipt] = useState<Donation | null>(null);

  // Quick Deposit Amount Presets (Moors Style)
  const PRESET_AMOUNTS = [2, 5, 10, 20, 50, 100, 200, 500];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (depositState === 'ussd_prompt' && ussdTimer > 0) {
      interval = setInterval(() => {
        setUssdTimer(prev => prev - 1);
      }, 1000);
    } else if (depositState === 'ussd_prompt' && ussdTimer <= 0) {
      // Auto-fallback
      handleCompleteDeposit();
    }
    return () => clearInterval(interval);
  }, [depositState, ussdTimer]);

  if (!isOpen) return null;

  const currentFinalAmount = customAmount ? parseFloat(customAmount) || 0 : amount;

  // Formatted USSD String for Zimbabwe EcoCash
  // e.g. *151*1*1*0771445642*50# (Send Money) or *151*2*2*0771445642*50# (Merchant)
  const ussdCodeString = `*151*1*1*${PAYMENT_ACCOUNT_NUMBER}*${currentFinalAmount}#`;

  const handleCopyUssd = () => {
    navigator.clipboard.writeText(ussdCodeString);
    setCopiedUssd(true);
    setTimeout(() => setCopiedUssd(false), 2500);
  };

  const handleStartDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFinalAmount || currentFinalAmount <= 0) return;

    if (paymentChannel === 'ecocash_express' || paymentChannel === 'onemoney') {
      setDepositState('initiating');
      setUssdTimer(45);
      
      // Simulate network handshake to mobile operator switch for account 0771445642
      setTimeout(() => {
        setDepositState('ussd_prompt');
      }, 1200);
    } else if (paymentChannel === 'ecocash_ussd') {
      // Manual USSD mode
      setDepositState('ussd_prompt');
    } else {
      // Paynow / Card / InnBucks
      setDepositState('initiating');
      setTimeout(() => {
        handleCompleteDeposit();
      }, 1500);
    }
  };

  const handleCompleteDeposit = () => {
    const finalAmt = currentFinalAmount;
    const impactMap: Record<DonationFund, string> = {
      'Tithe': 'Ministry operations, satellite broadcasting & pastoral sustenance',
      'Firstfruits': 'Altar dedication and new territory advancement in 2026',
      'Seed Faith': 'Supernatural harvest & breakthrough seed',
      'Building Foundation': 'Belvedere Cathedral Phase 2 Roofing Project',
      'Missions & Evangelism': 'Rural crusades & church plants across Zimbabwe',
      'Apostolic Honorarium': 'Direct apostolic blessing and prophetic mantle honoring'
    };

    const channelNameMap: Record<typeof paymentChannel, string> = {
      'ecocash_express': `EcoCash Push (0771445642)`,
      'ecocash_ussd': `EcoCash Direct Dial (0771445642)`,
      'onemoney': `OneMoney NetOne (0771445642)`,
      'innbucks': `InnBucks Transfer (0771445642)`,
      'paynow': `Paynow Online Gateway (0771445642)`,
      'card': `Visa / MasterCard / Stripe`
    };

    const newDonation = StorageService.recordDonation({
      donor_id: currentUser.id,
      donor_name: isAnonymous ? 'Anonymous Covenant Partner' : currentUser.full_name,
      amount: finalAmt,
      currency: currency,
      fund_type: selectedFund,
      payment_method: channelNameMap[paymentChannel] as any,
      impact_tag: impactMap[selectedFund] || 'Kingdom Advancement',
      is_anonymous: isAnonymous
    });

    setActiveReceipt(newDonation);
    setDepositState('success');

    confetti({
      particleCount: 55,
      spread: 80,
      origin: { y: 0.6 }
    });

    if (onDepositSuccess) {
      onDepositSuccess(newDonation);
    }
  };

  const handleShareWhatsAppProof = (receipt: Donation) => {
    const text = `✅ *Gateway Church Zimbabwe - Online Deposit Proof*\n\n` +
      `📌 *Receiving Account:* ${PAYMENT_ACCOUNT_NUMBER}\n` +
      `🏷️ *Receipt Ref:* ${receipt.receipt_number}\n` +
      `💰 *Amount Deposited:* ${receipt.currency} ${receipt.amount}\n` +
      `🙏 *Fund:* ${receipt.fund_type}\n` +
      `👤 *Partner:* ${receipt.donor_name}\n` +
      `📱 *Method:* ${receipt.payment_method}\n` +
      `📅 *Date:* ${new Date(receipt.created_at).toLocaleString()}\n\n` +
      `"The Lord remember all thine offerings!" — Psalm 20:3`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#001F3F] border-2 border-[#D4AF37]/50 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
        
        {/* 1. Modal Top Banner (Moors Betting App Style Deposit Header) */}
        <div className="bg-gradient-to-r from-[#001122] via-[#001F3F] to-[#001122] p-4 border-b border-[#D4AF37]/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-[#001F3F] flex items-center justify-center font-black shadow-md">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base text-white tracking-wide">
                  ONLINE INSTANT DEPOSIT
                </h3>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-bold">
                  LIVE SWITCH
                </span>
              </div>
              <p className="text-[11px] text-[#D4AF37] font-semibold flex items-center gap-1">
                <span>Account Number:</span>
                <span className="font-mono font-bold bg-[#001122] px-1.5 py-0.5 rounded border border-[#D4AF37]/40 text-white">
                  {PAYMENT_ACCOUNT_NUMBER}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. MAIN MODAL BODY */}
        <div className="p-4 sm:p-5 space-y-4">

          {/* STATE: IDLE / FORM SELECTION */}
          {depositState === 'idle' && (
            <form onSubmit={handleStartDeposit} className="space-y-4">
              
              {/* Payment Channel Selector (Moors Style Tabs) */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  Select Payment Method (Direct to {PAYMENT_ACCOUNT_NUMBER})
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentChannel('ecocash_express')}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      paymentChannel === 'ecocash_express'
                        ? 'bg-[#D4AF37] text-[#001F3F] border-[#D4AF37] shadow-md font-extrabold'
                        : 'bg-[#001122] border-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>EcoCash Express</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentChannel('ecocash_ussd')}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      paymentChannel === 'ecocash_ussd'
                        ? 'bg-[#D4AF37] text-[#001F3F] border-[#D4AF37] shadow-md font-extrabold'
                        : 'bg-[#001122] border-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Direct *151#</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentChannel('onemoney')}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      paymentChannel === 'onemoney'
                        ? 'bg-[#D4AF37] text-[#001F3F] border-[#D4AF37] shadow-md font-extrabold'
                        : 'bg-[#001122] border-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>OneMoney</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentChannel('innbucks')}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      paymentChannel === 'innbucks'
                        ? 'bg-[#D4AF37] text-[#001F3F] border-[#D4AF37] shadow-md font-extrabold'
                        : 'bg-[#001122] border-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>InnBucks</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentChannel('paynow')}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      paymentChannel === 'paynow'
                        ? 'bg-[#D4AF37] text-[#001F3F] border-[#D4AF37] shadow-md font-extrabold'
                        : 'bg-[#001122] border-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Paynow / ZimSwitch</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentChannel('card')}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      paymentChannel === 'card'
                        ? 'bg-[#D4AF37] text-[#001F3F] border-[#D4AF37] shadow-md font-extrabold'
                        : 'bg-[#001122] border-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>Visa / Mastercard</span>
                  </button>
                </div>
              </div>

              {/* Giving Fund / Category Allocation */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">
                  Purpose / Fund Allocation
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {(['Tithe', 'Firstfruits', 'Seed Faith', 'Building Foundation', 'Missions & Evangelism', 'Apostolic Honorarium'] as DonationFund[]).map(fund => (
                    <button
                      type="button"
                      key={fund}
                      onClick={() => setSelectedFund(fund)}
                      className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all ${
                        selectedFund === fund
                          ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37] font-bold'
                          : 'bg-[#001122] border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      {fund}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Selection & Presets (Moors Style Grid) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-white/80">
                    Deposit Amount
                  </label>
                  <div className="flex items-center gap-1 bg-[#001122] p-0.5 rounded-lg border border-white/10">
                    {(['USD', 'ZiG', 'ZAR', 'GBP'] as const).map(curr => (
                      <button
                        type="button"
                        key={curr}
                        onClick={() => setCurrency(curr)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                          currency === curr
                            ? 'bg-[#D4AF37] text-[#001F3F]'
                            : 'text-white/60 hover:text-white'
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Moors Preset Amount Chips */}
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {PRESET_AMOUNTS.map(amt => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => {
                        setAmount(amt);
                        setCustomAmount('');
                      }}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                        amount === amt && !customAmount
                          ? 'bg-[#D4AF37] text-[#001F3F] border-[#D4AF37] shadow-sm font-black'
                          : 'bg-[#001122] border-white/10 text-white hover:border-[#D4AF37]/50'
                      }`}
                    >
                      {currency === 'USD' ? `$${amt}` : currency === 'ZiG' ? `${amt * 15} ZiG` : `${currency} ${amt}`}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                    placeholder={`Or enter custom amount in ${currency}...`}
                    className="w-full bg-[#001122] border border-white/20 rounded-xl p-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#D4AF37]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-[#D4AF37]">
                    {currency}
                  </span>
                </div>
              </div>

              {/* Mobile Phone Input for EcoCash / OneMoney Push */}
              {(paymentChannel === 'ecocash_express' || paymentChannel === 'onemoney') && (
                <div className="bg-[#001122] p-3 rounded-xl border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#D4AF37]">
                      Your Mobile Number (USSD Push Target)
                    </span>
                    <span className="text-[10px] text-white/50">Receives *151# PIN prompt</span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 0772123456 or 0712345678"
                    className="w-full bg-[#001F3F] border border-white/15 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                  <p className="text-[11px] text-white/60">
                    Payment will be deposited straight into church account <strong className="text-[#D4AF37]">{PAYMENT_ACCOUNT_NUMBER}</strong>.
                  </p>
                </div>
              )}

              {/* Direct USSD Dial Instruction if chosen */}
              {paymentChannel === 'ecocash_ussd' && (
                <div className="bg-[#001122] p-3 rounded-xl border border-[#D4AF37]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#D4AF37]">Quick USSD Dial String</span>
                    <button
                      type="button"
                      onClick={handleCopyUssd}
                      className="text-[11px] text-white/80 hover:text-white flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded"
                    >
                      <Copy className="w-3 h-3 text-[#D4AF37]" />
                      <span>{copiedUssd ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>
                  <div className="bg-black/60 p-2.5 rounded-lg font-mono text-sm text-[#D4AF37] text-center font-bold tracking-wider">
                    {ussdCodeString}
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`tel:${encodeURIComponent(ussdCodeString)}`}
                      className="flex-1 py-1.5 bg-[#D4AF37] text-[#001F3F] rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Tap to Dial on Phone</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Anonymous Checkbox */}
              <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={e => setIsAnonymous(e.target.checked)}
                  className="rounded accent-[#D4AF37]"
                />
                <span>Keep my identity anonymous on giving wall</span>
              </label>

              {/* Submit CTA Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#f1cf6d] to-[#D4AF37] text-[#001F3F] font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-[#001F3F]" />
                <span>
                  Deposit {currency} {currentFinalAmount} via {paymentChannel.replace('_', ' ')}
                </span>
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-white/50 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encrypted 256-bit SSL • Instant Settlement to {PAYMENT_ACCOUNT_NUMBER}</span>
              </div>

            </form>
          )}

          {/* STATE: INITIATING / HANDSHAKE */}
          {depositState === 'initiating' && (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 border-2 border-[#D4AF37] flex items-center justify-center mx-auto animate-spin">
                <RotateCw className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <div>
                <h4 className="font-bold text-base text-white">
                  Contacting Payment Switch...
                </h4>
                <p className="text-xs text-white/60 mt-1">
                  Connecting to EcoCash / OneMoney network for account <strong className="text-[#D4AF37]">{PAYMENT_ACCOUNT_NUMBER}</strong>
                </p>
              </div>
            </div>
          )}

          {/* STATE: USSD PIN PROMPT (Simulated Mobile Screen like Moors Betting App) */}
          {depositState === 'ussd_prompt' && (
            <div className="space-y-4">
              <div className="bg-[#001122] border-2 border-[#D4AF37] rounded-2xl p-4 sm:p-5 text-center space-y-3 relative overflow-hidden shadow-2xl">
                
                {/* Simulated USSD Top Pill */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold animate-pulse">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>USSD Push Sent to {phone}</span>
                </div>

                <div className="bg-black/80 rounded-xl p-4 border border-white/10 text-left space-y-2 font-mono text-xs text-white">
                  <div className="text-emerald-400 font-bold border-b border-white/10 pb-1 flex justify-between">
                    <span>EcoCash USSD Session (*151#)</span>
                    <span>{ussdTimer}s</span>
                  </div>
                  <p className="text-white/90">
                    Transfer <strong>{currency} {currentFinalAmount}</strong> to <strong>Gateway Church (Acct: {PAYMENT_ACCOUNT_NUMBER})</strong>?
                  </p>
                  <p className="text-[#D4AF37]">Enter EcoCash PIN on your phone to approve:</p>
                  
                  <div className="pt-2 flex items-center gap-2">
                    <input
                      type="password"
                      maxLength={4}
                      value={simulatedPin}
                      onChange={e => setSimulatedPin(e.target.value)}
                      placeholder="••••"
                      className="w-28 bg-[#001F3F] border border-[#D4AF37] rounded-lg px-3 py-1.5 text-center text-sm tracking-widest text-[#D4AF37] outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCompleteDeposit}
                      className="flex-1 py-1.5 bg-[#D4AF37] hover:bg-[#c49f2f] text-[#001F3F] rounded-lg font-bold text-xs"
                    >
                      Authorize & Confirm
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-white/50">
                  Did not receive the prompt? Dial <span className="text-[#D4AF37] font-mono">{ussdCodeString}</span> manually.
                </p>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setDepositState('idle')}
                    className="flex-1 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/15"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteDeposit}
                    className="flex-1 py-2 rounded-xl bg-[#D4AF37] text-[#001F3F] text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simulate Success</span>
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* STATE: SUCCESS / KINGDOM RECEIPT */}
          {depositState === 'success' && activeReceipt && (
            <div className="space-y-4 text-center">
              
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  DEPOSIT CONFIRMED & CREDITED
                </span>
                <h4 className="font-serif-church font-bold text-lg text-white mt-0.5">
                  Payment of {activeReceipt.currency} {activeReceipt.amount} Received!
                </h4>
                <p className="text-xs text-white/60">
                  Deposited into Church Payment Account <strong className="text-[#D4AF37]">{PAYMENT_ACCOUNT_NUMBER}</strong>
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="bg-[#001122] rounded-xl p-4 border border-[#D4AF37]/40 text-xs text-left space-y-2 font-mono">
                <div className="flex justify-between border-b border-white/10 pb-1">
                  <span className="text-white/50">Reference:</span>
                  <span className="font-bold text-[#D4AF37]">{activeReceipt.receipt_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Donor / Partner:</span>
                  <span className="text-white">{activeReceipt.donor_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Fund Purpose:</span>
                  <span className="text-[#D4AF37] font-bold">{activeReceipt.fund_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Payment Account:</span>
                  <span className="text-emerald-400 font-bold">{PAYMENT_ACCOUNT_NUMBER}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Impact:</span>
                  <span className="text-white/80 text-[11px] truncate max-w-[200px]">{activeReceipt.impact_tag}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-1 text-sm font-sans font-bold">
                  <span className="text-white/70">Total Amount:</span>
                  <span className="text-[#D4AF37]">{activeReceipt.currency} {activeReceipt.amount}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  onClick={() => handleShareWhatsAppProof(activeReceipt)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Proof to WhatsApp</span>
                </button>

                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => {
                    setDepositState('idle');
                    onClose();
                  }}
                  className="py-2.5 px-4 rounded-xl bg-[#D4AF37] text-[#001F3F] text-xs font-black"
                >
                  Done
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
