/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_RELAYER_API_URL: string
  readonly VITE_API_GATEWAY_URL: string
  readonly VITE_IPFS_GATEWAY_URL: string
  readonly VITE_GAME_ADDRESS: string
  readonly VITE_FORWARDER_ADDRESS: string
  readonly VITE_TOKEN_ADDRESS: string
  readonly VITE_NFT_ADDRESS: string
  readonly VITE_SHOP_ADDRESS: string
  readonly VITE_REWARDS_ADDRESS: string
  readonly VITE_ACHIEVEMENTS_ADDRESS: string
  readonly VITE_CHALLENGES_ADDRESS: string
  readonly VITE_EXPEDITIONS_ADDRESS: string
  readonly VITE_VERSION: string
  readonly VITE_TURNSTILE_SITE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}