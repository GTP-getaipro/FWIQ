# 🧪 FloworxV2 Test Automation Plan

## 📘 Objective

To validate that every module in the FloworxV2 system (Frontend, Backend, Supabase, and N8N integrations) functions correctly, both individually and as part of the end-to-end workflow — using **automated tests** executed in CI/CD.

---

## 🧩 1. Test Architecture Overview

| Layer                   | Tooling                          | Purpose                                        |
| ----------------------- | -------------------------------- | ---------------------------------------------- |
| **Unit Tests**          | Vitest / Jest                    | Validate individual functions (no network)     |
| **Integration Tests**   | Supertest + Supabase client mock | Verify APIs and database contracts             |
| **E2E Workflow Tests**  | Playwright / Cypress             | Simulate real user flow (OAuth → n8n → DB)     |
| **Contract Validation** | Custom validator (already built) | Verify schema, API, and workflow compatibility |
| **CI/CD Execution**     | GitHub Actions                   | Run tests automatically on every push          |

---

## 🧱 2. Modules & Test Scope

### A. Frontend Modules

| Module                              | Test Focus                             | Tool                | Key Scenarios                                                                             |
| ----------------------------------- | -------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------- |
| **Auth & Onboarding (Step1–Step4)** | UI logic, state persistence, redirects | Playwright / Vitest | - New user signup<br>- OAuth callback validation<br>- Handling missing fields             |
| **Step2Email (OAuth Integration)**  | Token validation, refresh flow         | Vitest / MSW        | - Gmail + Outlook OAuth success<br>- Token refresh auto-retry<br>- Expired token handling |
| **Step3TeamSetup**                  | Voice analysis trigger                 | Vitest              | - Team data saves correctly<br>- Voice analysis triggers<br>- Folder provisioning starts  |
| **Dashboard / Workflows**           | Display + Sync                         | Cypress             | - List active workflows<br>- View sync logs<br>- Trigger manual sync                      |

---

### B. Backend Modules

| Module                      | Test Focus                             | Tool                        | Key Scenarios                                                                                                         |
| --------------------------- | -------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Supabase Edge Functions** | Auth validation, RLS policy compliance | Jest / Supabase Test Client | - Authenticated insert to each table<br>- Unauthorized access rejection<br>- Policy enforcement for `business_labels` |
| **Workflow Deployer**       | n8n API integration                    | Jest + Nock (mock N8N)      | - Deploy workflow<br>- Activate workflow<br>- Handle 409 (already exists)                                             |
| **n8nCredentialCreator**    | Credential lifecycle                   | Jest                        | - Create new credential<br>- Update existing<br>- Handle OAuth refresh token rotation                                 |
| **Label Synchronizer**      | Folder creation + DB sync              | Jest + MS Graph mock        | - Create missing Outlook folders<br>- Handle 409 gracefully<br>- Upsert `business_labels`                             |
| **Email Voice Analyzer**    | Email parsing & analysis               | Jest                        | - Parse outbound emails<br>- Detect voice patterns<br>- Store analysis results                                        |

---

### C. Database (Supabase)

| Table               | Test Type             | Scenario                                          |
| ------------------- | --------------------- | ------------------------------------------------- |
| **profiles**        | Schema validation     | Required fields exist, voice_analysis JSONB       |
| **integrations**    | CRUD tests            | Insert / select per `auth.uid()`                  |
| **business_labels** | RLS & upsert          | Ensure `auth.uid()` = `business_id` policy passes |
| **workflows**       | Referential integrity | Must reference valid credential IDs               |
| **email_queue**     | Email storage         | Proper storage of inbound/outbound emails         |

**Tool:** Supabase test client + `pgTAP` (optional)

---

### D. N8N Integration Layer

| Module                    | Test Focus          | Tool              | Key Scenarios                                                          |
| ------------------------- | ------------------- | ----------------- | ---------------------------------------------------------------------- |
| **API Connectivity**      | Endpoint validation | Jest + Axios mock | - `/api/v1/workflows` reachable<br>- `/api/v1/credentials` returns 200 |
| **Workflow Deployment**   | Node integrity      | Jest              | - Ensure node count > 5<br>- Contains webhook + DB update nodes        |
| **Credential Activation** | OAuth linking       | Jest              | - Ensure credential assigned before activation                         |

---

### E. AI & Voice Automation

| Component               | Test Focus                 | Tool             | Key Scenarios                                 |
| ----------------------- | -------------------------- | ---------------- | --------------------------------------------- |
| **AI Classifier**       | Intent + Category accuracy | Jest             | - Match known intent samples                  |
| **Voice Analysis**      | Pattern detection          | Jest             | - Detect tone, empathy, formality             |
| **Email Parser**        | Content extraction         | Jest             | - Parse body_text, extract patterns           |

---

## 🧩 3. Test Data Management

* **Seed Scripts:** `tests/__fixtures__/test-seed.sql` for minimal dataset
* **Fixtures:** `tests/__fixtures__/` for JSON-based mocks (OAuth responses, N8N payloads)
* **Isolation:** Each test uses a **temporary Supabase schema** or `test_user_id` to avoid production data impact
* **Reset:** Truncate or rollback after each test run
* **Test User:** `test_user_id = '00000000-0000-0000-0000-000000000000'`

---

## ⚙️ 4. Execution Plan

