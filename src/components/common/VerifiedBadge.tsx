import React from 'react';
import { BadgeType } from '../../types';

interface VerifiedBadgeProps {
  type?: BadgeType;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  type = 'none',
  size = 'sm',
  showLabel = false,
  className = ''
}) => {
  if (!type || type === 'none') return null;

  const sizeStyles = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // Facebook-Style 16-Tooth Scalloped Starburst Rosette Path
  const facebookScallopPath = "M10.52 2.47a2.5 2.5 0 0 1 2.96 0l1.2 0.88a2.5 2.5 0 0 0 1.93 0.52l1.48-.19a2.5 2.5 0 0 1 2.76 1.6l0.55 1.39a2.5 2.5 0 0 0 1.48 1.48l1.39 0.55a2.5 2.5 0 0 1 1.6 2.76l-.19 1.48a2.5 2.5 0 0 0 0.52 1.93l0.88 1.2a2.5 2.5 0 0 1 0 2.96l-0.88 1.2a2.5 2.5 0 0 0-.52 1.93l0.19 1.48a2.5 2.5 0 0 1-1.6 2.76l-1.39 0.55a2.5 2.5 0 0 0-1.48 1.48l-0.55 1.39a2.5 2.5 0 0 1-2.76 1.6l-1.48-.19a2.5 2.5 0 0 0-1.93 0.52l-1.2 0.88a2.5 2.5 0 0 1-2.96 0l-1.2-.88a2.5 2.5 0 0 0-1.93-.52l-1.48.19a2.5 2.5 0 0 1-2.76-1.6l-.55-1.39a2.5 2.5 0 0 0-1.48-1.48l-1.39-.55a2.5 2.5 0 0 1-1.6-2.76l.19-1.48a2.5 2.5 0 0 0-.52-1.93l-.88-1.2a2.5 2.5 0 0 1 0-2.96l.88-1.2a2.5 2.5 0 0 0 .52-1.93l-.19-1.48a2.5 2.5 0 0 1 1.6-2.76l1.39-.55a2.5 2.5 0 0 0 1.48-1.48l.55-1.39a2.5 2.5 0 0 1 2.76-1.6l1.48.19a2.5 2.5 0 0 0 1.93-.52l1.2-.88z";

  if (type === 'gold') {
    return (
      <span 
        className={`inline-flex items-center gap-1 align-middle ${className}`} 
        title="Gold Verified: Apostle Joe Daniels (Apostolic Founder)"
      >
        <svg viewBox="0 0 24 24" className={`${sizeStyles[size]} shrink-0 drop-shadow`} fill="none">
          <defs>
            <linearGradient id="fbGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="50%" stopColor="#EAB308" />
              <stop offset="100%" stopColor="#CA8A04" />
            </linearGradient>
          </defs>
          <path d={facebookScallopPath} fill="url(#fbGoldGrad)" />
          <polyline points="8.5 12 11 14.5 16 9.5" stroke="#001F3F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {showLabel && (
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/40">
            Gold Verified
          </span>
        )}
      </span>
    );
  }

  if (type === 'silver') {
    return (
      <span 
        className={`inline-flex items-center gap-1 align-middle ${className}`} 
        title="Silver Verified: Church Moderator"
      >
        <svg viewBox="0 0 24 24" className={`${sizeStyles[size]} shrink-0 drop-shadow`} fill="none">
          <defs>
            <linearGradient id="fbSilverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="50%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
          </defs>
          <path d={facebookScallopPath} fill="url(#fbSilverGrad)" />
          <polyline points="8.5 12 11 14.5 16 9.5" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {showLabel && (
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600">
            Moderator
          </span>
        )}
      </span>
    );
  }

  if (type === 'blue') {
    return (
      <span 
        className={`inline-flex items-center gap-1 align-middle ${className}`} 
        title="Blue Verified: Kingdom Partner"
      >
        <svg viewBox="0 0 24 24" className={`${sizeStyles[size]} shrink-0 drop-shadow`} fill="none">
          {/* Authentic Facebook Blue Badge */}
          <path d={facebookScallopPath} fill="#1877F2" />
          <polyline points="8.5 12 11 14.5 16 9.5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {showLabel && (
          <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-500/40">
            Verified
          </span>
        )}
      </span>
    );
  }

  return null;
};
