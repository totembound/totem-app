/**
 * usePageViews tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

// Hoist mocks
const { mockLocation, mockPosthog, mockIsEnabled } = vi.hoisted(() => ({
  mockLocation: { pathname: '/home' },
  mockPosthog: { capture: vi.fn() },
  mockIsEnabled: { value: true },
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => mockLocation,
}));

vi.mock('../clients/posthogClient', () => ({
  get posthog() { return mockIsEnabled.value ? mockPosthog : null; },
  get isPostHogEnabled() { return mockIsEnabled.value; },
}));

import { usePageViews } from './usePageViews';

describe('usePageViews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsEnabled.value = true;
  });

  it('should capture pageview on mount', () => {
    mockLocation.pathname = '/rewards';
    renderHook(() => usePageViews());

    expect(mockPosthog.capture).toHaveBeenCalledWith('$pageview', {
      path: '/rewards',
      url: window.location.href,
    });
  });

  it('should normalize path by removing trailing slash', () => {
    mockLocation.pathname = '/shop/';
    renderHook(() => usePageViews());

    expect(mockPosthog.capture).toHaveBeenCalledWith('$pageview', {
      path: '/shop',
      url: expect.any(String),
    });
  });

  it('should keep root path as /', () => {
    mockLocation.pathname = '/';
    renderHook(() => usePageViews());

    expect(mockPosthog.capture).toHaveBeenCalledWith('$pageview', {
      path: '/',
      url: expect.any(String),
    });
  });

  it('should not capture when posthog is null', () => {
    mockIsEnabled.value = false;
    mockLocation.pathname = '/test';
    renderHook(() => usePageViews());

    expect(mockPosthog.capture).not.toHaveBeenCalled();
  });
});
