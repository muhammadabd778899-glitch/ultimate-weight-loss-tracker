import * as React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useToasts } from '../../hooks/useToasts';
import { ToastContainer } from '../ui/Toast';
import Header from './Header';

export function Layout() {
  const [online, setOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();

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

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const { toasts, remove } = useToasts();

  return (
    <div className="min-h-screen bg-bg text-dark">
      <Header online={online} mobileOpen={mobileOpen} onMenuToggle={() => setMobileOpen((open) => !open)} />
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <ToastContainer toasts={toasts} onDismiss={remove} />
      {!online && (
        <div className="fixed bottom-4 left-4 z-50 rounded-md border border-warning bg-warning/10 px-4 py-2 text-warning text-sm shadow-lg">
          You appear to be offline. Your data is stored locally on this device.
        </div>
      )}
    </div>
  );
}
