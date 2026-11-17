import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Inbox } from 'lucide-react';
interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionPath?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionLabel, actionPath, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-border bg-gradient-to-b from-white to-green-soft text-green-deep shadow-card">
        {icon || <Inbox size={26} strokeWidth={1.75} />}
      </div>
      <h2 className="text-lg font-semibold tracking-tight text-dark">{title}</h2>
      {description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-secondary">{description}</p>}
      {actionLabel && actionPath && (
        <Link
          to={actionPath}
          className="mt-7 inline-flex items-center gap-2 rounded-control bg-gradient-to-b from-[#1EAE68] to-[#128B51] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_-12px_rgba(15,120,70,0.85)] transition-all hover:from-[#22BA70] hover:to-[#149A5B]"
        >
          {actionLabel} <ArrowRight size={16} strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}
