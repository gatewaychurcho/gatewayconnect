import React, { useState } from 'react';
import { ShieldAlert, Inbox, LogOut, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { User } from '../../types';
import { StorageService } from '../../services/storageService';
import confetti from 'canvas-confetti';

interface BannedScreenProps {
  user: User;
  onLogout: () => void;
}

export const BannedScreen: React.FC<BannedScreenProps> = ({ user, onLogout }) => {
  const bannedMap = StorageService.getBannedUsers();
  const banInfo = bannedMap[user.id] || bannedMap[user.phone] || {
    reason: user.ban_reason || 'Violation of Gateway Church community guidelines or administrative restrictions.',
    banned_at: new Date().toISOString(),
    banned_by: 'Lead Developer Desk'
  };

  const [appealReason, setAppealReason] = useState('');
  const [appealSubmitted, setAppealSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitAppeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim()) return;

    setIsSubmitting(true);
    StorageService.submitUnbanAppeal({
      user_id: user.id,
      user_name: user.full_name,
      user_phone: user.phone,
      reason: appealReason.trim()
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setAppealSubmitted(true);
      confetti({ particleCount: 30, spread: 60 });
    }, 400);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-destructive/40 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Ban Badge */}
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto text-destructive shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-destructive font-semibold px-2.5 py-0.5 rounded-full bg-destructive/10 border border-destructive/20">
            Account Suspended
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Access Restricted
          </h2>
          <p className="text-xs text-muted-foreground">
            Gateway Church Zimbabwe & Diaspora Network
          </p>
        </div>

        {/* User Account Info */}
        <div className="bg-secondary/40 rounded-xl p-4 border border-border text-left space-y-2 text-xs">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <span className="text-muted-foreground">Believer:</span>
            <span className="font-semibold text-foreground">{user.full_name} ({user.handle})</span>
          </div>
          <div className="flex justify-between items-center border-b border-border pb-2">
            <span className="text-muted-foreground">Mobile Identifier:</span>
            <span className="font-mono text-foreground">{user.phone}</span>
          </div>
          <div className="flex flex-col gap-1 pt-1">
            <span className="text-destructive font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Suspension Reason:</span>
            </span>
            <p className="text-foreground bg-destructive/10 p-2.5 rounded-lg border border-destructive/20 text-xs italic">
              "{banInfo.reason}"
            </p>
          </div>
        </div>

        {/* Notice */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          While suspended, you cannot access sermons, church community posts, giving, or direct messages.
        </p>

        {/* Appeal Form or Submitted Confirmation */}
        {appealSubmitted ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center space-y-2 text-xs">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-emerald-500">Appeal Submitted to Developer Panel</h4>
            <p className="text-muted-foreground text-[11px]">
              Your appeal has been securely routed to the Developer Desk for credential and policy review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitAppeal} className="text-left space-y-3">
            <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Inbox className="w-3.5 h-3.5 text-primary" />
              <span>Submit Unban Appeal to Developer Desk</span>
            </label>
            <textarea
              required
              rows={3}
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              placeholder="Explain why your account should be reinstated..."
              className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={isSubmitting || !appealReason.trim()}
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Appeal to Developer Desk'}</span>
            </button>
          </form>
        )}

        {/* Switch Account / Logout */}
        <div className="pt-2 border-t border-border">
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out / Switch Account</span>
          </button>
        </div>

      </div>
    </div>
  );
};
