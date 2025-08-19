import '@testing-library/jest-dom'
import { expect, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { cleanup, configure } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Configure Testing Library
configure({
  asyncUtilTimeout: 1000,
  computedStyleSupportsPseudoElements: false,
  defaultHidden: true,
  throwSuggestions: true,
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Suppress Node.js punycode deprecation warning
const originalEmitWarning = process.emitWarning
process.emitWarning = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('The `punycode` module is deprecated')) {
    return
  }
  return originalEmitWarning.apply(process, args as any)
}

// Mock window.matchMedia for Vitest
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Suppress specific console warnings
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    // Skip React 18 strict mode warnings
    if (args[0]?.includes('Warning: ReactDOM.render is no longer supported')) {
      return
    }
    // Skip act() warnings
    if (args[0]?.includes('Warning: `ReactDOMTestUtils.act` is deprecated')) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Mock Turnstile component to prevent external script loading during tests
vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: vi.fn().mockImplementation(({ onSuccess }: any) => {
    // Auto-trigger success for testing
    if (onSuccess) {
      setTimeout(() => onSuccess('mock-turnstile-token'), 0)
    }
    return null
  })
}))

// Mock environment variables for tests
vi.mock('import.meta.env', () => ({
  VITE_GAME_ADDRESS: '0x123...',
  VITE_FORWARDER_ADDRESS: '0x456...',
  VITE_TOKEN_ADDRESS: '0x789...',
  VITE_NFT_ADDRESS: '0xabc...',
  VITE_SHOP_ADDRESS: '0xdef...',
  VITE_REWARDS_ADDRESS: '0xghi...',
  VITE_ACHIEVEMENTS_ADDRESS: '0xjkl...',
  VITE_CHALLENGES_ADDRESS: '0xmno...',
  VITE_EXPEDITIONS_ADDRESS: '0xpqr...',
  VITE_VERSION: '0.0.1',
  VITE_TURNSTILE_SITE_KEY: 'test-key'
}))