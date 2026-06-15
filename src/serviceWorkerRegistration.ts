import { registerSW } from 'virtual:pwa-register';

export function register(): void {
  if ('serviceWorker' in navigator) {
    registerSW({
      immediate: true,
      // With registerType: 'prompt', the plugin will NOT auto-skip-waiting.
      // ServiceWorkerDialog handles the update UX independently via the
      // browser SW API (registration.waiting + postMessage SKIP_WAITING).
      onNeedRefresh() {
        console.log('[SW] New version available — waiting for user to approve update.');
      },
      onOfflineReady() {
        console.log('[SW] App cached for offline use.');
      },
      onRegisterError(error: any) {
        console.error('[SW] Registration error:', error);
      }
    });
  }
}

export function unregister(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.unregister())
      .catch((error) => console.error(error.message));
  }
}

export function getVersion(): string {
  return import.meta.env.VITE_VERSION || '0.0.1';
}
