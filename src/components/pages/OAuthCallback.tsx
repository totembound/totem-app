/**
 * OAuth Callback Page
 *
 * Handles the redirect from OAuth providers (Google, Discord, Twitch).
 * Extracts authorization code, verifies CSRF state, and exchanges for tokens.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithOAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [providerName, setProviderName] = useState('');
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double execution in React strict mode
    if (hasRun.current) return;
    hasRun.current = true;

    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const urlError = searchParams.get('error');

      // Provider from URL param or sessionStorage
      const provider = searchParams.get('provider') || sessionStorage.getItem('oauth_provider') || '';
      setProviderName(provider.charAt(0).toUpperCase() + provider.slice(1));

      // Check for provider-side errors (user denied, etc.)
      if (urlError) {
        const desc = searchParams.get('error_description') || 'Authentication was cancelled or denied.';
        setError(desc);
        cleanupSession();
        return;
      }

      if (!code) {
        setError('No authorization code received from provider.');
        cleanupSession();
        return;
      }

      // Verify CSRF state
      const storedState = sessionStorage.getItem('oauth_state');
      if (!state || !storedState || state !== storedState) {
        setError('Security verification failed. Please try again.');
        cleanupSession();
        return;
      }

      // Clean up session storage
      cleanupSession();

      // Exchange code for tokens
      const redirectUri = `${window.location.origin}/auth/callback`;

      try {
        const result = await loginWithOAuth(provider, code, redirectUri);

        if (result.success) {
          if (result.isNewUser) {
            navigate('/rewards', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        } else {
          setError(result.error || 'Authentication failed. Please try again.');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('An unexpected error occurred. Please try again.');
      }
    };

    handleCallback();
  }, [searchParams, navigate, loginWithOAuth]);

  function cleanupSession() {
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('oauth_provider');
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 text-red-500">
              <AlertCircle className="w-full h-full" />
            </div>

            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Sign In Failed
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>

            <Link
              to="/login"
              className="inline-block w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all text-center"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6">
            <svg
              className="animate-spin w-full h-full text-purple-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Signing in{providerName ? ` with ${providerName}` : ''}...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This will only take a moment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;
