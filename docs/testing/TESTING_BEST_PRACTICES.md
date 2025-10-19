# 🧪 Testing Best Practices for FloworxV2

## Overview
This document outlines testing best practices, patterns, and guidelines for the FloworxV2 project.

---

## 📋 Table of Contents
1. [General Principles](#general-principles)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [E2E Testing](#e2e-testing)
5. [Test Data Management](#test-data-management)
6. [Mocking Strategies](#mocking-strategies)
7. [CI/CD Integration](#cicd-integration)
8. [Common Patterns](#common-patterns)

---

## 1. General Principles

### Test Pyramid
Follow the testing pyramid approach:
- **70% Unit Tests** - Fast, isolated, numerous
- **20% Integration Tests** - API contracts, database interactions
- **10% E2E Tests** - Critical user journeys only

### AAA Pattern
Structure all tests using Arrange-Act-Assert:
```javascript
it('should analyze email voice correctly', () => {
  // Arrange
  const mockEmails = [/* test data */];
  const analyzer = new EmailVoiceAnalyzer();
  
  // Act
  const result = analyzer.performVoiceAnalysis(mockEmails);
  
  // Assert
  expect(result.tone).toBe('professional');
});
```

### Test Independence
- Each test should run independently
- Use `beforeEach` to set up fresh state
- Avoid shared mutable state between tests
- Clean up after tests in `afterEach`

### Descriptive Names
```javascript
// ❌ Bad
it('works', () => {});

// ✅ Good
it('should detect friendly tone when email contains thank you and appreciation', () => {});
```

---

## 2. Unit Testing

### What to Test
- Pure functions
- Business logic
- Utility functions
- Data transformations
- Error handling

### What NOT to Test
- External libraries
- Framework internals
- Simple getters/setters
- Third-party APIs (mock them instead)

### Example Pattern
```javascript
describe('EmailVoiceAnalyzer', () => {
  describe('performVoiceAnalysis', () => {
    it('should return default analysis when no outbound emails', async () => {
      // Arrange
      const mockEmails = [{ direction: 'inbound', body_text: 'test' }];
      const analyzer = new EmailVoiceAnalyzer();
      
      // Act
      const result = await analyzer.performVoiceAnalysis(mockEmails, 'pools_spas');
      
      // Assert
      expect(result.skipped).toBe(true);
      expect(result.confidence).toBe(0);
    });
  });
});
```

---

## 3. Integration Testing

### What to Test
- API endpoints
- Database operations
- External service integrations
- OAuth flows (mocked)
- File system operations

### Mock External Services
```javascript
import { vi } from 'vitest';

// Mock fetch for Microsoft Graph API
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ id: 'folder-123', displayName: 'SALES' })
});
```

### Test Database Interactions
```javascript
it('should insert label into database', async () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null })
  };
  
  const result = await insertLabel(mockSupabase, labelData);
  
  expect(mockSupabase.from).toHaveBeenCalledWith('business_labels');
  expect(result.data).toHaveLength(1);
});
```

---

## 4. E2E Testing

### Critical Paths Only
Test only the most important user journeys:
- User signup and onboarding
- OAuth integration
- Key feature workflows
- Error scenarios

### Page Object Pattern
```javascript
// pages/TeamSetupPage.js
export class TeamSetupPage {
  constructor(page) {
    this.page = page;
    this.managerNameInput = page.locator('input[name="managers[0].name"]');
    this.managerEmailInput = page.locator('input[name="managers[0].email"]');
    this.saveButton = page.locator('button:has-text("Save and Continue")');
  }

  async addManager(name, email) {
    await this.managerNameInput.fill(name);
    await this.managerEmailInput.fill(email);
  }

  async save() {
    await this.saveButton.click();
  }
}

// Test usage
it('should save team data', async ({ page }) => {
  const teamSetup = new TeamSetupPage(page);
  await teamSetup.addManager('John Doe', 'john@example.com');
  await teamSetup.save();
  
  await expect(page).toHaveURL('**/business-information');
});
```

### Wait Strategies
```javascript
// ❌ Bad - arbitrary timeout
await page.waitForTimeout(3000);

// ✅ Good - wait for specific condition
await page.waitForURL('**/dashboard');
await page.waitForSelector('[data-testid="success-message"]');
```

---

## 5. Test Data Management

### Use Fixtures
Store test data in `tests/__fixtures__/`:
```javascript
import { mockTestUser, mockEmails } from '@tests/__fixtures__/mockData';

it('should use fixture data', () => {
  const result = processEmails(mockEmails.outbound);
  expect(result).toBeDefined();
});
```

### Seed Scripts
Use SQL seed scripts for database setup:
```sql
-- tests/__fixtures__/test-seed.sql
INSERT INTO profiles (id, email, business_type) VALUES
  ('test-id', 'test@example.com', 'pools_spas');
```

### Factory Pattern
```javascript
// tests/factories/userFactory.js
export function createMockUser(overrides = {}) {
  return {
    id: 'test-user-123',
    email: 'test@example.com',
    businessType: 'pools_spas',
    ...overrides
  };
}

// Usage
const user = createMockUser({ email: 'custom@example.com' });
```

---

## 6. Mocking Strategies

### Supabase Mocking
```javascript
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: mockData, error: null })
  }))
}));
```

### API Mocking with MSW
```javascript
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.get('https://graph.microsoft.com/v1.0/me/mailFolders', (req, res, ctx) => {
    return res(ctx.json({ value: mockFolders }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Partial Mocks
```javascript
// Mock only specific methods
vi.spyOn(EmailVoiceAnalyzer.prototype, 'analyzeWithAI')
  .mockResolvedValue({ tone: 'professional' });
```

---

## 7. CI/CD Integration

### Fast Feedback
- Run unit tests first (fastest)
- Run integration tests next
- Run E2E tests last (slowest)
- Fail fast on any error

### Parallel Execution
```yaml
# .github/workflows/test.yml
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
```

### Artifacts
```yaml
- name: Upload test results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: |
      coverage/
      test-results/
```

---

## 8. Common Patterns

### Testing Async Code
```javascript
it('should handle async operations', async () => {
  const promise = fetchData();
  await expect(promise).resolves.toBeDefined();
});

it('should handle async errors', async () => {
  const promise = fetchInvalidData();
  await expect(promise).rejects.toThrow('Invalid data');
});
```

### Testing Hooks
```javascript
import { renderHook } from '@testing-library/react';

it('should use custom hook', () => {
  const { result } = renderHook(() => useBusinessState());
  
  expect(result.current.businessType).toBe('pools_spas');
});
```

### Testing Components
```javascript
import { render, screen, fireEvent } from '@testing-library/react';

it('should render button and handle click', () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Click Me</Button>);
  
  const button = screen.getByText('Click Me');
  fireEvent.click(button);
  
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Testing Error Boundaries
```javascript
it('should catch and display error', () => {
  const ThrowError = () => { throw new Error('Test error'); };
  
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
});
```

---

## ✅ Checklist for New Tests

- [ ] Test is independent and isolated
- [ ] Uses AAA pattern (Arrange-Act-Assert)
- [ ] Has descriptive name
- [ ] Tests one thing only
- [ ] Handles both success and error cases
- [ ] Uses appropriate mocks
- [ ] Cleans up resources in `afterEach`
- [ ] Runs quickly (< 100ms for unit tests)
- [ ] Documented if complex logic

---

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW Documentation](https://mswjs.io/)

---

**Last Updated:** October 7, 2025  
**Maintained By:** FloworxV2 Team

