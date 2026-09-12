import React, { useId } from 'react';
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
  const gradientId = useId();

  if (!type || type === 'none') return null;

  const sizeStyles = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // Authentic Instagram 16-petal rounded scalloped rosette geometry
  const rosettePath = "M12 2.2a2.3 2.3 0 0 1 1.7.75l1.08 1.13a2.3 2.3 0 0 0 1.6.66h1.56a2.3 2.3 0 0 1 2.3 2.3v1.56c0 .6.24 1.19.66 1.6l1.13 1.08a2.3 2.3 0 0 1 0 3.44l-1.13 1.08a2.3 2.3 0 0 0-.66 1.6v1.56a2.3 2.3 0 0 1-2.3 2.3h-1.56a2.3 2.3 0 0 0-1.6.66l-1.08 1.13a2.3 2.3 0 0 1-3.4 0l-1.08-1.13a2.3 2.3 0 0 0-1.6-.66H7.44a2.3 2.3 0 0 1-2.3-2.3v-1.56a2.3 2.3 0 0 0-.66-1.6l-1.13-1.08a2.3 2.3 0 0 1 0-3.44l1.13-1.08a2.3 2.3 0 0 0 .66-1.6V7.04a2.3 2.3 0 0 1 2.3-2.3h1.56a2.3 2.3 0 0 0 1.6-.66L10.3 2.95A2.3 2.3 0 0 1 12 2.2z";

  if (type === 'gold') {
    return (
      <span 
        className={`inline-flex items-center gap-1 align-middle ${className}`} 
        title="Gold Badge: Super Admin"
      >
        <svg viewBox="0 0 24 24" className={`${sizeStyles[size]} shrink-0 drop-shadow-sm`} fill="none">
          <defs>
            <linearGradient id={`goldGrad-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="50%" stopColor="#EAB308" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
          </defs>
          <path d={rosettePath} fill={`url(#goldGrad-${gradientId})`} />
          <polyline points="8.5 12 11 14.5 16 9.5" stroke="#111827" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {showLabel && (
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/40">
            Super Admin
          </span>
        )}
      </span>
    );
  }

  if (type === 'silver') {
    return (
      <span 
        className={`inline-flex items-center gap-1 align-middle ${className}`} 
        title="Silver Badge: VIP Member"
      >
        <svg viewBox="0 0 24 24" className={`${sizeStyles[size]} shrink-0 drop-shadow-sm`} fill="none">
          <defs>
            <linearGradient id={`silverGrad-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="50%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>
          </defs>
          <path d={rosettePath} fill={`url(#silverGrad-${gradientId})`} />
          <polyline points="8.5 12 11 14.5 16 9.5" stroke="#0F172A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {showLabel && (
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600">
            VIP Member
          </span>
        )}
      </span>
    );
  }

  if (type === 'blue') {
    return (
      <span 
        className={`inline-flex items-center gap-1 align-middle ${className}`} 
        title="Blue Badge: Pastor / Moderator"
      >
        <svg viewBox="0 0 24 24" className={`${sizeStyles[size]} shrink-0 drop-shadow-sm`} fill="none">
          {/* Authentic Instagram / Meta Blue (#0095F6) */}
          <path d={rosettePath} fill="#0095F6" />
          <polyline points="8.5 12 11 14.5 16 9.5" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {showLabel && (
          <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-500/40">
            Pastor / Moderator
          </span>
        )}
      </span>
    );
  }

  return null;
};
