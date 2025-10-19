# ✅ Getting Started Checklist for FloworxV2

## Welcome, Developer! 👋

This checklist will help you get up and running with FloworxV2 quickly and efficiently.

---

## 📋 Phase 1: Environment Setup (15-30 minutes)

### 1. Clone & Install
- [ ] Clone repository: `git clone <repo-url>`
- [ ] Navigate to directory: `cd FloworxV2`
- [ ] Install dependencies: `npm install`
- [ ] Install test dependencies: `npm install --save-dev @playwright/test @vitest/ui @vitest/coverage-v8`
- [ ] Install Playwright browsers: `npx playwright install --with-deps`

### 2. Environment Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Set `VITE_OUTLOOK_CLIENT_ID` and `VITE_OUTLOOK_CLIENT_SECRET`
- [ ] Set `N8N_API_URL` and `N8N_API_KEY` (if using N8N)

### 3. Start Development Server
- [ ] Start frontend: `npm run dev`
- [ ] Start backend: `.\start-backend.ps1` (PowerShell)
- [ ] Verify: Open http://localhost:5173
- [ ] Verify: Backend on http://localhost:3001

---

## 📚 Phase 2: Documentation Review (30-60 minutes)

### Essential Reading
- [ ] Read [`docs/README.md`](./docs/README.md) - Documentation hub
- [ ] Read [`docs/guides/QUICK_START_GUIDE.md`](./docs/guides/QUICK_START_GUIDE.md)
- [ ] Review [`docs/architecture/FLOWORX_ARCHITECTURE_DIAGRAM.md`](./docs/architecture/FLOWORX_ARCHITECTURE_DIAGRAM.md)
- [ ] Skim [`docs/DOCUMENTATION_INDEX.md`](./docs/DOCUMENTATION_INDEX.md)

### Feature-Specific Reading
- [ ] Voice Analysis: [`docs/guides/EMAIL_VOICE_ANALYSIS_FLOW.md`](./docs/guides/EMAIL_VOICE_ANALYSIS_FLOW.md)
- [ ] Testing: [`docs/testing/QUICK_TEST_GUIDE.md`](./docs/testing/QUICK_TEST_GUIDE.md)
- [ ] Multi-Business: [`docs/guides/MULTI_BUSINESS_IMPLEMENTATION_GUIDE.md`](./docs/guides/MULTI_BUSINESS_IMPLEMENTATION_GUIDE.md)

---

## 🧪 Phase 3: Run Tests (10-15 minutes)

### Verify Test Setup
- [ ] Run unit tests: `npm run test:unit`
- [ ] Run integration tests: `npm run test:integration`
- [ ] Run E2E tests: `npm run test:e2e` (optional, takes longer)
- [ ] Check coverage: `npm run test:coverage`
- [ ] View coverage report: Open `coverage/index.html`

### Expected Results
- [ ] All tests should pass ✅
- [ ] Coverage should be visible
- [ ] No errors in console

---

## 🎯 Phase 4: Explore Key Features (30-45 minutes)

### 1. Onboarding Flow
- [ ] Create test account
- [ ] Complete email integration (Gmail or Outlook)
- [ ] Add team members in Team Setup
- [ ] Click "Save and Continue"
- [ ] Verify voice analysis trigger in console
- [ ] Complete business information

### 2. Voice Analysis System
- [ ] Open browser DevTools → Console
- [ ] Navigate to Team Setup
- [ ] Click "Save and Continue"
- [ ] Look for logs:
  - `🎤 Starting email voice analysis in background...`
  - `📧 Fetching recent emails...`
  - `📊 Voice Analysis Results:`
- [ ] Check for success notification

### 3. Label Provisioning
- [ ] After team setup, check email account
- [ ] Verify folders/labels created:
  - SALES, SERVICE, SUPPORT, etc.
  - Manager folders (dynamic)
  - Supplier folders (dynamic)
- [ ] Check database: `business_labels` table

---

## 🔍 Phase 5: Code Exploration (1-2 hours)

### Key Files to Understand

#### Frontend
- [ ] `src/pages/onboarding/StepTeamSetup.jsx` - Team setup & voice trigger
- [ ] `src/lib/emailVoiceAnalyzer.js` - Voice analysis logic
- [ ] `src/lib/labelProvisionService.js` - Label provisioning
- [ ] `src/contexts/SupabaseAuthContext.jsx` - Authentication

#### Backend
- [ ] `backend/src/routes/auth.js` - Auth endpoints
- [ ] `backend/src/routes/emails.js` - Email endpoints
- [ ] `backend/src/services/emailService.js` - Email processing

#### Tests
- [ ] `tests/unit/emailVoiceAnalyzer.test.js` - Example unit tests
- [ ] `tests/integration/voiceAnalysisFlow.test.js` - Example integration
- [ ] `tests/e2e/onboarding.spec.js` - Example E2E tests

---

## 🛠️ Phase 6: Make Your First Contribution (Variable)

### Small Changes
- [ ] Fix a typo in documentation
- [ ] Add a console log for debugging
- [ ] Update a comment

