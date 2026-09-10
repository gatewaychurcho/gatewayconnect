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
  const [selectedTier, setSelectedTier] = useState<'pillar' | 'ambassador'>('pillar');
  const [isProcessing, setIsProcessing] = useState(false);
  const [upgradedSuccess, setUpgradedSuccess] = useState(false);

  if (!isOpen) return null;

  const tiers = [
    {
      id: 'pillar' as const,
      name: 'Kingdom Pillar',
      price: '$25 / month',
      badge: 'Blue Verified',
      perks: [
        'Facebook-style blue verified badge on all comments & posts',
        'Automatic background sermon offline pre-caching',
        'Priority scheduling for 1-on-1 pastoral consultations',
        'Direct monthly ministerial prayer impartation letter'
      ]
    },
    {
      id: 'ambassador' as const,
      name: 'Global Ambassador',
      price: '$100 / month',
      badge: 'Gold Verified',
      perks: [
        'Facebook-style gold verified badge honoring senior kingdom partners',
        'Direct prophetic intake via ministry WhatsApp (+263780699988)',
        'Unlimited offline sermon & worship audio/video library',
        'Private quarterly zoom fellowship with Apostle Joe Daniels',
        'All Kingdom Pillar benefits included'
      ]
    }
  ];

  const handleUpgrade = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const isGold = selectedTier === 'ambassador';
      const updated = StorageService.updateUserProfile({
        is_verified: true,
        badge_type: isGold ? 'gold' : 'blue',
        role: currentUser.role === 'guest' ? 'member' : currentUser.role
      });
      if (onUpdateUser) onUpdateUser(updated);
      setIsProcessing(false);
      setUpgradedSuccess(true);
      confetti({ particleCount: 50, spread: 80, origin: { y: 0.5 } });
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#001122]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#001F3F] border border-[#D4AF37]/60 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 my-4 text-white">
        
        {/* Header */}
        <div className="bg-[#001122] p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37] text-[#001F3F] flex items-center justify-center font-black shadow">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Upgrade Covenant Partnership
              </h3>
              <p className="text-[11px] text-[#D4AF37]">
                Elevate your fellowship and unlock kingdom privileges
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {upgradedSuccess ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 text-[#D4AF37] border border-[#D4AF37]/50 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">Membership Upgraded!</h4>
              <p className="text-xs text-white/70 max-w-xs mx-auto">
                Your partnership status is now active with the verified rosette badge and offline streaming privileges.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-[#D4AF37] text-[#001F3F] font-bold text-xs rounded-xl"
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
                        ? 'bg-[#001122] border-[#D4AF37] shadow-lg ring-1 ring-[#D4AF37]'
                        : 'bg-[#001122]/60 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-white/30'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-[#001F3F] stroke-[3]" />}
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-white">{t.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-semibold">
                          {t.badge}
                        </span>
                      </div>
                      <span className="font-bold text-xs text-[#D4AF37]">{t.price}</span>
                    </div>

                    <ul className="space-y-1 pl-6 pt-1 text-[11px] text-white/70">
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

            {/* Payment Guarantee Notice */}
            <div className="p-2.5 bg-[#001122] rounded-xl border border-white/10 flex items-center gap-2 text-[11px] text-white/60">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>Supports EcoCash, Paynow Zimbabwe, and International Cards with secure confirmation.</span>
            </div>

            {/* Action CTA */}
            <button
              id="btn-confirm-upgrade"
              disabled={isProcessing}
              onClick={handleUpgrade}
              className="w-full py-3 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2f] text-[#001F3F] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-[#001F3F] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Activate {selectedTier === 'ambassador' ? 'Global Ambassador' : 'Kingdom Pillar'}</span>
                </>
              )}
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
