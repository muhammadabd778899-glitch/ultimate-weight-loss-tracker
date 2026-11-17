import * as React from 'react';
import { X } from 'lucide-react';
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, description, children }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#0B3D26]/45 backdrop-blur-[3px] animate-fade-in" onClick={onClose} />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-6">
          <div className="relative w-full max-w-lg animate-slide-up">
            <div className="relative overflow-hidden rounded-[24px] border border-white/60 bg-surface p-6 shadow-[0_40px_80px_-30px_rgba(11,61,38,0.45)] sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  {title && <h2 className="text-lg font-semibold tracking-tight text-dark">{title}</h2>}
                  {description && <p className="mt-1 text-[13px] leading-relaxed text-secondary">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="-mr-1 -mt-1 rounded-full p-2 text-secondary transition-colors hover:bg-black/[0.05] hover:text-dark"
                  aria-label="Close dialog"
                >
                  <X size={19} strokeWidth={2} />
                </button>
              </div>
              <div className="mt-6">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
