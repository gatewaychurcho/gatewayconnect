import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Crown, 
  Check, 
  ShieldCheck, 
  Zap, 
  CreditCard, 
  Lock, 
  Unlock, 
  Clock,
  ArrowRight,
  Smartphone,
  CheckCircle2,
  Edit2,
  Save
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, Sermon, PremiumPlan } from '../../types';
import { StorageService } from '../../services/storageService';
import { VerifiedBadge } from '../common/VerifiedBadge';

interface PremiumSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser: (user: User) => void;
  targetSermon?: Sermon | null;
  onSermonUnlocked?: (sermonId: string) => void;
  onRequireAuth?: () => void;
}

export const PremiumSubscriptionModal: React.FC<PremiumSubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  targetSermon,
  onSermonUnlocked,
  onRequireAuth
}) => {
  const [plans, setPlans] = useState<PremiumPlan[]>(StorageService.getPremiumPlans());
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan_6m');
  const [phone, setPhone] = useState<string>(currentUser.phone || '0772123456');
  const [paymentMethod, setPaymentMethod] = useState<'EcoCash' | 'Card' | 'InApp'>('EcoCash');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Admin price editing state
  const [isEditingPrices, setIsEditingPrices] = useState<boolean>(false);
  const [editPrice3m, setEditPrice3m] = useState<number>(30);
  const [editPrice6m, setEditPrice6m] = useState<number>(60);
  const [editPrice1y, setEditPrice1y] = useState<number>(120);

  if (!isOpen) return null;

  const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'developer';
  const isGuest = currentUser.role === 'guest';
  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[1] || plans[0];

  const handleSubscribe = () => {
    if (isGuest) {
      onClose();
      onRequireAuth?.();
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const updatedUser = StorageService.subscribePremium(selectedPlan.durationMonths);
      onUpdateUser(updatedUser);
      setIsProcessing(false);
      setSuccessMessage(`Congratulations! You are now a Blue-Verified Premium Partner with ${selectedPlan.title}!`);
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2000);
    }, 1000);
  };

  const handleUnlockSingleSermon = () => {
    if (isGuest) {
      onClose();
      onRequireAuth?.();
      return;
    }

    if (!targetSermon) return;
    setIsProcessing(true);
    setTimeout(() => {
      const updatedUser = StorageService.unlockSermon(targetSermon.id);
      onUpdateUser(updatedUser);
      onSermonUnlocked?.(targetSermon.id);
      setIsProcessing(false);
      setSuccessMessage(`Unlocked "${targetSermon.title}"! Enjoy the full apostolic message.`);
      confetti({ particleCount: 30, spread: 60 });
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1800);
    }, 800);
  };

  const handleSaveAdminPrices = () => {
    const updated = plans.map(p => {
      if (p.durationMonths === 3) return { ...p, priceUsd: editPrice3m, priceZig: Math.round(editPrice3m * 14.8) };
      if (p.durationMonths === 6) return { ...p, priceUsd: editPrice6m, priceZig: Math.round(editPrice6m * 14.8) };
      if (p.durationMonths === 12) return { ...p, priceUsd: editPrice1y, priceZig: Math.round(editPrice1y * 14.8) };
      return p;
    });
    setPlans(updated);
    StorageService.updatePremiumPlans(updated);
    setIsEditingPrices(false);
    confetti({ particleCount: 15, spread: 40 });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#001122]/85 backdrop-blur-md flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-[#001F3F] border-2 border-[#D4AF37] rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-300 to-yellow-200 text-slate-950 shadow-lg shadow-amber-500/30">
            <Crown className="w-6 h-6" />
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-1">
            <h3 className="font-serif-church font-bold text-xl sm:text-2xl text-white">
              Gateway Premium Partner
            </h3>
            <VerifiedBadge type="blue" size="md" />
          </div>

          <p className="text-xs text-white/70 max-w-sm mx-auto leading-relaxed">
            Unlock all full-length apostolic masterclasses by Apostle Joe Daniels, receive the official <strong className="text-sky-300">Blue Verified Badge</strong>, and partner with the ministry.
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-400 rounded-2xl text-center space-y-1 animate-pulse">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
            <p className="text-xs font-bold text-emerald-200">{successMessage}</p>
          </div>
        )}

        {/* If opening from a specific locked sermon: Quick 1-Sermon Unlock Option */}
        {targetSermon && (
          <div className="bg-[#001122]/90 border border-amber-500/50 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                Single Sermon Pass
              </span>
              <span className="text-sm font-black text-[#D4AF37]">
                ${targetSermon.unlock_price_usd || 5} USD
              </span>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white line-clamp-1">{targetSermon.title}</h4>
              <p className="text-[11px] text-white/60">Unlock full audio & video access for just this message</p>
            </div>

            <button
              id="btn-unlock-single-sermon"
              onClick={handleUnlockSingleSermon}
              disabled={isProcessing}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
            >
              <Unlock className="w-4 h-4" />
              <span>{isProcessing ? 'Processing...' : `Unlock This Sermon for $${targetSermon.unlock_price_usd || 5}`}</span>
            </button>
          </div>
        )}

        {/* Subscription Plans Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/80">Choose Subscription Duration</span>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  if (!isEditingPrices) {
                    setEditPrice3m(plans.find(p => p.durationMonths === 3)?.priceUsd || 30);
                    setEditPrice6m(plans.find(p => p.durationMonths === 6)?.priceUsd || 60);
                    setEditPrice1y(plans.find(p => p.durationMonths === 12)?.priceUsd || 120);
                  }
                  setIsEditingPrices(!isEditingPrices);
                }}
                className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1 font-bold"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditingPrices ? 'Cancel Edit' : 'Edit Plan Prices'}</span>
              </button>
            )}
          </div>

          {/* Admin Price Editor Mode */}
          {isEditingPrices && isAdmin && (
            <div className="p-3 bg-[#001122] border border-[#D4AF37]/50 rounded-2xl space-y-2 text-xs">
              <p className="font-bold text-[#D4AF37]">Admin Price Configuration (USD)</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-white/60 block mb-0.5">3 Months</label>
                  <input
                    type="number"
                    value={editPrice3m}
                    onChange={(e) => setEditPrice3m(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/60 block mb-0.5">6 Months</label>
                  <input
                    type="number"
                    value={editPrice6m}
                    onChange={(e) => setEditPrice6m(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/60 block mb-0.5">1 Year</label>
                  <input
                    type="number"
                    value={editPrice1y}
                    onChange={(e) => setEditPrice1y(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSaveAdminPrices}
                className="w-full py-1.5 bg-[#D4AF37] text-slate-950 rounded-lg font-bold text-xs flex items-center justify-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save New Pricing</span>
              </button>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {plans.map(plan => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <button
                  type="button"
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-3 rounded-2xl text-left border-2 transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#001122] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 scale-[1.02]'
                      : 'bg-[#001122]/60 border-white/10 hover:border-white/20'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-2.5 right-2 px-2 py-0.5 bg-[#D4AF37] text-slate-950 text-[9px] font-black uppercase rounded-full shadow">
                      Popular
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{plan.durationMonths} Months</span>
                      {isSelected && <Check className="w-4 h-4 text-[#D4AF37]" />}
                    </div>
                    <div className="text-lg font-black text-[#D4AF37] mt-1">
                      ${plan.priceUsd}
                    </div>
                    <div className="text-[10px] text-white/50">
                      ≈ {plan.priceZig} ZiG
                    </div>
                  </div>

                  <div className="text-[10px] text-white/70 pt-2 border-t border-white/5 mt-2">
                    {plan.savings || `${Math.round(plan.priceUsd / plan.durationMonths)}/mo`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Benefits Checklist */}
        <div className="bg-[#001122]/70 rounded-2xl p-3.5 border border-white/5 space-y-1.5 text-xs text-white/80">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
            <span><strong className="text-sky-300">Blue Verified Badge</strong> next to your name across the platform</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
            <span>Unrestricted access to all Apostle Joe Daniels sermons & series</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
            <span>Exclusive study notes & downloadable ministry audio</span>
          </div>
        </div>

        {/* Payment Account Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-white/80">
            <span className="font-semibold">Direct EcoCash Account</span>
            <span className="font-mono font-bold text-[#D4AF37]">0771445642</span>
          </div>

          <button
            id="btn-confirm-subscription"
            onClick={handleSubscribe}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#f5d97f] to-[#D4AF37] text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-[#D4AF37]/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>
              {isProcessing
                ? 'Activating Subscription...'
                : `Subscribe for $${selectedPlan.priceUsd} (${selectedPlan.durationMonths} Months)`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
