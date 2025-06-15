import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/test-path',
}))

// Mock BetterAuth
jest.mock('@/lib/auth-client', () => ({
  signIn: {
    email: jest.fn(),
  },
  signUp: {
    email: jest.fn(),
  },
  signOut: jest.fn(),
  useSession: jest.fn(() => ({
    data: null,
    isPending: false,
  })),
  authClient: {
    signOut: jest.fn(),
  },
}))

// Mock auth provider
jest.mock('@/components/auth-provider', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    session: null,
  })),
  AuthProvider: ({ children }) => children,
}))

// Mock file upload functions
jest.mock('@/lib/file-upload', () => ({
  uploadFile: jest.fn(),
  uploadMultipleFiles: jest.fn(),
  validateFileClient: jest.fn(() => ({ valid: true })),
  formatFileSize: jest.fn((size) => `${size} bytes`),
  getFileCategory: jest.fn(() => 'document'),
}))

// Global test environment setup
global.fetch = jest.fn()
global.URL.createObjectURL = jest.fn(() => 'mock-url')
global.URL.revokeObjectURL = jest.fn()