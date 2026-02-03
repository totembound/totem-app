import { registerSW } from 'virtual:pwa-register';

type Config = {
  onSuccess?: (registration?: ServiceWorkerRegistration) => void;
  onUpdate?: (registration?: ServiceWorkerRegistration) => void;
}

export function register(config?: Config): void {
  if ('serviceWorker' in navigator) {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('New content is available and will be used when all tabs for this page are closed.');
        if (config?.onUpdate) {
          config.onUpdate();
        }
      },
      onOfflineReady() {
        console.log('Content is cached for offline use.');
        if (config?.onSuccess) {
          config.onSuccess();
        }
      },
      onRegisterError(error: any) {
        console.error('Error during service worker registration:', error);
      }
    });
  }
}

export function unregister(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

export function getVersion(): string {
  return import.meta.env.VITE_VERSION || '0.0.1';
}
