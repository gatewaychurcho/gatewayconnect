import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  ArrowRight, 
  RotateCw, 
  Smartphone, 
  CreditCard, 
  Globe, 
  Download, 
  Receipt, 
  Zap, 
  X,
  Building,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DonationFund, PaymentGateway, Donation } from '../../types';
import { StorageService } from '../../services/storageService';
import { PaynowService } from '../../services/paynowService';
import { MoorsDepositModal } from '../modals/MoorsDepositModal';
import { PaynowConfigModal } from '../modals/PaynowConfigModal';

interface GivingTabProps {
  onDonationSuccess?: (donation: Donation) => void;
}

export const GivingTab: React.FC<GivingTabProps> = ({ onDonationSuccess }) => {
  const currentUser = StorageService.getCurrentUser();
  const [currency, setCurrency] = useState<'USD' | 'ZiG' | 'GBP' | 'ZAR'>('USD');
  const [giveAmount, setGiveAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedFund, setSelectedFund] = useState<DonationFund>('Tithe');
  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway>('EcoCash');
  const [isAnonymousDonation, setIsAnonymousDonation] = useState<boolean>(false);
  const [donorPhone, setDonorPhone] = useState<string>(currentUser?.phone || '0772123456');
  const [donorEmail, setDonorEmail] = useState<string>(currentUser?.email || '');
  const [donorFullName, setDonorFullName] = useState<string>(currentUser?.full_name || 'Church Member');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [donationSuccess, setDonationSuccess] = useState<Donation | null>(null);

  // Paynow state
  const [paynowInstruction, setPaynowInstruction] = useState<string | null>(null);
  const [paynowRedirectUrl, setPaynowRedirectUrl] = useState<string | null>(null);
  const [showPaynowConfigModal, setShowPaynowConfigModal] = useState<boolean>(false);
  const [showMoorsDepositModal, setShowMoorsDepositModal] = useState<boolean>(false);

  const effectiveAmount = customAmount ? parseFloat(customAmount) || 0 : giveAmount;

  const funds: Array<{ id: DonationFund; label: string; icon: string; desc: string }> = [
    { id: 'Tithe', label: 'Tithe', icon: '🕊️', desc: '10% Kingdom Honor & Covenant Opening' },
    { id: 'Offering', label: 'Sanctuary Offering', icon: '🪙', desc: 'General sanctuary praise & worship' },
    { id: 'Seed Faith', label: 'Seed Faith', icon: '🌾', desc: 'Prophetic seed for breakthrough' },
    { id: 'Altar Covenant', label: 'Altar Covenant', icon: '🔥', desc: 'Special altar sacrifice with Apostle' },
    { id: 'Building Fund', label: 'Cathedral Building', icon: '🏛️', desc: 'Phase 2 roofing in Belvedere, Harare' },
    { id: 'First Fruits', label: 'First Fruits', icon: '🍇', desc: 'Consecrating your increase to God' },
    { id: 'Pastor Appreciation', label: 'Widows & Orphans', icon: '🍲', desc: 'Monthly food hampers for families' }
  ];

  const presetsByCurrency: Record<string, number[]> = {
    USD: [10, 25, 50, 100, 250, 500],
    ZiG: [150, 350, 750, 1500, 3500, 7500],
    GBP: [10, 20, 50, 80, 200, 400],
    ZAR: [200, 500, 1000, 2000, 5000, 10000]
  };

  const currentPresets = presetsByCurrency[currency] || [10, 25, 50, 100, 250, 500];

  const handleProcessGiving = async (e: React.FormEvent) => {
    e.preventDefault();
    if (effectiveAmount <= 0) {
      alert('Please enter a valid giving amount.');
      return;
    }

    setIsProcessing(true);
    setPaynowInstruction(null);
    setPaynowRedirectUrl(null);

    // Paynow Gateway Flow
    if (paymentGateway === 'Paynow') {
      try {
        const initResult = await PaynowService.initiatePayment({
          reference: `GIVE-${Date.now().toString().slice(-6)}`,
          amount: effectiveAmount,
          currency,
          additionalInfo: `${selectedFund} - ${isAnonymousDonation ? 'Anonymous Partner' : donorFullName}`,
          payerPhone: donorPhone,
          payerEmail: donorEmail || 'member@gatewaychurch.org'
        });

        if (initResult.success && initResult.redirectUrl) {
          setPaynowRedirectUrl(initResult.redirectUrl);
          setPaynowInstruction(initResult.instructions || 'Redirecting to Paynow payment gateway...');
          window.open(initResult.redirectUrl, '_blank');
        } else if (initResult.pollUrl) {
          setPaynowInstruction(initResult.instructions || 'Please complete authorization on your device.');
        }
      } catch (err) {
        console.warn('Paynow init warning:', err);
      }
    }

    setTimeout(() => {
      const newDonation: Donation = {
        id: `give_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        user_name: isAnonymousDonation ? 'Anonymous Covenant Partner' : donorFullName,
        user_id: currentUser?.id || 'usr_guest',
        fund: selectedFund,
        amount: effectiveAmount,
        currency,
        payment_method: paymentGateway,
        date: new Date().toISOString(),
        is_anonymous: isAnonymousDonation,
        status: 'completed',
        created_at: new Date().toISOString()
      };

      StorageService.recordDonation(newDonation);
      setDonationSuccess(newDonation);
      setIsProcessing(false);
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });

      if (onDonationSuccess) {
        onDonationSuccess(newDonation);
      }
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-600 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-amber-200 border border-amber-300/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Kingdom Giving & Covenant Altar</span>
          </div>
          <h2 className="font-serif-church text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-sm">
            Give, Tithes & Seed Offerings
          </h2>
          <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
            "Honor the Lord with thy substance, and with the firstfruits of all thine increase: So shall thy barns be filled with plenty." — Proverbs 3:9-10
          </p>
        </div>
        <div className="absolute right-3 -bottom-6 opacity-15 pointer-events-none text-white select-none">
          <Heart className="w-56 h-56 fill-current" />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Giving Form (Left 7 Cols) */}
        <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
          <form onSubmit={handleProcessGiving} className="space-y-5">
            
            {/* 1. Select Fund Category */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                1. Select Giving Purpose
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {funds.map((f) => {
                  const isSelected = selectedFund === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFund(f.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected 
                          ? 'border-amber-500 bg-amber-500/10 text-foreground ring-1 ring-amber-500/50 shadow-sm' 
                          : 'border-border bg-secondary/30 text-muted-foreground hover:border-border/80 hover:text-foreground'
                      }`}
                    >
                      <div className="text-xl mb-1">{f.icon}</div>
                      <div className="font-bold text-xs text-foreground truncate">{f.label}</div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1">{f.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Select Currency & Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  2. Choose Amount ({currency})
                </label>
                <div className="flex items-center bg-secondary rounded-lg p-0.5 border border-border">
                  {(['USD', 'ZiG', 'GBP', 'ZAR'] as const).map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setCurrency(curr)}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                        currency === curr 
                          ? 'bg-primary text-primary-foreground shadow-xs' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Preset Pills */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {currentPresets.map((amt) => {
                  const isSelected = !customAmount && giveAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setGiveAmount(amt);
                        setCustomAmount('');
                      }}
                      className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm' 
                          : 'border-border bg-secondary/40 text-foreground hover:bg-secondary'
                      }`}
                    >
                      {currency === 'USD' ? `$${amt}` : `${currency} ${amt}`}
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount Input */}
              <div className="relative pt-1">
                <span className="absolute left-3.5 top-1/2 pt-0.5 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  {currency}
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Or enter custom amount..."
                  className="w-full bg-secondary border border-border rounded-xl pl-12 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
                />
              </div>
            </div>

            {/* 3. Payment Gateway */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  3. Select Payment Gateway
                </label>
                <button
                  type="button"
                  onClick={() => setShowPaynowConfigModal(true)}
                  className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                >
                  Paynow Settings
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'EcoCash' as PaymentGateway, label: 'EcoCash', icon: Smartphone },
                  { id: 'OneMoney' as PaymentGateway, label: 'OneMoney', icon: Smartphone },
                  { id: 'Paynow' as PaymentGateway, label: 'Paynow Online', icon: Globe },
                  { id: 'Credit Card' as PaymentGateway, label: 'Visa / Card', icon: CreditCard }
                ].map((gate) => {
                  const GateIcon = gate.icon;
                  const isSelected = paymentGateway === gate.id;
                  return (
                    <button
                      key={gate.id}
                      type="button"
                      onClick={() => setPaymentGateway(gate.id)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                        isSelected 
                          ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/40 font-bold' 
                          : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <GateIcon className="w-4 h-4" />
                      <span className="text-xs">{gate.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Moors Alternative Deposit Option */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowMoorsDepositModal(true)}
                  className="w-full py-2 px-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Alternative Direct Transfer / Moors Deposit Reference</span>
                </button>
              </div>
            </div>

            {/* 4. Partner Contact Details */}
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Partner Name
                  </label>
                  <input
                    type="text"
                    required={!isAnonymousDonation}
                    disabled={isAnonymousDonation}
                    value={isAnonymousDonation ? 'Anonymous Partner' : donorFullName}
                    onChange={(e) => setDonorFullName(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Mobile Phone (for EcoCash/Prompt)
                  </label>
                  <input
                    type="tel"
                    required
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    placeholder="e.g. 0772123456"
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              {/* Anonymous Checkbox */}
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={isAnonymousDonation}
                  onChange={(e) => setIsAnonymousDonation(e.target.checked)}
                  className="rounded border-border accent-primary cursor-pointer w-4 h-4"
                />
                <span>Keep donation anonymous on Kingdom Impact screens & bulletins</span>
              </label>
            </div>

            {/* Paynow instructions feedback */}
            {paynowInstruction && (
              <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 text-xs text-foreground space-y-2">
                <p>{paynowInstruction}</p>
                {paynowRedirectUrl && (
                  <a 
                    href={paynowRedirectUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1 font-bold underline text-primary"
                  >
                    Open Paynow checkout
                    <ArrowRight className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* Submit Action */}
            <button
              id="btn-submit-giving"
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-white font-bold text-sm uppercase tracking-wider shadow-md hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Processing Seed Offering...</span>
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 fill-current" />
                  <span>Authorize Giving of {currency} {effectiveAmount}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Ministry Impact & Receipts Column (Right 5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Success Banner if just given */}
          {donationSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center space-y-3 animate-in zoom-in-95">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-base text-foreground">Seed Received with Apostolic Grace!</h4>
                <p className="text-xs text-muted-foreground">
                  Your seed of <strong className="text-foreground">{donationSuccess.currency} {donationSuccess.amount}</strong> for <strong className="text-foreground">{donationSuccess.fund}</strong> has been consecrated.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => StorageService.downloadReceipt(donationSuccess)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Official Receipt</span>
                </button>
              </div>
            </div>
          )}

          {/* Where Your Seed Goes */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
            <h4 className="font-serif-church font-bold text-foreground text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" />
              <span>Where Your Kingdom Seed Goes</span>
            </h4>

            <div className="space-y-2.5 text-xs">
              <div className="bg-secondary/40 p-3 rounded-xl border border-border space-y-1">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <span>📡</span>
                  <span>Global Gospel Broadcasts</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Funding low-data live streaming & radio satellites reaching Zimbabwe and over 14 diaspora nations.
                </p>
              </div>

              <div className="bg-secondary/40 p-3 rounded-xl border border-border space-y-1">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <span>🍲</span>
                  <span>Widows, Orphans & Compassion</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Monthly grocery hampers, medical aid, and school fees for vulnerable families in our communities.
                </p>
              </div>

              <div className="bg-secondary/40 p-3 rounded-xl border border-border space-y-1">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <span>🏛️</span>
                  <span>Belvedere Cathedral Project</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Phase 2 cathedral development and youth auditorium in Belvedere, Harare.
                </p>
              </div>
            </div>

            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs text-foreground flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
              <span className="text-[11px] leading-tight text-foreground/90">
                Official encrypted giving receipts are generated instantly and permanently archived in your profile.
              </span>
            </div>
          </div>

          {/* Bank Transfer Details Box */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm text-xs">
            <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
              Direct Bank & International Seed
            </h4>
            <div className="space-y-1.5 text-muted-foreground text-[11px]">
              <div><strong>Account Name:</strong> Gateway Church International</div>
              <div><strong>Bank:</strong> Stanbic Bank Zimbabwe</div>
              <div><strong>Branch:</strong> Samora Machel Ave, Harare</div>
              <div><strong>FCA Nostro (USD):</strong> 9140003847291</div>
              <div><strong>ZiG Account:</strong> 9140003847302</div>
              <div><strong>Swift Code:</strong> SBICZWHA</div>
            </div>
          </div>

        </div>

      </div>

      {/* Modals */}
      {showMoorsDepositModal && (
        <MoorsDepositModal 
          onClose={() => setShowMoorsDepositModal(false)}
          defaultAmount={effectiveAmount}
          defaultCurrency={currency}
          defaultFund={selectedFund}
          onSuccess={(refId) => {
            alert(`Moors deposit reference recorded: ${refId}. God bless your seed!`);
            setShowMoorsDepositModal(false);
          }}
        />
      )}

      {showPaynowConfigModal && (
        <PaynowConfigModal onClose={() => setShowPaynowConfigModal(false)} />
      )}
    </div>
  );
};
