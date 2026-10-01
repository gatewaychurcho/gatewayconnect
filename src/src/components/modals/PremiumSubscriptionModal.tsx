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
import { PaynowService } from '../../services/paynowService';
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

  const handleSubscribe = async () => {
    if (isGuest) {
      onClose();
      onRequireAuth?.();
      return;
    }

    setIsProcessing(true);
    const payment = await PaynowService.initiateTransaction({
      reference: `GCZ-PREMIUM-${Date.now().toString().slice(-8)}`,
      amount: selectedPlan.priceUsd,
      additionalInfo: `Gateway Premium ${selectedPlan.title}`,
      phone,
      paymentMethod: paymentMethod === 'EcoCash' ? 'EcoCash' : 'Card'
    });
    if (!payment.success || !payment.pollUrl) {
      setIsProcessing(false);
      setSuccessMessage(payment.error || 'Payment could not be started. Premium was not activated.');
      return;
    }
    if (payment.browserUrl) window.open(payment.browserUrl, '_blank', 'noopener,noreferrer');
    const result = await PaynowService.waitForPayment(payment.pollUrl);
    if (!result.isPaid) {
      setIsProcessing(false);
      setSuccessMessage(`Payment status: ${result.status}. Premium was not activated.`);
      return;
    }
    {
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
    }
  };

  const handleUnlockSingleSermon = async () => {
    if (isGuest) {
      onClose();
      onRequireAuth?.();
      return;
    }

    if (!targetSermon) return;
    setIsProcessing(true);
    const payment = await PaynowService.initiateTransaction({
      reference: `GCZ-SERMON-${Date.now().toString().slice(-8)}`,
      amount: targetSermon.unlock_price_usd || 5,
      additionalInfo: `Sermon unlock - ${targetSermon.title}`,
      phone,
      paymentMethod: paymentMethod === 'EcoCash' ? 'EcoCash' : 'Card'
    });
    if (!payment.success || !payment.pollUrl) {
      setIsProcessing(false);
      setSuccessMessage(payment.error || 'Payment could not be started. Sermon was not unlocked.');
      return;
    }
    if (payment.browserUrl) window.open(payment.browserUrl, '_blank', 'noopener,noreferrer');
    const result = await PaynowService.waitForPayment(payment.pollUrl);
    if (!result.isPaid) {
      setIsProcessing(false);
      setSuccessMessage(`Payment status: ${result.status}. Sermon was not unlocked.`);
      return;
    }
    {
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
    }
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
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-card border border-primary/40 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl space-y-4 my-auto relative animate-in fade-in zoom-in-95 duration-200 text-foreground">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground shadow-xs">
            <Crown className="w-6 h-6" />
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-1">
            <h3 className="font-serif-church font-bold text-xl sm:text-2xl text-foreground">
              Gateway Premium Partner
            </h3>
            <VerifiedBadge type="blue" size="md" />
          </div>

          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Unlock all full-length apostolic masterclasses by Apostle Joe Daniels, receive the official <strong className="text-primary">Blue Verified Badge</strong>, and partner with the ministry.
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center space-y-1 animate-pulse">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
            <p className="text-xs font-bold text-emerald-500">{successMessage}</p>
          </div>
        )}

        {/* If opening from a specific locked sermon: Quick 1-Sermon Unlock Option */}
        {targetSermon && (
          <div className="bg-secondary/40 border border-primary/30 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                Single Sermon Pass
              </span>
              <span className="text-sm font-bold text-primary">
                ${targetSermon.unlock_price_usd || 5} USD
              </span>
            </div>

            <div>
              <h4 className="text-xs font-bold text-foreground line-clamp-1">{targetSermon.title}</h4>
              <p className="text-[11px] text-muted-foreground">Unlock full audio & video access for just this message</p>
            </div>

            <button
              id="btn-unlock-single-sermon"
              onClick={handleUnlockSingleSermon}
              disabled={isProcessing}
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
            >
              <Unlock className="w-4 h-4" />
              <span>{isProcessing ? 'Processing...' : `Unlock This Sermon for $${targetSermon.unlock_price_usd || 5}`}</span>
            </button>
          </div>
        )}

        {/* Subscription Plans Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Choose Subscription Duration</span>
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
                className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditingPrices ? 'Cancel Edit' : 'Edit Plan Prices'}</span>
              </button>
            )}
          </div>

          {/* Admin Price Editor Mode */}
          {isEditingPrices && isAdmin && (
            <div className="p-3 bg-secondary/40 border border-primary/30 rounded-xl space-y-2 text-xs">
              <p className="font-bold text-primary">Admin Price Configuration (USD)</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5">3 Months</label>
                  <input
                    type="number"
                    value={editPrice3m}
                    onChange={(e) => setEditPrice3m(Number(e.target.value))}
                    className="w-full bg-secondary border border-border rounded-lg p-1.5 text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5">6 Months</label>
                  <input
                    type="number"
                    value={editPrice6m}
                    onChange={(e) => setEditPrice6m(Number(e.target.value))}
                    className="w-full bg-secondary border border-border rounded-lg p-1.5 text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5">1 Year</label>
                  <input
                    type="number"
                    value={editPrice1y}
                    onChange={(e) => setEditPrice1y(Number(e.target.value))}
                    className="w-full bg-secondary border border-border rounded-lg p-1.5 text-xs text-foreground"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSaveAdminPrices}
                className="w-full py-1.5 bg-primary text-primary-foreground rounded-lg font-semibold text-xs flex items-center justify-center gap-1 shadow-xs"
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
                  className={`p-3 rounded-xl text-left border transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-secondary/70 border-primary shadow-xs ring-1 ring-primary'
                      : 'bg-secondary/30 border-border hover:border-primary/40'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-2.5 right-2 px-2 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold uppercase rounded-full shadow-xs">
                      Popular
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{plan.durationMonths} Months</span>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="text-lg font-bold text-primary mt-1">
                      ${plan.priceUsd}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      ≈ {plan.priceZig} ZiG
                    </div>
                  </div>

                  <div className="text-[10px] text-muted-foreground pt-2 border-t border-border mt-2">
                    {plan.savings || `${Math.round(plan.priceUsd / plan.durationMonths)}/mo`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Benefits Checklist */}
        <div className="bg-secondary/30 rounded-xl p-3.5 border border-border space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
            <span><strong className="text-foreground">Blue Verified Badge</strong> next to your name across the platform</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
            <span>Unrestricted access to all Apostle Joe Daniels sermons & series</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
            <span>Exclusive study notes & downloadable ministry audio</span>
          </div>
        </div>

        {/* Payment Account Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Direct EcoCash Account</span>
            <span className="font-mono font-bold text-primary">0771445642</span>
          </div>

          <button
            id="btn-confirm-subscription"
            onClick={handleSubscribe}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm uppercase tracking-wider shadow-xs hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
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
