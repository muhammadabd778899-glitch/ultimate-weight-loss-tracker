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
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-dark/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 sm:p-6">
          <div className="relative w-full max-w-md overflow-hidden">
            <div className="relative rounded-card bg-surface border border-border shadow-xl p-6">
              <div className="flex justify-between items-start">
                <div>
                  {title && <h2 className="text-deep-green font-semibold text-lg">{title}</h2>}
                  {description && <p className="text-secondary text-sm mt-1">{description}</p>}
                </div>
                <button onClick={onClose} className="rounded-full p-1.5 hover:bg-green-soft text-secondary">
                  <X size={20} strokeWidth={2} />
                </button>
              </div>
              <div className="mt-4">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
