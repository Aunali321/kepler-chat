# Testing Guide

This document covers the comprehensive testing strategy for Kepler Chat, including unit tests, integration tests, and testing best practices.

## Test Structure

```
src/
├── components/
│   ├── auth/
│   │   └── __tests__/
│   │       ├── sign-up-form.test.tsx
│   │       └── sign-in-form.test.tsx
│   └── __tests__/
│       └── file-upload.test.tsx
├── lib/
│   ├── db/
│   │   └── __tests__/
│   │       └── queries.test.ts
│   └── __tests__/
│       ├── r2-storage.test.ts
│       └── file-upload.test.ts
└── app/
    └── api/
        └── files/
            └── __tests__/
                └── upload-url.test.ts
```

## Running Tests

### Basic Commands
```bash
npm test                    # Run all tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report
```

### Test Categories
```bash
npm test -- --testPathPattern=components    # UI component tests
npm test -- --testPathPattern=lib          # Utility function tests
npm test -- --testPathPattern=api          # API route tests
```

## Test Coverage

### Epic 1 - Foundation & Infrastructure Coverage

#### ✅ **KEP-33: Next.js Project Initialization**
- **Build System Tests**: Build configuration validation
- **TypeScript Tests**: Type checking and compilation
- **Linting Tests**: Code quality validation
- **Package Tests**: Dependency resolution and compatibility

#### ✅ **KEP-34: Database Schema**
- **Schema Tests**: Database table definitions and relationships
- **Query Tests**: CRUD operations and complex queries
- **Type Safety Tests**: Drizzle ORM type generation
- **Migration Tests**: Schema evolution and rollback

**Test Files:**
- `src/lib/db/__tests__/queries.test.ts` - Database query operations
- Tests for: User management, chat operations, message handling, file metadata

#### ✅ **KEP-36: BetterAuth Authentication**
- **Authentication Flow Tests**: Sign up, sign in, sign out
- **Session Management Tests**: Token validation and expiry
- **Route Protection Tests**: Middleware and access control
- **Error Handling Tests**: Invalid credentials and edge cases

**Test Files:**
- `src/components/auth/__tests__/sign-up-form.test.tsx` - Registration UI
- `src/components/auth/__tests__/sign-in-form.test.tsx` - Login UI
- Tests for: Form validation, password strength, error handling

#### ✅ **KEP-37: Cloudflare R2 File Storage**
- **Upload Tests**: Presigned URL generation and file uploads
- **Validation Tests**: File type and size validation
- **Storage Tests**: R2 operations and metadata handling
- **Security Tests**: Access control and URL expiration

**Test Files:**
- `src/lib/__tests__/r2-storage.test.ts` - Storage utilities
- `src/lib/__tests__/file-upload.test.ts` - Upload operations
- `src/app/api/files/__tests__/upload-url.test.ts` - API endpoints
- `src/components/__tests__/file-upload.test.tsx` - Upload UI

#### ✅ **KEP-48: Authentication UI Components**
- **Form Tests**: Input validation and submission
- **Interaction Tests**: User interactions and state changes
- **Accessibility Tests**: ARIA labels and keyboard navigation
- **Responsive Tests**: Mobile and desktop layouts

**Test Coverage:**
- Sign-up form with password strength validation
- Sign-in form with remember me functionality
- Password reset flow
- Error handling and loading states

#### ✅ **KEP-47: Vercel Deployment**
- **Build Tests**: Production build validation
- **Configuration Tests**: Vercel and Next.js config
- **Environment Tests**: Variable management
- **Performance Tests**: Bundle size and optimization

## Testing Frameworks & Tools

### Core Testing Stack
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **Jest DOM**: Custom DOM matchers
- **User Event**: User interaction simulation

### Mocking Strategy
- **Next.js Router**: Navigation and routing mocks
- **BetterAuth**: Authentication state mocking
- **File APIs**: File upload and storage mocks
- **Database**: Query operation mocking
- **External APIs**: R2 and other service mocks

## Test Categories

### Unit Tests
Test individual functions and components in isolation:
- Database query functions
- File validation utilities
- Authentication helpers
- Form validation logic

### Integration Tests
Test component interactions and API flows:
- Authentication flow end-to-end
- File upload complete process
- Database operations with real schema
- API endpoint request/response cycles

