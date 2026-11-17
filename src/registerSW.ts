/**
 * Service Worker registration
 * Registers the offline-first cache for the app shell.
 */

const PUBLIC_URL = (import.meta as any).env.BASE_URL || '/';

export function registerSW(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    const swUrl = `${PUBLIC_URL}sw.js`;
    navigator.serviceWorker
      .register(swUrl, { scope: PUBLIC_URL })
      .then((registration) => {
        console.log('SW registered: ', registration);
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('New content available; please reload.');
                window.dispatchEvent(new Event('sw-update-available'));
              }
            }
          });
        });
      })
      .catch((err) => {
        console.error('Service worker registration failed: ', err);
      });
  });
}

export function unregisterSW(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}
