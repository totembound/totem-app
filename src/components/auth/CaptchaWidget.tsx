/**
 * Cloudflare Turnstile captcha widget.
 *
 * Wraps @marsidev/react-turnstile with our conventions:
 *  - Reads the site key from VITE_TURNSTILE_SITE_KEY.
 *  - Renders nothing when no site key is configured, so local dev stays
 *    frictionless (the backend also skips verification when its secret is unset).
 *  - Exposes an imperative `reset()` so callers can refresh the single-use token
 *    after a failed submit.
 *
 * Use `isCaptchaEnabled` in form validation to decide whether a token is
 * required before allowing submission.
 */

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as
  | string
  | undefined;

export const isCaptchaEnabled = !!TURNSTILE_SITE_KEY;

export interface CaptchaWidgetHandle {
  reset: () => void;
}

interface CaptchaWidgetProps {
  /** Called with a fresh token when the challenge is solved. */
  onVerify: (token: string) => void;
  /** Called when the token expires or the challenge errors (token is now invalid). */
  onInvalidate?: () => void;
  className?: string;
}

const CaptchaWidget = forwardRef<CaptchaWidgetHandle, CaptchaWidgetProps>(
  ({ onVerify, onInvalidate, className }, ref) => {
    const instanceRef = useRef<TurnstileInstance>(null);

    useImperativeHandle(ref, () => ({
      reset: () => instanceRef.current?.reset(),
    }));

    if (!TURNSTILE_SITE_KEY) return null;

    return (
      <div className={className}>
        <Turnstile
          ref={instanceRef}
          siteKey={TURNSTILE_SITE_KEY}
          onSuccess={onVerify}
          onExpire={() => onInvalidate?.()}
          onError={() => onInvalidate?.()}
          options={{ theme: 'auto', size: 'flexible' }}
        />
      </div>
    );
  }
);

CaptchaWidget.displayName = 'CaptchaWidget';

export default CaptchaWidget;
