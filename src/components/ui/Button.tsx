import * as React from 'react';
import { cn } from './utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

function buttonClasses({ variant = 'default', size = 'default', className }: ButtonProps): string {
  const base =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control text-sm font-semibold tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-mint/35 disabled:pointer-events-none disabled:opacity-50';
  const variants: Record<string, string> = {
    default:
      'bg-gradient-to-b from-[#1EAE68] to-[#128B51] text-white shadow-[0_10px_22px_-12px_rgba(15,120,70,0.85)] hover:from-[#22BA70] hover:to-[#149A5B] active:translate-y-px',
    destructive:
      'bg-gradient-to-b from-[#E88272] to-[#D3614F] text-white shadow-[0_10px_22px_-12px_rgba(190,80,60,0.7)] hover:brightness-105 active:translate-y-px',
    outline:
      'border border-border bg-white text-dark shadow-[0_1px_2px_rgba(16,40,28,0.04)] hover:border-green-mint/70 hover:bg-green-soft/60 hover:text-green-deep',
    secondary: 'bg-green-soft text-green-deep hover:bg-green-sage',
    ghost: 'text-secondary hover:bg-black/[0.04] hover:text-dark',
    link: 'text-green-deep underline-offset-4 hover:underline',
  };
  const sizes: Record<string, string> = {
    default: 'h-11 px-5',
    sm: 'h-9 rounded-[10px] px-3.5 text-[13px]',
    lg: 'h-12 rounded-[14px] px-7 text-[15px]',
    icon: 'h-10 w-10 rounded-control',
  };
  return cn(base, variants[variant], sizes[size], className);
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type={props.type || 'button'}
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button };
