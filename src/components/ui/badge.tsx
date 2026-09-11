import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'gold' | 'live';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  ...props
}) => {
  const variantStyles: Record<string, string> = {
    default: 'bg-primary text-primary-foreground border-transparent',
    secondary: 'bg-secondary text-secondary-foreground border-transparent',
    destructive: 'bg-destructive/15 text-destructive border-destructive/20',
    outline: 'text-foreground border-border',
    gold: 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-semibold',
    live: 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-bold uppercase tracking-wider'
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none select-none',
        variantStyles[variant] || variantStyles.default,
        className
      )}
      {...props}
    />
  );
};
