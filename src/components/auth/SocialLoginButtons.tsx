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

// Add future provider icons here:
// const DiscordIcon = () => ( ... );
// const TwitchIcon = () => ( ... );

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
  // discord: { ... },
  // twitch: { ... },
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
