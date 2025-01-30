import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure Testing Library
configure({
  asyncUtilTimeout: 1000,
  computedStyleSupportsPseudoElements: false,
  defaultHidden: true,
  throwSuggestions: true,
});

// Suppress Node.js punycode deprecation warning
const originalEmitWarning = process.emitWarning;
process.emitWarning = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('The `punycode` module is deprecated')) {
    return;
  }
  return originalEmitWarning.apply(process, args as any);
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Suppress specific console warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    // Skip React 18 strict mode warnings
    if (args[0]?.includes('Warning: ReactDOM.render is no longer supported')) {
      return;
    }
    // Skip act() warnings
    if (args[0]?.includes('Warning: `ReactDOMTestUtils.act` is deprecated')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});