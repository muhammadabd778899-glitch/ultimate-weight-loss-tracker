import * as React from 'react';
import { cn } from './utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

function buttonClasses({ variant = 'default', size = 'default', className }: ButtonProps): string {
  const base = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-deep focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  const variants: Record<string, string> = {
    default: 'bg-green-primary text-white hover:bg-green-deep',
    destructive: 'bg-attention text-white hover:opacity-90',
    outline: 'border border-border bg-surface hover:bg-green-soft hover:text-green-deep',
    secondary: 'bg-green-soft text-green-deep hover:bg-green-mint',
    ghost: 'hover:bg-green-soft hover:text-green-deep',
    link: 'text-green-deep underline-offset-4 hover:underline',
  };
  const sizes: Record<string, string> = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10 rounded-full',
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
