import * as React from 'react';
import { cn } from './utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export function Card({ className, padding = 'md', interactive = false, children, ...props }: CardProps) {
  const p: Record<string, string> = {
    none: '',
    sm: 'p-5',
    md: 'p-6 sm:p-7',
    lg: 'p-7 sm:p-9',
  };
  return (
    <div
      {...props}
      className={cn(
        'relative rounded-card border border-border/80 bg-surface shadow-card transition-[transform,box-shadow,border-color] duration-300',
        interactive && 'hover:-translate-y-0.5 hover:border-green-mint/60 hover:shadow-lift',
        p[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div {...props} className={cn('flex flex-wrap items-start justify-between gap-x-4 gap-y-2', className)}>
      {children}
    </div>
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3
      {...props}
      className={cn('text-[15px] font-semibold tracking-tight text-dark sm:text-base', className)}
    >
      {children}
    </h3>
  );
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
export function CardDescription({ className, children, ...props }: CardDescriptionProps) {
  return (
    <p {...props} className={cn('mt-1 text-[13px] leading-relaxed text-secondary', className)}>
      {children}
    </p>
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
export function CardContent({ className, children, ...props }: CardContentProps) {
  return <div {...props} className={cn('mt-5', className)}>{children}</div>;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div {...props} className={cn('mt-auto flex items-center gap-2 pt-4', className)}>
      {children}
    </div>
  );
}
