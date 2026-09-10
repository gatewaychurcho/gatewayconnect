import React, { useState } from 'react';
import { 
  X, 
  Camera, 
  User as UserIcon, 
  Phone, 
  Info, 
  Edit3, 
  Check, 
  Copy, 
  LogOut, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  ArrowLeft,
  KeyRound,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { User } from '../../types';
import { StorageService } from '../../services/storageService';
import { ImagePickerModal } from './ImagePickerModal';
import confetti from 'canvas-confetti';

interface WhatsAppProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
  onOpenSwitchRole?: () => void;
}

export const WhatsAppProfileModal: React.FC<WhatsAppProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onLogout,
  onOpenSwitchRole
}) => {
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(currentUser.full_name);
  const [isEditingAbout, setIsEditingAbout] = useState<boolean>(false);
  const [aboutInput, setAboutInput] = useState<string>(
    currentUser.role === 'super_admin' 
      ? 'Apostle of Jesus Christ • Preaching the Kingdom with power & speed' 
      : 'Available in Christ • Praying without ceasing 🙏'
  );
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSaveName = () => {
    if (!nameInput.trim()) return;
    const updated = StorageService.updateUserProfile({ full_name: nameInput.trim() });
    onUpdateUser(updated);
    setIsEditingName(false);
  };

  const handleSavePhoto = (newAvatarUrl: string) => {
    const updated = StorageService.updateUserProfile({ avatar_url: newAvatarUrl });
    onUpdateUser(updated);
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.5 }
    });
  };

  const handleCopyMemberId = () => {
    navigator.clipboard.writeText(currentUser.member_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#0b141a] text-[#e9edef] border border-[#222e35] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* WhatsApp Top App Bar */}
        <div className="bg-[#202c33] px-4 py-3.5 flex items-center justify-between border-b border-[#2a3942]">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 text-[#aebac1] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-base text-white tracking-wide">
              Profile
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold flex items-center gap-1 transition-all border border-red-500/30"
              title="Log out of account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 text-[#aebac1] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WhatsApp Profile Content Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 bg-[#111b21]">
          
          {/* 1. Large WhatsApp Profile Avatar */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="relative group cursor-pointer" onClick={() => setShowPhotoPicker(true)}>
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-[#202c33] group-hover:border-[#00a884] shadow-xl transition-all bg-[#2a3942] flex items-center justify-center">
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[#aebac1] bg-[#2a3942]">
                    {currentUser.full_name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Camera Action Badge */}
              <button
                type="button"
                className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#02906f] text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
                title="Change Profile Photo"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-[11px] text-[#00a884] font-medium mt-3 flex items-center gap-1">
              <Camera className="w-3 h-3" />
              <span>Tap photo to change or pick from local storage</span>
            </p>
          </div>

          {/* 2. WhatsApp Name Field */}
          <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-[#202c33]/50 border border-[#2a3942]">
            <div className="mt-1 text-[#00a884]">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <span className="text-xs text-[#8696a0] font-medium block">
                Name
              </span>
              
              {isEditingName ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="flex-1 bg-[#111b21] border border-[#00a884] rounded-lg px-2.5 py-1 text-sm text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1.5 rounded-lg bg-[#00a884] text-white hover:bg-[#02906f]"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setNameInput(currentUser.full_name);
                      setIsEditingName(false);
                    }}
                    className="p-1.5 rounded-lg bg-white/10 text-[#8696a0] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#e9edef]">
                    {currentUser.full_name}
                  </span>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-[#8696a0] hover:text-[#00a884] transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <p className="text-[11px] text-[#8696a0] leading-normal pt-1">
                This is not your username or pin. This name will be visible to your Gateway Church contacts.
              </p>
            </div>
          </div>

          {/* 3. WhatsApp About / Ministry Bio */}
          <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-[#202c33]/50 border border-[#2a3942]">
            <div className="mt-1 text-[#00a884]">
              <Info className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <span className="text-xs text-[#8696a0] font-medium block">
                About & Status
              </span>

              {isEditingAbout ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={aboutInput}
                    onChange={(e) => setAboutInput(e.target.value)}
                    className="flex-1 bg-[#111b21] border border-[#00a884] rounded-lg px-2.5 py-1 text-sm text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsEditingAbout(false)}
                    className="p-1.5 rounded-lg bg-[#00a884] text-white hover:bg-[#02906f]"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#d1d7db] italic">
                    "{aboutInput}"
                  </span>
                  <button
                    onClick={() => setIsEditingAbout(true)}
                    className="p-1 text-[#8696a0] hover:text-[#00a884] transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 4. WhatsApp Phone */}
          <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-[#202c33]/50 border border-[#2a3942]">
            <div className="mt-1 text-[#00a884]">
              <Phone className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-0.5">
              <span className="text-xs text-[#8696a0] font-medium block">
                Phone
              </span>
              <span className="text-sm font-semibold text-[#e9edef] font-mono">
                {currentUser.phone}
              </span>
            </div>
          </div>

          {/* 5. Covenant Partner Credentials */}
          <div className="p-3.5 rounded-2xl bg-[#202c33] border border-[#2a3942] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#00a884] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Covenant Member ID</span>
              </span>
              <button
                onClick={handleCopyMemberId}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#8696a0] hover:text-white px-2 py-0.5 rounded bg-[#111b21] border border-white/5"
              >
                {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId ? 'Copied' : currentUser.member_id}</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#2a3942]">
              <span className="text-[#8696a0]">Assigned Role:</span>
              <span className="font-bold text-[#D4AF37] uppercase">
                {currentUser.role === 'super_admin' ? 'Apostle / Super Admin' : currentUser.role}
              </span>
            </div>
          </div>

          {/* 6. Quick Photo Update & Log Out Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => setShowPhotoPicker(true)}
              className="w-full py-3 rounded-2xl bg-[#202c33] hover:bg-[#2a3942] text-white text-xs font-bold flex items-center justify-center gap-2 border border-[#2a3942] transition-all"
            >
              <Camera className="w-4 h-4 text-[#00a884]" />
              <span>Change Profile Photo (Local Device or Gallery)</span>
            </button>

            <button
              id="btn-whatsapp-logout"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full py-3.5 rounded-2xl bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 text-xs font-bold flex items-center justify-center gap-2 border border-red-500/40 transition-all shadow-md"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out of Account</span>
            </button>
          </div>

        </div>

        {/* Log Out Confirmation Dialog */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#202c33] border border-[#2a3942] rounded-2xl max-w-xs w-full p-5 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Log Out?</h4>
                <p className="text-xs text-[#8696a0] mt-1">
                  Are you sure you want to log out of {currentUser.full_name}? You can log back in anytime with your phone number.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#111b21] text-[#8696a0] hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    onLogout();
                    onClose();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Picker Modal for Profile Picture */}
        <ImagePickerModal
          isOpen={showPhotoPicker}
          onClose={() => setShowPhotoPicker(false)}
          onSelectImage={handleSavePhoto}
          currentImage={currentUser.avatar_url}
          title="Update Profile Photo"
          subtitle="Select a photo from your local device storage or pick an authentic photo from Apostle Joe Daniels gallery."
        />

      </div>
    </div>
  );
};
