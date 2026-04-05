/**
 * Social Login Buttons
 *
 * Config-driven — only renders buttons for providers with env vars set.
 * Shared between Login and Signup pages.
 */

import React from 'react';

// ============================================
// Provider Config
// ============================================

interface OAuthProviderConfig {
  name: string;
  authorizeUrl: string;
  scopes: string;
  clientId: string | undefined;
  bg: string;
  border: string;
  text: string;
  hoverBg: string;
  icon: React.ReactNode;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const TwitchIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#9146FF" aria-hidden="true">
    <path d="M4.265 1.5L1.5 5.648v15.352h5.176V24h2.94l2.912-2.941h4.236L22.5 15.382V1.5H4.265zm16.47 12.941l-3.528 3.529h-5.176l-2.941 2.941v-2.941H4.853V3.265h15.882v11.176zM17.206 7.03v5.883h-2.118V7.03h2.118zm-5.764 0v5.883H9.324V7.03h2.118z" />
  </svg>
);

const DiscordIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#5865F2" aria-hidden="true">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const OAUTH_PROVIDERS: Record<string, OAuthProviderConfig> = {
  google: {
    name: 'Google',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scopes: 'openid email profile',
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    bg: 'bg-white dark:bg-gray-800',
    border: 'border border-gray-300 dark:border-gray-600',
    text: 'text-gray-700 dark:text-gray-200',
    hoverBg: 'hover:bg-gray-50 dark:hover:bg-gray-700',
    icon: <GoogleIcon />,
  },
  discord: {
    name: 'Discord',
    authorizeUrl: 'https://discord.com/oauth2/authorize',
    scopes: 'identify email',
    clientId: import.meta.env.VITE_DISCORD_CLIENT_ID,
    bg: 'bg-white dark:bg-gray-800',
    border: 'border border-gray-300 dark:border-gray-600',
    text: 'text-gray-700 dark:text-gray-200',
    hoverBg: 'hover:bg-gray-50 dark:hover:bg-gray-700',
    icon: <DiscordIcon />,
  },
  twitch: {
    name: 'Twitch',
    authorizeUrl: 'https://id.twitch.tv/oauth2/authorize',
    scopes: 'user:read:email',
    clientId: import.meta.env.VITE_TWITCH_CLIENT_ID,
    bg: 'bg-white dark:bg-gray-800',
    border: 'border border-gray-300 dark:border-gray-600',
    text: 'text-gray-700 dark:text-gray-200',
    hoverBg: 'hover:bg-gray-50 dark:hover:bg-gray-700',
    icon: <TwitchIcon />,
  },
};

// ============================================
// Component
// ============================================

interface SocialLoginButtonsProps {
  isLoading?: boolean;
  disabled?: boolean;
  onDisabledClick?: () => void;
}

function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

function buildAuthorizeUrl(provider: string, config: OAuthProviderConfig): string {
  const redirectUri = `${window.location.origin}/auth/callback`;
  const state = generateState();

  // Store state + provider for CSRF verification on callback
  sessionStorage.setItem('oauth_state', state);
  sessionStorage.setItem('oauth_provider', provider);

  const params = new URLSearchParams({
    client_id: config.clientId!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes,
    state,
  });

  // Google-specific: prompt for account selection
  if (provider === 'google') {
    params.set('access_type', 'offline');
    params.set('prompt', 'select_account');
  }

  return `${config.authorizeUrl}?${params.toString()}`;
}

const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  isLoading = false,
  disabled = false,
  onDisabledClick,
}) => {
  // Filter to only providers with configured client IDs
  const activeProviders = Object.entries(OAUTH_PROVIDERS).filter(
    ([, config]) => !!config.clientId
  );

  // Don't render anything if no providers configured
  if (activeProviders.length === 0) return null;

  const handleClick = (provider: string, config: OAuthProviderConfig) => {
    if (isLoading) return;
    if (disabled) {
      onDisabledClick?.();
      return;
    }
    const url = buildAuthorizeUrl(provider, config);
    window.location.href = url;
  };

  return (
    <div className="mt-6">
      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            or
          </span>
        </div>
      </div>

      {/* Provider Buttons */}
      <div className="space-y-3">
        {activeProviders.map(([provider, config]) => (
          <button
            key={provider}
            type="button"
            onClick={() => handleClick(provider, config)}
            disabled={isLoading}
            aria-disabled={disabled}
            title={disabled ? 'You must agree to the Terms of Use and Privacy Policy' : undefined}
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-3 min-h-[44px] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${config.bg} ${config.border} ${config.text} ${config.hoverBg}`}
          >
            {config.icon}
            Continue with {config.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SocialLoginButtons;
