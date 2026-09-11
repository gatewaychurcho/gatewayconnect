import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gold';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variantStyles: Record<string, string> = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
      outline: 'border border-border bg-transparent hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
      gold: 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-semibold shadow hover:brightness-105 active:scale-[0.98]'
    };

    const sizeStyles: Record<string, string> = {
      default: 'h-9 px-4 py-2 text-sm',
      sm: 'h-8 rounded-lg px-3 text-xs',
      lg: 'h-10 rounded-xl px-6 text-base',
      icon: 'h-9 w-9 p-0'
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
          variantStyles[variant] || variantStyles.default,
          sizeStyles[size] || sizeStyles.default,
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
