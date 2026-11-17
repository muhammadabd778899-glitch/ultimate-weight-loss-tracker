import * as React from 'react';
import { cn } from './utils';

const FIELD_CLASSES =
  'flex h-11 w-full rounded-control border border-border bg-white px-3.5 text-dark text-sm shadow-[inset_0_1px_2px_rgba(16,40,28,0.03)] transition-all duration-200 placeholder:text-secondary/55 hover:border-green-sage focus-visible:border-green-mint focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-mint/30 disabled:cursor-not-allowed disabled:opacity-50';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  containerClassName?: string;
}

export function Input({ className, containerClassName, label, error, helper, id, ...props }: InputProps) {
  const inputId = id || React.useId();
  return (
    <div className={cn('w-full space-y-1.5', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="block text-[13px] font-medium text-dark">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={cn(FIELD_CLASSES, 'py-2', error && 'border-attention focus-visible:border-attention focus-visible:ring-attention/25', className)}
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
    <div className="w-full space-y-1.5">
      {label && <label htmlFor={textareaId} className="block text-[13px] font-medium text-dark">{label}</label>}
      <textarea
        id={textareaId}
        {...props}
        className={cn(FIELD_CLASSES, 'h-auto min-h-24 py-2.5', error && 'border-attention focus-visible:border-attention focus-visible:ring-attention/25', className)}
        aria-invalid={error ? 'true' : 'false'}
      />
      {error && <p className="text-attention text-xs">{error}</p>}
      {helper && !error && <p className="text-secondary text-xs">{helper}</p>}
    </div>
  );
}
