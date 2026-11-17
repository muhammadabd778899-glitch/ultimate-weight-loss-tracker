import * as React from 'react';
import { cn } from './utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export function Input({ className, label, error, helper, id, ...props }: InputProps) {
  const inputId = id || React.useId();
  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="text-dark text-sm font-medium block">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={cn(
          'flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-dark text-sm shadow-sm transition-colors placeholder:text-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-mint disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-attention focus-visible:ring-attention',
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
      />
      {error && <p id={`${inputId}-error`} className="text-attention text-xs">{error}</p>}
      {helper && !error && <p id={`${inputId}-helper`} className="text-secondary text-xs">{helper}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export function Textarea({ className, label, error, helper, id, ...props }: TextareaProps) {
  const textareaId = id || React.useId();
  return (
    <div className="w-full space-y-1">
      {label && <label htmlFor={textareaId} className="text-dark text-sm font-medium block">{label}</label>}
      <textarea
        id={textareaId}
        {...props}
        className={cn(
          'block w-full rounded-md border border-border bg-surface px-3 py-2 text-dark text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-mint disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-attention focus-visible:ring-attention',
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
      />
      {error && <p className="text-attention text-xs">{error}</p>}
      {helper && !error && <p className="text-secondary text-xs">{helper}</p>}
    </div>
  );
}
