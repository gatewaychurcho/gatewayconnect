import React, { useState } from 'react';
import { 
  X, 
  Crown, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Calendar, 
  Users, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CommunityGroup, User } from '../../types';
import { StorageService } from '../../services/storageService';
import { PaynowService } from '../../services/paynowService';

interface PaidGroupBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: CommunityGroup | null;
  currentUser: User;
  onJoinSuccess: (groupId: string) => void;
}

export const PaidGroupBillingModal: React.FC<PaidGroupBillingModalProps> = ({
  isOpen,
  onClose,
  group,
  currentUser,
  onJoinSuccess
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'EcoCash' | 'InnBucks' | 'Card'>('EcoCash');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phone || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  if (!isOpen || !group) return null;

  const priceUsd = group.price_usd || 150;
  const durationMonths = group.duration_months || 3;
  const isAdminOrDev = currentUser.role === 'super_admin' || currentUser.role === 'developer';

  const handleEnrollAndPay = async (bypassBilling = false) => {
    setIsProcessing(true);
    setPaymentError(null);

    if (bypassBilling && isAdminOrDev) {
      // Instant administrative access bypass
      StorageService.joinChatGroup(group.id, currentUser.id, priceUsd, true);
      confetti({ particleCount: 50, spread: 80 });
      setIsProcessing(false);
      onJoinSuccess(group.id);
      onClose();
      return;
    }

    try {
      const payment = await PaynowService.initiateTransaction({
        reference: `GCZ-GRP-${Date.now().toString().slice(-8)}`,
        amount: priceUsd,
        additionalInfo: `Enrollment into ${group.name} (${durationMonths} Months)`,
        phone: phoneNumber || currentUser.phone,
        paymentMethod
      });

      if (!payment.success || !payment.pollUrl) {
        setIsProcessing(false);
        setPaymentError(payment.error || 'Payment could not be initiated. You were not billed.');
        return;
      }

      if (payment.browserUrl) {
        window.open(payment.browserUrl, '_blank', 'noopener,noreferrer');
      }

      const result = await PaynowService.waitForPayment(payment.pollUrl);
      if (!result.isPaid) {
        setIsProcessing(false);
        setPaymentError(`Payment status: ${result.status}. Enrollment was not completed.`);
        return;
      }

      // Persist membership
      StorageService.joinChatGroup(group.id, currentUser.id, priceUsd, true);
      confetti({ particleCount: 65, spread: 90 });
      setIsProcessing(false);
      onJoinSuccess(group.id);
      onClose();
    } catch (err: any) {
      setIsProcessing(false);
      setPaymentError(err?.message || 'An unexpected error occurred during billing.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-card border-2 border-amber-400/90 rounded-2xl max-w-md w-full overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.35)] animate-in zoom-in-95 duration-150 my-4 text-foreground relative">
        
        {/* Shimmering Gold Ambient Glow Accent */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-amber-500/25 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header with Shining Gold Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 p-4 text-slate-950 flex items-center justify-between shadow-sm relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-950/20 flex items-center justify-center font-bold">
              <Crown className="w-5 h-5 text-slate-950 fill-current" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest font-black opacity-85">Premium Pro Cell Group</div>
              <h3 className="font-black text-sm leading-tight">Paid Membership Enrollment</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-950/15 hover:bg-slate-950/25 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-950" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-4 relative z-10">
          
          {/* Target Group Info Card */}
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                  {group.category}
                </span>
                <h4 className="font-bold text-sm text-foreground mt-1">{group.name}</h4>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground block font-medium">Term Fee</span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400">${priceUsd} USD</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2">
              {group.description}
            </p>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                {durationMonths} Months Intensive Program
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-primary" />
                {group.member_count} Enrolled Members
              </span>
            </div>
          </div>

          {/* Included Features & Access */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-foreground">What Your Enrollment Unlocks:</span>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Private Fellowship Chat & Direct Mentorship Access</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{durationMonths}-Month curriculum materials & weekly interactive cohorts</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Certificate of Completion from Apostle Joe Daniels & Leadership</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-foreground">Select Payment Method</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['EcoCash', 'InnBucks', 'Card'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    paymentMethod === method
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-xs'
                      : 'bg-secondary/60 text-muted-foreground border-border hover:text-foreground'
                  }`}
                >
                  {method === 'EcoCash' && '⚡ EcoCash'}
                  {method === 'InnBucks' && '🪙 InnBucks'}
                  {method === 'Card' && '💳 Card / Visa'}
                </button>
              ))}
            </div>
          </div>

          {/* Billing Contact Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              {paymentMethod === 'Card' ? 'Billing Contact / Email' : `${paymentMethod} Mobile Number`}
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={paymentMethod === 'Card' ? 'your@email.com' : 'e.g. 0772123456'}
              className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Security Notice */}
          <div className="p-2.5 bg-secondary/40 rounded-xl border border-border flex items-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Encrypted payment processing via Paynow Zimbabwe gateway.</span>
          </div>

          {/* Error Message */}
          {paymentError && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{paymentError}</span>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="space-y-2">
            <button
              id="btn-confirm-paid-group-join"
              type="button"
              disabled={isProcessing}
              onClick={() => handleEnrollAndPay(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer border border-amber-300"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4 fill-current" />
                  <span>Pay ${priceUsd} & Join Group</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Admin / Dev Bypass */}
            {isAdminOrDev && (
              <button
                type="button"
                onClick={() => handleEnrollAndPay(true)}
                className="w-full py-1.5 rounded-lg text-xs font-semibold text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors border border-amber-500/30 cursor-pointer"
              >
                ⚡ Admin / Dev Free Enrollment Bypass
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
