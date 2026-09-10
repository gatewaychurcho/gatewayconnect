import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { User } from '../../types';
import confetti from 'canvas-confetti';

interface ChangePasswordModalProps {
  currentUser: User;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  currentUser,
  onClose,
  onSuccess
}) => {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newPass || newPass.trim().length < 4) {
      setErrorMsg('New password must be at least 4 characters long.');
      return;
    }

    if (newPass !== confirmPass) {
      setErrorMsg('New passwords do not match. Please retype carefully.');
      return;
    }

    setIsSubmitting(true);
    const res = StorageService.changePassword(currentUser.id, currentPass, newPass);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg('Your account password has been successfully updated!');
      confetti({ particleCount: 30, spread: 60 });
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } else {
      setErrorMsg(res.error || 'Failed to change password. Verify your current password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#001F3F] border border-[#D4AF37]/50 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative text-white animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/50 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#001122] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-white">Change Account Password</h2>
            <p className="text-xs text-white/60">Secure your Gateway covenant credentials</p>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-200">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-white/80 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-[#001122] border border-white/20 rounded-xl px-3 py-2.5 pr-10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-white/80 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Enter new password (min. 4 characters)"
                className="w-full bg-[#001122] border border-white/20 rounded-xl px-3 py-2.5 pr-10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-white/80 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full bg-[#001122] border border-white/20 rounded-xl px-3 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#C59B27] text-[#001F3F] font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Updating Password...' : 'Save New Password'}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-[11px] text-white/50">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Encrypted under Gateway Church Security Policy</span>
        </div>
      </div>
    </div>
  );
};
