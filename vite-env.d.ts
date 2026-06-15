/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/info" />
/// <reference lib="webworker" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_API_GATEWAY_URL: string
  readonly VITE_IPFS_GATEWAY_URL: string
  readonly VITE_VERSION: string
  readonly VITE_TURNSTILE_SITE_KEY: string
  readonly VITE_PUBLIC_POSTHOG_KEY: string
  readonly VITE_PUBLIC_POSTHOG_HOST: string
  readonly VITE_PUBLIC_POSTHOG_AUTOCAPTURE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    onRegisterError?: (error: any) => void
  }
  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>
}

// Workbox types for service worker
declare global {
  interface Window {
    __WB_MANIFEST: unknown[]
  }

  const __WB_MANIFEST: unknown[]
}
