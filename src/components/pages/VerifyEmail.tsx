/**
 * Email Verification Page
 *
 * Accepts a 6-digit verification code after signup.
 * Auto-logs in the user after successful verification.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, CheckCircle, AlertCircle, Package } from 'lucide-react';
import { CURRENCY_NAMES } from '../../config/constants';
import { notificationService } from '../../services/NotificationService';
import { NotificationType, NotificationPriority } from '../../types/notifications';

const VerifyEmail: React.FC = () => {
  const { verifyEmail, resendVerification, lootItem, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { email, password } = (location.state as { email?: string; password?: string }) || {};

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect to signup if no email in state
  useEffect(() => {
    if (!email) {
      navigate('/signup', { replace: true });
    }
  }, [email, navigate]);

  // Clear errors when code changes
  const codeString = code.join('');
  useEffect(() => {
    if (error) clearError();
    if (localError) setLocalError(null);
  }, [codeString]);

  // Show welcome notification after verification completes and UI re-renders
  useEffect(() => {
    if (!verified) return;
    // Small delay to ensure notification hook has re-initialized after auth state change
    const timer = setTimeout(() => {
      notificationService.showNotification(
        NotificationType.USER_SIGNUP,
        `Welcome to TotemBound! You've received 2,000 ${CURRENCY_NAMES.SOFT} to start your journey.`,
        undefined,
        { priority: NotificationPriority.HIGH }
      );
    }, 500);
    return () => clearTimeout(timer);
  }, [verified]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;
    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || '';
    }
    setCode(newCode);
    const nextEmpty = newCode.findIndex((d) => !d);
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  const handleVerifySubmit = async () => {
    const fullCode = codeString;
    if (fullCode.length !== 6) {
      setLocalError('Please enter the full 6-digit code');
      return;
    }
    if (!password) {
      setLocalError('Session expired. Please sign up again.');
      return;
    }

    setIsVerifying(true);
    setLocalError(null);

    const success = await verifyEmail(email!, fullCode, password);

    if (success) {
      setVerified(true);
    }

    setIsVerifying(false);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    const success = await resendVerification(email!);
    if (success) {
      setResendCooldown(60);
    }
    setIsResending(false);
  };

  if (!email) return null;

  const displayError = localError || error;

  // Verified success screen
  if (verified) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 text-green-500">
              <CheckCircle className="w-full h-full" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to TotemBound!
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your email has been verified and your account is ready!
            </p>

            {lootItem && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Package className="w-8 h-8 text-purple-500" />
                </div>
                <p className="font-semibold text-purple-800 dark:text-purple-200 mb-1">
                  {lootItem.boxName}
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  {lootItem.boxDescription}
                </p>
              </div>
            )}

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <p className="text-green-800 dark:text-green-200">
                You've received <strong>2,000 {CURRENCY_NAMES.SOFT}</strong> to start your journey!
              </p>
            </div>

            <button
              onClick={() => navigate('/rewards')}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
            >
              Go to Loot & Rewards
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Verification form
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Verify Your Email
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              We sent a 6-digit code to
            </p>
            <p className="text-purple-600 dark:text-purple-400 font-medium">
              {email}
            </p>
          </div>

          {/* Error Display */}
          {displayError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 dark:text-red-300 text-sm">{displayError}</p>
            </div>
          )}

          {/* Code Input */}
          <div className="flex justify-center gap-2 sm:gap-3 mb-8" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-gray-50 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                disabled={isVerifying}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerifySubmit}
            disabled={isVerifying || isLoading || code.some((d) => !d)}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 mb-4"
          >
            {isVerifying || isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
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
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </button>

          {/* Resend Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Didn't receive the code?{' '}
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
                className="text-purple-600 dark:text-purple-400 font-medium hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : isResending
                    ? 'Sending...'
                    : 'Resend code'}
              </button>
            </p>
          </div>

          {/* Dev Mode Hint */}
          {import.meta.env.DEV && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                Dev Mode
              </p>
              <button
                type="button"
                onClick={() => setCode(['1', '2', '3', '4', '5', '6'])}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Fill test code (123456)
              </button>
            </div>
          )}

          {/* Back to signup */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
              Wrong email?{' '}
              <Link
                to="/signup"
                className="text-purple-600 dark:text-purple-400 font-medium hover:underline"
              >
                Sign up again
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
