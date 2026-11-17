import * as React from 'react';
import { cn } from './utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ className, padding = 'md', children, ...props }: CardProps) {
  const p: Record<string, string> = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };
  return (
    <div
      {...props}
      className={cn('rounded-card bg-surface border border-border shadow-card', p[padding], className)}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return <div {...props} className={cn('flex flex-col space-y-1.5 sm:space-y-0 sm:flex-row', className)}>{children}</div>;
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3
      {...props}
      className={cn('text-deep-green font-semibold text-sm sm:text-base tracking-tight', className)}
    >
      {children}
    </h3>
  );
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
export function CardDescription({ className, children, ...props }: CardDescriptionProps) {
  return (
    <p
      {...props}
      className={cn('text-secondary text-sm', className)}
    >
      {children}
    </p>
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
export function CardContent({ className, children, ...props }: CardContentProps) {
  return <div {...props} className={cn('mt-2 sm:mt-4', className)}>{children}</div>;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div {...props} className={cn('mt-auto sm:mt-0 flex items-center', className)}>
      {children}
    </div>
  );
}
