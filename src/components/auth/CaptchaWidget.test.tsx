/**
 * Tests for CaptchaWidget.
 *
 * The Turnstile component itself is mocked globally in setupTests.ts to render
 * null and auto-invoke onSuccess('mock-turnstile-token'), so these tests cover
 * OUR wrapper: enable/disable gating on the site key, token propagation, and the
 * imperative reset() handle.
 *
 * VITE_TURNSTILE_SITE_KEY defaults to 'test-site-key' via vite.config test.env,
 * so the enabled path is the default. The disabled path stubs it empty and
 * re-imports the module (the site key is read at module load).
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import CaptchaWidget, { isCaptchaEnabled, type CaptchaWidgetHandle } from './CaptchaWidget';

describe('CaptchaWidget', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('isCaptchaEnabled is true when a site key is configured', () => {
    expect(isCaptchaEnabled).toBe(true);
  });

  it('calls onVerify with the token produced by the widget', async () => {
    const onVerify = vi.fn();
    render(<CaptchaWidget onVerify={onVerify} />);
    await waitFor(() => expect(onVerify).toHaveBeenCalledWith('mock-turnstile-token'));
  });

  it('renders a container (not null) when enabled', () => {
    const { container } = render(<CaptchaWidget onVerify={vi.fn()} />);
    expect(container.firstChild).not.toBeNull();
  });

  it('exposes an imperative reset() that is safe to call', () => {
    const ref = createRef<CaptchaWidgetHandle>();
    render(<CaptchaWidget ref={ref} onVerify={vi.fn()} />);
    expect(ref.current).not.toBeNull();
    expect(() => ref.current?.reset()).not.toThrow();
  });

  it('renders nothing and reports disabled when no site key is configured', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '');
    const mod = await import('./CaptchaWidget');
    expect(mod.isCaptchaEnabled).toBe(false);
    const { container } = render(<mod.default onVerify={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
