// Temporary basic service worker registration
// Will be replaced with Vite PWA plugin once types are resolved

type Config = {
  onSuccess?: () => void;
  onUpdate?: () => void;
};

export function register(config?: Config): void {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          if (config?.onSuccess) {
            config.onSuccess();
          }
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

const VERSION = `${import.meta.env.VITE_VERSION}`;
export function getVersion() {
  return VERSION;
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

// Export placeholder for updateSW
export const updateSW = undefined;
