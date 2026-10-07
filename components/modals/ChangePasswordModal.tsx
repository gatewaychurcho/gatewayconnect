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
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-5 sm:p-6 shadow-xl relative text-foreground animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-secondary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
          <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-primary">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-foreground">Change Account Password</h2>
            <p className="text-xs text-muted-foreground">Secure your Gateway covenant credentials</p>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-foreground/90 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-foreground/90 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Enter new password (min. 4 characters)"
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-foreground/90 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs uppercase tracking-wider rounded-lg shadow-xs transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Updating Password...' : 'Save New Password'}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Encrypted under Gateway Church Security Policy</span>
        </div>
      </div>
    </div>
  );
};
