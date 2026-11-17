import * as React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from './utils';

interface ToastItemProps {
  toast: {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
  };
  onDismiss: () => void;
}

const ICONS: Record<string, React.ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const ACCENTS: Record<string, string> = {
  success: 'bg-[#E9F7EE] text-[#0A6B3E]',
  error: 'bg-[#FCEDEA] text-[#C25241]',
  warning: 'bg-[#FCF4E4] text-[#A9741F]',
  info: 'bg-[#EAF1FB] text-[#3457A6]',
};

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const Icon = ICONS[toast.type] || Info;
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4 shadow-[0_20px_45px_-22px_rgba(11,61,38,0.45)] animate-toast-in">
      <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', ACCENTS[toast.type])}>
        <Icon size={18} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <h4 className="text-sm font-semibold text-dark">{toast.title}</h4>
        {toast.message && <p className="mt-1 text-xs leading-relaxed text-secondary">{toast.message}</p>}
      </div>
      <button
        onClick={onDismiss}
        className="-mr-1 -mt-1 rounded-full p-1.5 text-secondary transition-colors hover:bg-black/[0.05] hover:text-dark"
        aria-label="Dismiss notification"
      >
        <X size={15} strokeWidth={2} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastItemProps['toast'][];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="pointer-events-none fixed inset-x-4 top-24 z-[60] flex flex-col items-end gap-2 sm:left-auto sm:right-6 sm:w-full sm:max-w-sm">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto w-full">
          <ToastItem toast={t} onDismiss={() => onDismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}