### Local Development

```bash
npm run test:unit              # Unit tests only
npm run test:integration       # Integration with mocks
npm run test:e2e              # Full browser test
npm run test:db               # Database schema tests
npm run test:voice-analysis   # Email voice analysis tests
npm run test:all              # Run all tests
npm run test:coverage         # Generate coverage report
```

### Continuous Integration (CI)

`.github/workflows/test.yml`:

```yaml
name: CI - Automated Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    env:
      SUPABASE_URL: ${{ secrets.SUPABASE_TEST_URL }}
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_TEST_KEY }}
      N8N_API_KEY: ${{ secrets.N8N_TEST_KEY }}
      
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run contract validation
        run: npm run validate-contracts
        
      - name: Run unit tests
        run: npm run test:unit
        
      - name: Run integration tests
        run: npm run test:integration
        
      - name: Run database tests
        run: npm run test:db
        
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Generate coverage report
        run: npm run test:coverage
        
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          
      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            coverage/
            test-results/
```

---

## 🧠 5. Coverage Goals

| Layer               | Target Coverage                     | Current Status |
| ------------------- | ----------------------------------- | -------------- |
| Unit                | ≥ 90%                               | 🔶 In Progress |
| Integration         | ≥ 80%                               | 🔶 In Progress |
| E2E                 | Key paths only (happy + error flow) | 🔶 In Progress |
| Contract Validation | 100% enforced                       | ✅ Complete    |

---

## 🚀 6. Phase Plan

| Phase       | Focus                             | Timeline | Status |
| ----------- | --------------------------------- | -------- | ------ |
| **Phase 1** | Unit & Integration (Core modules) | Week 1-2 | 🔶 Active |
| **Phase 2** | RLS + Supabase Edge tests         | Week 3   | 📋 Planned |
| **Phase 3** | E2E (OAuth + n8n)                 | Week 4   | 📋 Planned |
| **Phase 4** | Regression + CI/CD gates          | Week 5   | 📋 Planned |

---

## 📈 7. Reporting

* **Vitest + Jest** → JUnit + HTML report in `coverage/`
* **Playwright / Cypress** → Video recordings + traces in `test-results/`
* **GitHub Actions** → Test summary annotations + badges
* **Coverage Badge** → Display on README.md
* **Daily Reports** → Slack/Email notifications for CI failures

### Report Structure

```
test-results/
├── unit/
│   ├── coverage/
│   │   ├── index.html
│   │   └── coverage-final.json
│   └── results.xml
├── integration/
│   ├── coverage/
│   └── results.xml
├── e2e/
│   ├── videos/
│   ├── screenshots/
│   └── traces/
└── summary.json
```

---

## 🔒 8. Exit Criteria

✅ All modules meet defined coverage targets
✅ No open critical defects
✅ Workflow activation runs without manual steps
✅ Contract validation passes 100%
✅ CI/CD test suite runs cleanly on merge
✅ Email voice analysis system validated
✅ Multi-business folder creation tested
✅ OAuth token refresh flow validated
✅ RLS policies verified for all tables

---

## 📝 9. Test Categories

### Priority 1 (Critical Path)
- User authentication & signup
- OAuth integration (Gmail/Outlook)
- Email folder provisioning
- Workflow deployment
- Database RLS policies

### Priority 2 (Core Features)
- Email voice analysis
- Team setup & reconfiguration
- Label synchronization
- Multi-business support
- Token refresh flow

### Priority 3 (Enhanced Features)
- Dashboard analytics
- AI classification
- Voice pattern detection
- Business type extensions

---

## 🛠️ 10. Tools & Dependencies

### Testing Frameworks
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "jest": "^29.0.0",
    "@playwright/test": "^1.40.0",
    "cypress": "^13.0.0",
    "supertest": "^6.3.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "msw": "^2.0.0",
    "nock": "^13.0.0"
  }
}
```

### Mocking Libraries
- **MSW** (Mock Service Worker) - API mocking
- **Nock** - HTTP request mocking
- **Supabase Test Client** - Database mocking

---

## 🔄 11. Maintenance Plan

### Weekly
- Review failed tests
- Update test data fixtures
- Monitor coverage metrics

### Monthly
- Review and update test cases
- Refactor flaky tests
- Update documentation

### Quarterly
- Comprehensive test suite audit
- Performance optimization
- Tool upgrades

---

## 📚 12. Resources

### Documentation
- [Testing Best Practices](./TESTING_BEST_PRACTICES.md)
- [Test Data Management](./TEST_DATA_MANAGEMENT.md)
- [CI/CD Integration](./CICD_INTEGRATION.md)

### Examples
- [Unit Test Examples](../examples/unit-tests/)
- [Integration Test Examples](../examples/integration-tests/)
- [E2E Test Examples](../examples/e2e-tests/)

---

## 🎯 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Test Coverage | ≥ 85% | 🔶 TBD |
| Build Success Rate | ≥ 95% | 🔶 TBD |
| Test Execution Time | < 10 min | 🔶 TBD |
| Flaky Test Rate | < 2% | 🔶 TBD |
| Bug Detection Rate | ≥ 80% | 🔶 TBD |

---

**Last Updated:** October 7, 2025  
**Status:** Phase 1 - Implementation in Progress  
**Next Review:** Week of October 14, 2025

