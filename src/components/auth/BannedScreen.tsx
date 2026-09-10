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
    <div className="min-h-screen bg-[#000d1a] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#00172e] border-2 border-red-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Ban Badge */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/50 flex items-center justify-center mx-auto text-red-400 shadow-lg shadow-red-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30">
            Account Suspended
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Access Restricted
          </h2>
          <p className="text-xs text-white/60">
            Gateway Church Zimbabwe & Diaspora Network
          </p>
        </div>

        {/* User Account Info */}
        <div className="bg-[#001122] rounded-2xl p-4 border border-white/10 text-left space-y-2 text-xs">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-white/50">Believer:</span>
            <span className="font-bold text-white">{user.full_name} ({user.handle})</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-white/50">Mobile Identifier:</span>
            <span className="font-mono text-white/90">{user.phone}</span>
          </div>
          <div className="flex flex-col gap-1 pt-1">
            <span className="text-red-400 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Suspension Reason:</span>
            </span>
            <p className="text-white/80 bg-red-950/40 p-2.5 rounded-xl border border-red-500/30 text-xs italic">
              "{banInfo.reason}"
            </p>
          </div>
        </div>

        {/* Notice */}
        <p className="text-xs text-white/50 leading-relaxed">
          While suspended, you cannot access sermons, church community posts, giving, or direct messages.
        </p>

        {/* Appeal Form or Submitted Confirmation */}
        {appealSubmitted ? (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 text-center space-y-2 text-xs">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-emerald-300">Appeal Submitted to Developer Panel</h4>
            <p className="text-white/70 text-[11px]">
              Your appeal has been securely routed to the Developer Desk for credential and policy review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitAppeal} className="text-left space-y-3">
            <label className="block text-xs font-semibold text-white/80 flex items-center gap-1.5">
              <Inbox className="w-3.5 h-3.5 text-amber-400" />
              <span>Submit Unban Appeal to Developer Desk</span>
            </label>
            <textarea
              required
              rows={3}
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              placeholder="Explain why your account should be reinstated..."
              className="w-full bg-[#001122] border border-white/15 rounded-xl p-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400 transition-colors"
            />
            <button
              type="submit"
              disabled={isSubmitting || !appealReason.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-[#001F3F] font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Appeal to Developer Desk'}</span>
            </button>
          </form>
        )}

        {/* Switch Account / Logout */}
        <div className="pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out / Switch Account</span>
          </button>
        </div>

      </div>
    </div>
  );
};
