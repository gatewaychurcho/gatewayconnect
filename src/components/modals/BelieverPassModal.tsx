import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  QrCode, 
  Download, 
  Edit3,
  Calendar,
  Heart
} from 'lucide-react';
import { User } from '../../types';
import { StorageService } from '../../services/storageService';
import { VerifiedBadge } from '../common/VerifiedBadge';
import confetti from 'canvas-confetti';

interface BelieverPassModalProps {
  user: User;
  onClose: () => void;
  onOpenOnboarding?: () => void;
}

export const BelieverPassModal: React.FC<BelieverPassModalProps> = ({
  user,
  onClose,
  onOpenOnboarding
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.member_id || 'GCZ-MEM-2026');
    setCopiedId(true);
    confetti({ particleCount: 20, spread: 40 });
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `✝️ *GATEWAY CHURCH BELIEVER DIGITAL PASS*\n` +
      `👤 *Believer:* ${user.full_name} (${user.handle || '@believer'})\n` +
      `🆔 *Member ID:* ${user.member_id || 'GCZ-MEM-2026'}\n` +
      `📍 *Assembly City:* ${user.location || user.city_location || 'Harare, Zimbabwe'}\n` +
      `🕊️ *Spiritual Overseer:* Apostle Joe Daniels\n` +
      `⚡ *Ministry Platform:* https://gatewayconnect.joedaniels.org\n` +
      `"Walking in divine acceleration & supernatural dominion!"`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyShareLink = () => {
    const url = `https://gatewayconnect.joedaniels.org/?member=${encodeURIComponent(user.member_id || user.id)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formattedDate = user.created_at 
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '2026';

  return (
    <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden my-auto space-y-4">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Official Believer Credential
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* The Digital Pass Card (Physical-style Membership Pass) */}
        <div className="px-4">
          <div className="relative rounded-2xl border-2 border-primary/50 bg-gradient-to-br from-card via-[#131d31] to-primary/15 p-5 shadow-2xl text-left space-y-4 overflow-hidden ring-1 ring-primary/20">
            
            {/* Subtle Golden Glow Accents */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

            {/* Pass Header */}
            <div className="flex items-center justify-between border-b border-border/80 pb-3 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-xs p-1">
                  <img 
                    src="/assets/apostle_silhouette.svg" 
                    alt="Gateway Emblem" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-xs font-black text-primary font-serif-church block leading-none tracking-wide">
                    GATEWAY CONNECT
                  </span>
                  <span className="text-[9px] text-muted-foreground font-medium tracking-wider uppercase">
                    Apostle Joe Daniels Ministry
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ACTIVE</span>
              </span>
            </div>

            {/* Pass Believer Profile Info */}
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden border-2 border-primary shadow-md bg-secondary ring-2 ring-primary/30">
                  <img 
                    src={user.avatar_url || StorageService.getDefaultAvatar()} 
                    alt={user.full_name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-0.5 border border-border">
                  <VerifiedBadge type={user.verified_badge || user.badge_type || (user.is_verified ? 'gold' : 'blue')} size="xs" />
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-foreground text-sm sm:text-base truncate">
                    {user.full_name}
                  </h4>
                </div>
                <p className="text-[11px] text-primary font-medium truncate font-mono">
                  {user.handle || `@${user.full_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`}
                </p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-primary shrink-0" />
                  <span className="truncate">{user.location || user.city_location || 'Harare, Zimbabwe'}</span>
                </p>
                <div className="pt-0.5">
                  <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {user.role === 'super_admin' ? 'Foundational Overseer' :
                     user.role === 'developer' ? 'Platform Engineer' :
                     user.role === 'pastor' ? 'Ordained Pastor' :
                     user.role === 'elder' ? 'Church Elder' :
                     user.role === 'youth' ? 'Youth Leader' : 'Covenant Believer'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio declaration snippet */}
            {user.bio && (
              <div className="p-2.5 rounded-xl bg-card/80 border border-border/80 text-[11px] text-muted-foreground italic leading-relaxed relative z-10">
                "{user.bio}"
              </div>
            )}

            {/* Pass Metadata Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/80 text-[10px] relative z-10">
              <div>
                <span className="text-muted-foreground block">Member ID:</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="font-mono font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
                  title="Click to copy ID"
                >
                  <span>{user.member_id || 'GCZ-MEM-2026'}</span>
                  {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                </button>
              </div>
              <div>
                <span className="text-muted-foreground block">Spiritual Overseer:</span>
                <span className="font-bold text-foreground">Apostle Joe Daniels</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Joined Assembly:</span>
                <span className="font-semibold text-foreground">{formattedDate}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Verification Seal:</span>
                <span className="font-semibold text-emerald-400">Authentic GCZ Pass</span>
              </div>
            </div>

            {/* Ministry Interests Pills */}
            {user.spiritual_interests && user.spiritual_interests.length > 0 && (
              <div className="pt-1 border-t border-border/60 relative z-10">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                  Active Ministries & Callings:
                </span>
                <div className="flex flex-wrap gap-1">
                  {user.spiritual_interests.map(interest => (
                    <span 
                      key={interest} 
                      className="text-[9px] px-2 py-0.5 rounded-full bg-secondary/80 text-foreground border border-border"
                    >
                      {interest === 'worship' ? '🎵 Praise & Worship' :
                       interest === 'prayer' ? '🙏 Prayer Watch' :
                       interest === 'youth' ? '🔥 Youth Fire' :
                       interest === 'marketplace' ? '💼 Kingdom Business' :
                       interest === 'evangelism' ? '🌍 Outreach' :
                       interest === 'bible' ? '📖 Bible Study' : interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* QR Security Stamp */}
            <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[9px] text-muted-foreground relative z-10">
              <div className="flex items-center gap-1.5 font-mono">
                <QrCode className="w-4 h-4 text-primary" />
                <span>AUTH-TOKEN: {user.id.slice(-8).toUpperCase()}</span>
              </div>
              <span className="text-primary font-serif-church font-bold">
                Faith • Power • Acceleration
              </span>
            </div>

          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 pt-1 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share to WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopyShareLink}
              className="py-2.5 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Copy verification link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
              <span>{copiedLink ? 'Copied' : 'Link'}</span>
            </button>
          </div>

          {onOpenOnboarding && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOnboarding();
              }}
              className="w-full py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Update Fellowship Assembly & Ministries</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
