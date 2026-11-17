import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionPath?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionLabel, actionPath, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <div className="w-16 h-16 rounded-full bg-green-soft flex items-center justify-center text-green-deep mb-4">
        {icon || <span className="text-2xl">📭</span>}
      </div>
      <h2 className="text-deep-green font-semibold text-lg">{title}</h2>
      {description && <p className="text-secondary text-sm mt-2 max-w-xs">{description}</p>}
      {actionLabel && actionPath && (
        <Link
          to={actionPath}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-primary text-white text-sm font-medium hover:bg-green-deep transition-colors"
        >
          {actionLabel} <ArrowRight size={16} strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}
