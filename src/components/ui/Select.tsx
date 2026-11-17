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
    <div className="w-full space-y-1.5">
      {label && <label className="block text-[13px] font-medium text-dark">{label}</label>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'h-11 w-full cursor-pointer appearance-none rounded-control border border-border bg-white pl-3.5 pr-10 text-sm text-dark shadow-[inset_0_1px_2px_rgba(16,40,28,0.03)] transition-all duration-200 hover:border-green-sage focus-visible:border-green-mint focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-mint/30 disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} strokeWidth={2} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary" />
      </div>
    </div>
  );
}

interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function ButtonGroup({ children, className }: ButtonGroupProps) {
  return <div className={cn('inline-flex items-center rounded-control border border-border bg-white p-1 shadow-card', className)}>{children}</div>;
}

interface SearchFilterProps {
  onSearch: (value: string) => void;
  placeholder?: string;
}

export function SearchFilter({ onSearch, placeholder = 'Search...' }: SearchFilterProps) {
  const [value, setValue] = React.useState('');
  return (
    <div className="relative w-full max-w-md">
      <Search size={17} strokeWidth={2} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onSearch(e.target.value);
        }}
        placeholder={placeholder}
        className="h-11 w-full rounded-control border border-border bg-white pl-10 pr-3.5 text-sm text-dark shadow-[inset_0_1px_2px_rgba(16,40,28,0.03)] transition-all duration-200 placeholder:text-secondary/55 hover:border-green-sage focus-visible:border-green-mint focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-mint/30"
      />
    </div>
  );
}
