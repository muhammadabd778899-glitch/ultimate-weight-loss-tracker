import * as React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
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

const COLORS: Record<string, string> = {
  success: 'text-success bg-success/10 border-success/20',
  error: 'text-attention bg-attention/10 border-attention/20',
  warning: 'text-warning bg-warning/10 border-warning/20',
  info: 'text-green-deep bg-green-soft border-green-deep/20',
};

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const Icon = ICONS[toast.type] || Info;
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-md border p-4 shadow-lg animate-toast-in',
        COLORS[toast.type]
      )}
    >
      <Icon size={20} strokeWidth={2} />
      <div className="flex-1 min-w-0">
        <h4 className="text-dark font-semibold text-sm">{toast.title}</h4>
        {toast.message && <p className="text-secondary text-xs mt-1">{toast.message}</p>}
      </div>
      <button onClick={onDismiss} className="rounded-md p-1.5 hover:bg-current/10 text-secondary">
        <XIcon size={16} strokeWidth={2} />
      </button>
    </div>
  );
}

function XIcon({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

interface ToastContainerProps {
  toasts: ToastItemProps['toast'][];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto w-full max-w-sm">
          <ToastItem toast={t} onDismiss={() => onDismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}