### Feature Work
- [ ] Pick a task from backlog
- [ ] Create feature branch
- [ ] Write tests first (TDD)
- [ ] Implement feature
- [ ] Run tests: `npm run test:all`
- [ ] Commit and push
- [ ] Create pull request

---

## 📖 Reference Documentation

### Architecture & Design
| Document | Purpose |
|----------|---------|
| [Architecture Diagram](./docs/architecture/FLOWORX_ARCHITECTURE_DIAGRAM.md) | System overview |
| [N8N Architecture](./docs/architecture/FLOWORX_N8N_ARCHITECTURE_BLUEPRINT.md) | N8N integration |
| [Multi-Business Runtime](./docs/architecture/MULTI_BUSINESS_RUNTIME_ARCHITECTURE.md) | Multi-tenant design |

### Implementation Guides
| Document | Purpose |
|----------|---------|
| [Complete Guide](./docs/guides/COMPLETE_IMPLEMENTATION_GUIDE.md) | Full implementation |
| [Email Voice Analysis](./docs/guides/EMAIL_VOICE_ANALYSIS_FLOW.md) | Voice analysis system |
| [Multi-Business Setup](./docs/guides/MULTI_BUSINESS_IMPLEMENTATION_GUIDE.md) | Multi-business features |

### Testing
| Document | Purpose |
|----------|---------|
| [Quick Test Guide](./docs/testing/QUICK_TEST_GUIDE.md) | Fast reference |
| [Test Automation Plan](./docs/testing/TEST_AUTOMATION_PLAN.md) | Complete strategy |
| [Best Practices](./docs/testing/TESTING_BEST_PRACTICES.md) | Testing guidelines |

---

## 🎓 Learning Path

### Week 1: Foundation
- [ ] Complete environment setup
- [ ] Read essential documentation
- [ ] Run all tests successfully
- [ ] Understand system architecture
- [ ] Complete onboarding flow manually

### Week 2: Deep Dive
- [ ] Study voice analysis implementation
- [ ] Understand label provisioning
- [ ] Review database schema
- [ ] Learn OAuth integration flow
- [ ] Write your first test

### Week 3: Contribution
- [ ] Pick a small task
- [ ] Implement with tests
- [ ] Review code patterns
- [ ] Submit pull request
- [ ] Participate in code review

---

## ✨ Pro Tips

### Development Workflow
1. **Always start with tests** - Write test first (TDD)
2. **Use watch mode** - `npm run test:watch` during development
3. **Check console logs** - Voice analysis logs everything
4. **Use fixtures** - Reuse mock data from `tests/__fixtures__/`
5. **Keep backend running** - Some features need backend API

### Debugging Tips
1. **Check console** - All systems log comprehensively
2. **Use browser DevTools** - Network tab for API calls
3. **Run E2E headed** - See what's happening: `npm run test:e2e:headed`
4. **Check database** - Use Supabase dashboard
5. **Review logs** - Backend logs show API errors

### Best Practices
1. **Follow AAA pattern** - Arrange-Act-Assert in tests
2. **One test, one thing** - Keep tests focused
3. **Mock external APIs** - Never call real APIs in tests
4. **Clean up after tests** - Use `afterEach` for cleanup
5. **Document complex logic** - Future you will thank you

---

## 🚨 Common Issues & Solutions

### Port Already in Use
```bash
# Kill process and restart
netstat -ano | findstr :5173
taskkill /PID <PID> /F
npm run dev
```

### Tests Failing
```bash
# Clear cache and reinstall
rm -rf node_modules coverage
npm install
npm run test:all
```

### Voice Analysis Not Triggering
- Check backend is running on port 3001
- Verify email integration exists
- Check browser console for errors
- Review logs in Team Setup

### Folders Not Creating
- Verify OAuth token is valid
- Check integration status in database
- Review 409 conflict logs (normal)
- Ensure backend API is accessible

---

## 📞 Getting Help

### Resources
1. **Documentation** - `docs/` directory
2. **Tests** - `tests/` directory (examples)
3. **Troubleshooting** - `docs/guides/TROUBLESHOOTING_GUIDE.md`
4. **Architecture** - `docs/architecture/`

### Support Channels
- Check documentation first
- Review existing tests
- Ask in team chat
- Create issue with details

---

## 🎯 Success Checklist

By the end of your first week, you should be able to:
- [ ] Run the application locally
- [ ] Complete the onboarding flow
- [ ] Trigger voice analysis
- [ ] Run all test suites
- [ ] Understand the architecture
- [ ] Write a simple test
- [ ] Navigate the codebase confidently
- [ ] Find relevant documentation quickly

---

## 🎉 You're Ready!

Once you've completed this checklist, you're ready to start contributing to FloworxV2!

**Welcome to the team! 🚀**

---

**Estimated Total Time:** 3-4 hours for complete onboarding  
**Difficulty:** Intermediate  
**Prerequisites:** Node.js, Git, basic React knowledge

---

**Last Updated:** October 7, 2025  
**Maintained By:** FloworxV2 Team
