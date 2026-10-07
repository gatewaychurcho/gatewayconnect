import React, { useState, useEffect } from 'react';
import { X, Camera, Edit3, Check, Copy, LogOut, Shield, Phone } from 'lucide-react';
import { User } from '../../types';
import { StorageService } from '../../services/storageService';
import { ImagePickerModal } from './ImagePickerModal';

interface WhatsAppProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
}

export const WhatsAppProfileModal: React.FC<WhatsAppProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onLogout
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.full_name);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setName(currentUser.full_name);
  }, [currentUser.full_name]);

  if (!isOpen) return null;

  const saveName = () => {
    if (!name.trim()) return;
    const updatedUser = StorageService.updateUserProfile({ full_name: name.trim() });
    onUpdateUser(updatedUser);
    setIsEditing(false);
  };

  const savePhoto = (url: string) => {
    const updatedUser = StorageService.updateUserProfile({ avatar_url: url });
    onUpdateUser(updatedUser);
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(currentUser.member_id);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <>
      <style>{`
        @keyframes modal-enter {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes border-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes text-shine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .anim-modal { animation: modal-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .anim-border { animation: border-glow 3s ease-in-out infinite; }
        
        .text-gradient-credit {
          background: linear-gradient(90deg, rgb(244, 114, 182), rgb(192, 132, 252), rgb(34, 211, 238), rgb(192, 132, 252), rgb(244, 114, 182));
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: text-shine 4s linear infinite;
        }
      `}</style>

      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Compact Modal Container */}
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="relative w-full max-w-[380px] rounded-2xl bg-card border border-border shadow-2xl overflow-hidden anim-modal text-foreground"
        >
          {/* Header / Avatar Section */}
          <div className="relative pt-8 pb-6 flex flex-col items-center">
            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 border border-border flex items-center justify-center transition-all active:scale-90"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Avatar */}
            <div className="relative mb-4">
              <div className="relative w-24 h-24 rounded-full p-[2px] bg-primary/40">
                <img 
                  src={currentUser.avatar_url} 
                  className="w-full h-full rounded-full object-cover border-2 border-card" 
                  alt="Profile" 
                />
              </div>
              <button 
                onClick={() => setIsPickerOpen(true)}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-secondary/80 transition-colors active:scale-90 shadow-sm"
              >
                <Camera className="w-3.5 h-3.5 text-foreground" />
              </button>
            </div>

            {/* Name & Role */}
            <div className="text-center px-6 w-full">
              {isEditing ? (
                <div className="flex gap-2 justify-center items-center">
                  <input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && saveName()}
                    className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2 text-foreground text-sm text-center outline-hidden focus:border-primary transition-colors" 
                    autoFocus
                  />
                  <button 
                    onClick={saveName} 
                    className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs active:scale-90 transition-transform"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-foreground">{currentUser.full_name}</h1>
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="w-6 h-6 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors active:scale-90"
                    >
                      <Edit3 className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-[10px] text-primary font-semibold tracking-[0.2em] uppercase">{currentUser.role}</p>
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="px-5 space-y-3">
            {/* Member ID */}
            <div className="bg-secondary/50 hover:bg-secondary border border-border rounded-xl p-3.5 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground font-semibold tracking-wider uppercase">Member ID</p>
                  <p className="text-sm font-mono text-foreground mt-0.5">{currentUser.member_id}</p>
                </div>
              </div>
              <button 
                onClick={handleCopyId} 
                className="w-8 h-8 rounded-lg bg-secondary hover:bg-secondary/80 border border-border flex items-center justify-center transition-all active:scale-90"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
            </div>

            {/* Phone */}
            <div className="bg-secondary/50 hover:bg-secondary border border-border rounded-xl p-3.5 flex items-center gap-3 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Phone className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground font-semibold tracking-wider uppercase">Phone Number</p>
                <p className="text-sm text-foreground mt-0.5">{currentUser.phone}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button 
              onClick={onLogout} 
              className="w-full h-11 rounded-xl bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-destructive text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> 
              LOGOUT
            </button>
          </div>

          <div className="mt-6 pt-4 pb-5 border-t border-border flex flex-col items-center gap-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
              Gateway Connect Zimbabwe
            </p>
          </div>

        </div>
      </div>
      
      <ImagePickerModal 
        isOpen={isPickerOpen} 
        onClose={() => setIsPickerOpen(false)} 
        onSelectImage={savePhoto} 
        currentImage={currentUser.avatar_url} 
        title="Update Avatar" 
        subtitle="Choose a new profile picture" 
      />
    </>
  );
};
