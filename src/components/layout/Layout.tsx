import * as React from 'react';
import { useToasts } from '../../hooks/useToasts';
import { ToastContainer } from '../ui/Toast';
import Header from './Header';

interface LayoutProps {
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [online, setOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  React.useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const { toasts } = useToasts();

  return (
    <div className="min-h-screen bg-bg text-dark">
      <Header onMenuToggle={() => {}} />
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      <ToastContainer toasts={toasts} onDismiss={() => {}} />
      {!online && (
        <div className="fixed bottom-4 left-4 z-50 rounded-md border border-warning bg-warning/10 px-4 py-2 text-warning text-sm shadow-lg">
          You appear to be offline. Your data is saved locally and will sync when you reconnect.
        </div>
      )}
    </div>
  );
}
