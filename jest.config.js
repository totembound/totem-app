import '@testing-library/jest-dom';


// Suppress Node.js punycode deprecation warning
const originalEmitWarning = process.emitWarning;
process.emitWarning = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('The `punycode` module is deprecated')) {
    return;
  }
  return originalEmitWarning.apply(process, args);
};

// Suppress React testing warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (/Warning: ReactDOM.render is no longer supported in React 18/.test(args[0])) {
      return;
    }
    if (/Warning: `ReactDOMTestUtils.act` is deprecated/.test(args[0])) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

module.exports = {
    collectCoverageFrom: [
      'src/**/*.{js,jsx,ts,tsx}',
      '!src/**/*.d.ts',
      '!src/index.tsx',
      '!src/serviceWorker.ts',
      '!src/reportWebVitals.ts',
      '!src/setupTests.ts'
    ],
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    coverageReporters: ['text', 'lcov', 'html'],
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1'
    },
    transform: {
      '^.+\\.(ts|tsx)$': 'ts-jest'
    }
  };