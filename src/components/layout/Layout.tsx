import * as React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
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
    <div className="flex min-h-screen flex-col bg-bg text-dark">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-control focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-green-deep focus:shadow-card"
      >
        Skip to content
      </a>

      <Header online={online} mobileOpen={mobileOpen} onMenuToggle={() => setMobileOpen((open) => !open)} />

      <main id="main-content" className="mx-auto w-full max-w-[1240px] flex-1 px-4 pb-16 pt-7 sm:px-6 lg:px-8 lg:pt-9">
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-border/70 bg-white/55">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-2 px-4 py-6 text-[11px] text-secondary sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© 2026 Muhammad Abdullah · Ultimate Weight Loss &amp; Fitness Tracker</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={13} strokeWidth={2} />
            Private · all data stored on this device
          </span>
        </div>
      </footer>

      <ToastContainer toasts={toasts} onDismiss={remove} />

      {!online && (
        <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#EAD9B6] bg-[#FCF4E4] px-4 py-2.5 text-[12px] font-medium text-[#8A6519] shadow-lift">
          <span className="h-1.5 w-1.5 rounded-full bg-[#D99B3C]" />
          You're offline — your data is safe on this device
        </div>
      )}
    </div>
  );
}
