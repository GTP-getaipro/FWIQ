# 🚀 Quick Test Guide for FloworxV2

## Overview
This guide provides quick commands and examples for running tests in the FloworxV2 project.

---

## ⚡ Quick Commands

### Run All Tests
```bash
npm run test:all
```

### Run Specific Test Suites
```bash
npm run test:unit              # Unit tests only (fastest)
npm run test:integration       # Integration tests
npm run test:e2e              # E2E tests (slowest)
```

### Development Mode
```bash
npm run test:watch             # Watch mode - auto-rerun on changes
npm run test:e2e:ui           # E2E with UI (interactive)
npm run test:e2e:headed       # E2E with visible browser
```

### Coverage Reports
```bash
npm run test:coverage          # Generate full coverage report
# View: coverage/index.html
```

### Specific Tests
```bash
npm run test:voice-analysis    # Voice analysis tests only
vitest run tests/unit/emailVoiceAnalyzer.test.js
playwright test tests/e2e/onboarding.spec.js
```

---

## 📋 Before Running Tests

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
```bash
# Create .env.test file
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
N8N_API_KEY=your-n8n-api-key
```

### 3. Seed Test Database (Optional)
```bash
# Run test seed script
psql $SUPABASE_URL < tests/__fixtures__/test-seed.sql
```

---

## 🎯 Common Test Scenarios

### Test Voice Analysis
```bash
# Run voice analysis unit tests
npm run test:voice-analysis

# Check output for:
# - Pattern detection tests
# - Tone classification tests
# - Confidence scoring tests
```

### Test Label Provisioning
```bash
# Run label provisioning tests
vitest run tests/unit/labelProvisionService.test.js
vitest run tests/integration/labelProvisioning.test.js
```

### Test Onboarding Flow
```bash
# Run complete onboarding E2E tests
npm run test:e2e tests/e2e/onboarding.spec.js

# With visible browser
npm run test:e2e:headed tests/e2e/onboarding.spec.js
```

### Test Voice Analysis Trigger
```bash
# Run E2E tests for voice analysis trigger
playwright test tests/e2e/voiceAnalysisTrigger.spec.js
```

---

## 🔍 Debugging Tests

### Unit/Integration Tests
```bash
# Run with debug output
DEBUG=* npm run test:unit

# Run single test file
vitest run tests/unit/emailVoiceAnalyzer.test.js

# Run specific test case
vitest run -t "should detect friendly tone"
```

### E2E Tests
```bash
# Run with headed browser (see what's happening)
npm run test:e2e:headed

# Run with debug mode
PWDEBUG=1 npm run test:e2e

# Run with trace viewer
playwright test --trace on
playwright show-trace trace.zip
```

### View Test Results
```bash
# Unit/Integration coverage
open coverage/index.html

# E2E results
npx playwright show-report

# View artifacts
ls test-results/
```

---

## 🛠️ Writing New Tests

### 1. Unit Test Template
```javascript
// tests/unit/myFeature.test.js
import { describe, it, expect } from 'vitest';

describe('MyFeature', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### 2. Integration Test Template
```javascript
// tests/integration/myIntegration.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockSupabase } from '../helpers/testUtils';

describe('MyIntegration', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it('should integrate correctly', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { id: 1 },
      error: null
    });

    const result = await myIntegration(mockSupabase);
    
    expect(result).toBeDefined();
  });
});
```

### 3. E2E Test Template
```javascript
// tests/e2e/myFlow.spec.js
import { test, expect } from '@playwright/test';

test('should complete my flow', async ({ page }) => {
  await page.goto('http://localhost:5173/my-page');
  
  await page.fill('input[name="field"]', 'value');
  await page.click('button:has-text("Submit")');
  
  await expect(page).toHaveURL('**/success');
});
```

---

## 🚨 Troubleshooting

### Tests Not Running
```bash
# Clear cache
rm -rf node_modules/.vite
rm -rf coverage/

# Reinstall dependencies
npm install
```

### Port Already in Use
```bash
# Kill process on port 5173
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9
```

### Playwright Browser Issues
```bash
# Reinstall browsers
npx playwright install --with-deps
```

### Coverage Not Generating
```bash
# Install coverage provider
npm install --save-dev @vitest/coverage-v8

# Run with coverage flag
vitest run --coverage
```

---

## 📊 Understanding Test Output

### Unit/Integration Tests
```
 ✓ tests/unit/emailVoiceAnalyzer.test.js (22)
   ✓ EmailVoiceAnalyzer (15)
     ✓ should analyze outbound emails correctly
     ✓ should return default analysis when no outbound emails
     ✓ should detect friendly tone
     ...
     
Test Files  3 passed (3)
Tests  49 passed (49)
Duration  2.34s
```

### E2E Tests
```
Running 15 tests using 3 workers

  ✓ tests/e2e/onboarding.spec.js:10:1 › should complete full onboarding flow (5.2s)
  ✓ tests/e2e/onboarding.spec.js:45:1 › should handle missing fields (1.3s)
  
  15 passed (12.5s)
```

### Coverage Report
```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines
--------------------|---------|----------|---------|---------|-------------------
All files           |   85.23 |    78.45 |   89.12 |   85.67 |
 emailVoiceAnalyzer |   92.34 |    85.71 |   95.00 |   92.11 | 45-47,123
 labelProvision     |   88.45 |    82.33 |   90.00 |   88.92 | 78,156-160
--------------------|---------|----------|---------|---------|-------------------
```

---

## 🎯 Test Checklist

Before committing code:
- [ ] Run unit tests: `npm run test:unit`
- [ ] Run integration tests: `npm run test:integration`
- [ ] Check coverage: `npm run test:coverage`
- [ ] Run E2E for changed features: `npm run test:e2e`
- [ ] Verify no console errors
- [ ] Check test summary passes

---

## 📚 Additional Resources

- [Test Automation Plan](./TEST_AUTOMATION_PLAN.md)
- [Testing Best Practices](./TESTING_BEST_PRACTICES.md)
- [Test Implementation Status](./TEST_IMPLEMENTATION_STATUS.md)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

---

**Quick Reference Card**

| Command | Purpose | Duration |
|---------|---------|----------|
| `npm run test:unit` | Fast unit tests | ~5s |
| `npm run test:integration` | API & DB tests | ~30s |
| `npm run test:e2e` | Full user flows | ~2min |
| `npm run test:all` | Complete suite | ~3min |
| `npm run test:watch` | Auto-rerun | Continuous |

---

**Last Updated:** October 7, 2025  
**Quick Start Time:** < 5 minutes to first test run