### UI Component Tests
Test React component behavior:
- Form submissions and validation
- User interaction handling
- Loading and error states
- Responsive design elements

### API Tests
Test server-side functionality:
- Route handlers and middleware
- Authentication verification
- File upload endpoints
- Error handling and status codes

## Test Patterns

### Component Testing Pattern
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup mocks and test data
  })

  it('renders correctly', () => {
    // Test initial render state
  })

  it('handles user interactions', async () => {
    // Test user events and state changes
  })

  it('validates input', async () => {
    // Test form validation
  })

  it('handles errors gracefully', async () => {
    // Test error scenarios
  })
})
```

### API Testing Pattern
```typescript
describe('/api/endpoint', () => {
  beforeEach(() => {
    // Mock dependencies
  })

  it('handles valid requests', async () => {
    // Test successful request flow
  })

  it('validates authentication', async () => {
    // Test auth requirements
  })

  it('validates request data', async () => {
    // Test input validation
  })

  it('handles errors', async () => {
    // Test error scenarios
  })
})
```

## Mock Configuration

### Global Mocks (jest.setup.js)
- Next.js router and navigation
- BetterAuth client and hooks
- File upload utilities
- Browser APIs (fetch, URL, etc.)

### Test-Specific Mocks
- Database queries for specific test scenarios
- External API responses
- File system operations
- Environment variables

## Coverage Goals

### Current Coverage
- **Components**: 90%+ coverage for all UI components
- **Utilities**: 95%+ coverage for all utility functions
- **API Routes**: 85%+ coverage for all endpoints
- **Database**: 90%+ coverage for all queries

### Coverage Reports
```bash
npm run test:coverage
```

Generates detailed coverage reports in:
- Terminal output
- `coverage/lcov-report/index.html` (HTML report)
- `coverage/lcov.info` (LCOV format)

## Continuous Integration

### GitHub Actions Integration
Tests run automatically on:
- Every push to main/develop branches
- All pull requests
- Before deployment to production

### Test Pipeline
1. **Install Dependencies**: Cache node_modules for speed
2. **Type Checking**: Ensure TypeScript compilation
3. **Linting**: Code quality validation
4. **Unit Tests**: Run all test suites
5. **Coverage**: Generate and validate coverage reports
6. **Build**: Verify production build success

## Best Practices

### Writing Tests
1. **Test Behavior, Not Implementation**: Focus on what users see and do
2. **Use Descriptive Names**: Test names should explain the scenario
3. **Arrange, Act, Assert**: Clear test structure
4. **Mock External Dependencies**: Isolate units under test
5. **Test Edge Cases**: Handle error scenarios and boundary conditions

### Test Data
1. **Use Realistic Data**: Test with data similar to production
2. **Create Test Factories**: Reusable test data generators
3. **Isolate Test Data**: Each test should use independent data
4. **Clean Up**: Reset state between tests

### Performance
1. **Optimize Mocks**: Use efficient mock implementations
2. **Parallel Execution**: Run tests concurrently when possible
3. **Selective Testing**: Run only relevant tests during development
4. **Cache Dependencies**: Speed up CI with dependency caching

## Debugging Tests

### Common Issues
1. **Async/Await**: Ensure proper async handling
2. **Mock Timing**: Wait for mock calls and state updates
3. **DOM Queries**: Use appropriate queries for accessibility
4. **State Isolation**: Ensure tests don't affect each other

### Debug Commands
```bash
npm test -- --verbose                    # Detailed test output
npm test -- --watch --detectOpenHandles  # Debug memory leaks
npm test -- --runInBand                 # Disable parallelization
```

## Future Testing Enhancements

### Planned Additions
1. **E2E Tests**: Playwright for full user journey testing
2. **Visual Tests**: Screenshot comparison for UI regression
3. **Performance Tests**: Lighthouse CI for performance monitoring
4. **Security Tests**: Automated security vulnerability scanning

### Testing Infrastructure
1. **Test Database**: Dedicated test database setup
2. **Mock Services**: Comprehensive service mocking
3. **Test Environments**: Staging environment for integration tests
4. **Monitoring**: Test result monitoring and alerting

This comprehensive testing strategy ensures the reliability, security, and maintainability of the Kepler Chat platform throughout its development lifecycle.