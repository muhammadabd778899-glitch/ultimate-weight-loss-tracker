import * as React from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from './utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  className?: string;
}

export function Select({ value, onChange, options, label, placeholder = 'Select...', className }: SelectProps) {
  return (
    <div className="w-full space-y-1">
      {label && <label className="text-dark text-sm font-medium block">{label}</label>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-dark text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-mint disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} strokeWidth={2} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
      </div>
    </div>
  );
}

interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function ButtonGroup({ children, className }: ButtonGroupProps) {
  return <div className={cn('inline-flex items-center rounded-md border border-border bg-surface shadow-sm', className)}>{children}</div>;
}

interface SearchFilterProps {
  onSearch: (value: string) => void;
  placeholder?: string;
}

export function SearchFilter({ onSearch, placeholder = 'Search...' }: SearchFilterProps) {
  const [value, setValue] = React.useState('');
  return (
    <div className="relative w-full max-w-md">
      <Search size={18} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onSearch(e.target.value);
        }}
        placeholder={placeholder}
        className="pl-10 h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-dark text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-mint"
      />
    </div>
  );
}
