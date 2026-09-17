import React, { useState } from 'react';
import { 
  X, 
  Crown, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  CreditCard, 
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StorageService } from '../../services/storageService';
import { User } from '../../types';
import { PaynowService } from '../../services/paynowService';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser?: (updated: User) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser
}) => {
  const [selectedTier, setSelectedTier] = useState<'silver' | 'pillar' | 'ambassador'>('pillar');
  const [paymentMethod, setPaymentMethod] = useState<'EcoCash' | 'InnBucks' | 'Card'>('EcoCash');
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phone || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [upgradedSuccess, setUpgradedSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  if (!isOpen) return null;

  const tiers = [
    {
      id: 'silver' as const,
      name: 'Kingdom Partner',
      price: '$10 / month',
      amount: 10,
      badge: 'Silver Verified',
      badgeType: 'silver' as const,
      perks: [
        'Silver rosette verified badge on your profile & contributions',
        'Full unlocked access to all Sermon Archive & Video Messages',
        'Offline audio & video sermon downloading privileges',
        'Daily apostolic prayer declarations'
      ]
    },
    {
      id: 'pillar' as const,
      name: 'Kingdom Pillar',
      price: '$25 / month',
      amount: 25,
      badge: 'Blue Verified',
      badgeType: 'blue' as const,
      perks: [
        'Facebook-style blue verified badge on all comments & posts',
        'Full unlocked access to all Sermon Archive & Video Messages',
        'Automatic background sermon offline pre-caching',
        'Priority scheduling for 1-on-1 pastoral consultations',
        'Direct monthly ministerial prayer impartation letter'
      ]
    },
    {
      id: 'ambassador' as const,
      name: 'Global Ambassador',
      price: '$100 / month',
      amount: 100,
      badge: 'Gold Verified',
      badgeType: 'gold' as const,
      perks: [
        'Facebook-style gold verified badge honoring senior kingdom partners',
        'Full unlocked access to all Sermon Archive & Video Messages',
        'Direct prophetic intake via ministry WhatsApp (+263780699988)',
        'Unlimited offline sermon & worship audio/video library',
        'Private quarterly zoom fellowship with Apostle Joe Daniels',
        'All Kingdom Pillar benefits included'
      ]
    }
  ];

  const currentTierObj = tiers.find(t => t.id === selectedTier) || tiers[1];

  const handleUpgrade = async () => {
    setIsProcessing(true);
    setPaymentError(null);
    const amount = currentTierObj.amount;
    const payment = await PaynowService.initiateTransaction({
      reference: `GCZ-BADGE-${Date.now().toString().slice(-8)}`,
      amount,
      additionalInfo: `${currentTierObj.name} Verified Badge (${currentTierObj.badge})`,
      phone: phoneNumber || currentUser.phone,
      paymentMethod
    });

    if (!payment.success || !payment.pollUrl) {
      setIsProcessing(false);
      setPaymentError(payment.error || 'Payment could not be started. Badge was not activated.');
      return;
    }

    if (payment.browserUrl) window.open(payment.browserUrl, '_blank', 'noopener,noreferrer');
    const result = await PaynowService.waitForPayment(payment.pollUrl);
    if (!result.isPaid) {
      setIsProcessing(false);
      setPaymentError(`Payment status: ${result.status}. Badge was not activated.`);
      return;
    }

    const badge = currentTierObj.badgeType;
    const updated = StorageService.purchaseBadge(badge, 1);
    if (updated && onUpdateUser) onUpdateUser(updated);
    setIsProcessing(false);
    setUpgradedSuccess(true);
    confetti({ particleCount: 60, spread: 80, origin: { y: 0.5 } });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full overflow-hidden shadow-xl animate-in zoom-in-95 duration-150 my-4 text-foreground">
        
        {/* Header */}
        <div className="bg-secondary/40 p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                Upgrade Covenant Partnership
              </h3>
              <p className="text-[11px] text-primary font-medium">
                Elevate your fellowship and unlock kingdom privileges
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {upgradedSuccess ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-foreground">Membership Upgraded!</h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Your partnership status is now active with the verified rosette badge and offline streaming privileges.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-lg shadow-xs hover:bg-primary/90 transition-colors"
            >
              Back to Profile
            </button>
          </div>
        ) : (
          <div className="p-4 sm:p-5 space-y-4">
            
            {/* Tiers Selection */}
            <div className="space-y-2.5">
              {tiers.map(t => {
                const isSelected = selectedTier === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTier(t.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-secondary/70 border-primary shadow-xs ring-1 ring-primary'
                        : 'bg-secondary/30 border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-primary bg-primary' : 'border-border'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground stroke-[3]" />}
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-foreground">{t.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                          {t.badge}
                        </span>
                      </div>
                      <span className="font-bold text-xs text-primary">{t.price}</span>
                    </div>

                    <ul className="space-y-1 pl-6 pt-1 text-[11px] text-muted-foreground">
                      {t.perks.map((p, i) => (
                        <li key={i} className="list-disc leading-tight">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['EcoCash', 'InnBucks', 'Card'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      paymentMethod === method
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-secondary/60 text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    {method === 'EcoCash' && '⚡ EcoCash'}
                    {method === 'InnBucks' && '🪙 InnBucks'}
                    {method === 'Card' && '💳 Visa / Card'}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile / Card Details */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                {paymentMethod === 'Card' ? 'Billing Contact / Email' : `${paymentMethod} Mobile Number`}
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={paymentMethod === 'Card' ? 'your@email.com' : 'e.g. 0772123456'}
                className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {/* Payment Guarantee Notice */}
            <div className="p-2.5 bg-secondary/40 rounded-xl border border-border flex items-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>Instant activation upon payment completion. Valid for 30 days renewal cycle.</span>
            </div>

            {/* Action CTA */}
            {paymentError && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                {paymentError}
              </div>
            )}
            <button
              id="btn-confirm-upgrade"
              disabled={isProcessing}
              onClick={handleUpgrade}
              className="w-full py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Activate {currentTierObj.name} ({currentTierObj.price})</span>
                </>
              )}
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
