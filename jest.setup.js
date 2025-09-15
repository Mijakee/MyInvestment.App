// Jest setup file
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }
  },
}))

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to silence console outputs
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}