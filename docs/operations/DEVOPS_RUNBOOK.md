# 🔧 DevOps Runbook for FloworxV2

## Purpose
Quick reference guide for common operational tasks, troubleshooting, and incident response.

---

## 🚀 Common Operations

### Start the System

**Development:**
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend && node src/server.js

# Terminal 3: (Optional) OAuth Server
.\start-oauth-server.ps1
```

**Production:**
```bash
# Using Docker
docker-compose up -d

# Using PM2
pm2 start ecosystem.config.js
pm2 logs
```

---

### Stop the System

**Development:**
```bash
# Ctrl+C in each terminal
# Or kill processes:
taskkill /F /IM node.exe
```

**Production:**
```bash
# Docker
docker-compose down

# PM2
pm2 stop all
pm2 delete all
```

---

### Restart Services

**Frontend:**
```bash
# Kill port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
npm run dev
```

**Backend:**
```bash
# Kill port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F
cd backend && node src/server.js
```

---

## 🔍 Diagnostic Commands

### Check Service Status
```bash
# Frontend (should show Vite server)
curl http://localhost:5173

# Backend (should return JSON)
curl http://localhost:3001/health

# N8N (should return JSON)
curl https://n8n.srv995290.hstgr.cloud/healthz
```

### Check Database
```bash
# Test connection
node scripts/test-database-connection.js

# Check table counts
node scripts/check-database-stats.js
```

### Check Credentials
```bash
# Validate N8N credentials
node scripts/validate-n8n-credentials.js

# Fix refresh tokens
node scripts/fix-n8n-refresh-tokens.js
```

### Check Email Processing
```bash
# View email queue
node scripts/check-email-queue.js

# Test email fetch
node scripts/test-email-fetching.js
```

---

## 🚨 Incident Response

### High Priority Incidents

#### 1. Database Connection Lost

**Symptoms:**
- 500 errors on all endpoints
- "Unable to connect to database" errors
- Supabase dashboard unreachable

**Diagnosis:**
```bash
# Test connection
curl $SUPABASE_URL/rest/v1/

# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

**Fix:**
1. Verify Supabase project is online
2. Check API keys are correct
3. Verify network connectivity
4. Restart backend services
5. Check Supabase status page

---

#### 2. OAuth Tokens Expired

**Symptoms:**
- 401 errors from Microsoft Graph
- "Invalid authentication token" errors
- Workflow failures in N8N

**Diagnosis:**
```bash
# Check credential status
node scripts/validate-n8n-credentials.js

# Check integration tokens
SELECT provider, status, access_token_expires_at 
FROM integrations 
WHERE status = 'active';
```

**Fix:**
1. Identify expired credentials
2. Reauthorize in N8N
3. Verify refresh token present
4. Reactivate workflows
5. Test with sample email

**See:** [Outlook OAuth Fix](../fixes/OUTLOOK_OAUTH_REFRESH_TOKEN_FIX.md)

---

#### 3. Email Processing Stopped

**Symptoms:**
- No emails being processed
- Queue growing
- No workflow executions

**Diagnosis:**
```bash
# Check email queue
SELECT COUNT(*), status FROM email_queue GROUP BY status;

# Check N8N workflow status
curl https://n8n.srv995290.hstgr.cloud/api/v1/workflows/slA6heIYjTr9tz1R \
  -H "Authorization: Bearer $N8N_API_KEY"
```

**Fix:**
1. Check N8N workflow is active
2. Verify credentials are valid
3. Test webhook endpoint
4. Check for API rate limits
5. Restart N8N if needed

---

#### 4. Voice Analysis Failing

**Symptoms:**
- "No sent emails found" errors
- Analysis not completing
- Missing voice_analysis data

**Diagnosis:**
```bash
# Test voice analysis
node test-voice-analysis-database.js

# Check email queue
SELECT COUNT(*), direction FROM email_queue 
WHERE client_id = '<USER_ID>' 
GROUP BY direction;
```

**Fix:**
1. Verify outbound emails exist
2. Check backend API running
3. Verify database queue accessible
4. Test with sample emails
5. Check console logs for errors

---

### Medium Priority Incidents

#### 1. Folder Creation Failures

**Symptoms:**
- 409 conflicts (normal)
- 401 unauthorized errors
- Folders not appearing

**Diagnosis:**
```bash
# List Outlook folders
node list-outlook-folders.js

# Check business labels
SELECT COUNT(*), provider FROM business_labels GROUP BY provider;
```

**Fix:**
- 409 conflicts: Normal, system handles gracefully
- 401 errors: Refresh OAuth credentials
- Missing folders: Check label provisioning logs

---

#### 2. Test Failures

**Symptoms:**
- CI/CD pipeline failing
- Local tests not passing
- Coverage dropping

**Diagnosis:**
```bash
# Run tests with verbose output
npm run test:unit -- --reporter=verbose

# Check specific failing test
vitest run tests/unit/emailVoiceAnalyzer.test.js
```

**Fix:**
1. Review test error messages
2. Check for code changes
3. Update test data if needed
4. Verify mocks are correct
5. Check for flaky tests

---

## 🔧 Routine Maintenance

### Daily (Automated)
- ✅ System health check
- ✅ Credential validation
- ✅ Error log review

### Weekly (Manual)
- [ ] Review health reports
- [ ] Check credential expiry
- [ ] Clean test data
- [ ] Review email queue
- [ ] Update documentation

### Monthly (Planned)
- [ ] Full system audit
- [ ] Performance review
- [ ] Security audit
- [ ] Dependency updates
- [ ] Backup verification

---

## 📊 Monitoring Dashboards

### GitHub Actions Dashboard
- View test results
- Monitor health checks
- Review deployment status

**URL:** `https://github.com/<your-repo>/actions`

### Supabase Dashboard
- Database metrics
- Query performance
- User activity
- Storage usage

**URL:** Your Supabase project dashboard

### N8N Dashboard
- Workflow executions
- Error rates
- Credential status
- Webhook activity

**URL:** `https://n8n.srv995290.hstgr.cloud`

---

## 📝 Logging

### Log Locations

**Frontend:**
- Browser console
- Network tab in DevTools

**Backend:**
- `backend/logs/` directory
- Console output

**N8N:**
- Execution logs in N8N UI
- Webhook logs

**Database:**
- Supabase dashboard → Logs
- Query logs

### Log Levels

**ERROR:** Critical issues requiring immediate attention
**WARN:** Potential issues to investigate
**INFO:** Normal operation information
**DEBUG:** Detailed debugging information

---

## 🔐 Security Maintenance

### Regular Security Tasks

**Weekly:**
- [ ] Review access logs
- [ ] Check for suspicious activity
- [ ] Verify RLS policies active

**Monthly:**
- [ ] Rotate API keys
- [ ] Update dependencies
- [ ] Security scan
- [ ] Review permissions

**Quarterly:**
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Access control review
- [ ] Credential rotation

---

## 📦 Backup and Recovery

### Backup Strategy

**Database:**
- Automated: Supabase daily backups
- Manual: Export before major changes

**Workflows:**
```bash
# Export N8N workflows
curl https://n8n.srv995290.hstgr.cloud/api/v1/workflows \
  -H "Authorization: Bearer $N8N_API_KEY" \
  > backup/workflows-$(date +%Y%m%d).json
```

**Configuration:**
- Environment variables
- Credential configs (encrypted)
- Application settings

### Recovery Procedures

**Database Recovery:**
1. Use Supabase point-in-time recovery
2. Or restore from manual backup
3. Verify data integrity
4. Test critical queries

**Workflow Recovery:**
1. Import workflow from backup JSON
2. Reconfigure credentials
3. Test workflow execution
4. Reactivate workflow

---

## 🎯 Performance Tuning

### Database Optimization
```sql
-- Find slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
ORDER BY idx_scan;
```

### API Optimization
- Enable caching for static data
- Implement rate limiting
- Optimize database queries
- Use connection pooling

### Email Processing
- Batch processing for high volume
- Parallel processing where safe
- Queue size monitoring
- Retry logic for failures

---

## 📚 Quick Reference

### Essential Commands
```bash
# Health Check
node scripts/monitor-system-health.js

# Validate Credentials
node scripts/validate-n8n-credentials.js

# Test Complete Flow
node scripts/test-complete-flow.js

# Run All Tests
npm run test:all

# Deploy
npm run deploy:production
```

### Essential URLs
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- N8N: https://n8n.srv995290.hstgr.cloud
- Supabase: https://oinxzvqszingwstrbdro.supabase.co

### Essential Files
- Environment: `.env`
- Backend Start: `start-backend.ps1`
- Health Monitor: `scripts/monitor-system-health.js`
- Action Plan: `IMMEDIATE_ACTION_PLAN.md`

---

## 🆘 Emergency Contacts

### Escalation Path
1. **Level 1:** Check runbook & documentation
2. **Level 2:** Review troubleshooting guides
3. **Level 3:** Check GitHub issues/discussions
4. **Level 4:** Contact system maintainer

### Critical Resources
- Documentation: `docs/`
- Troubleshooting: `docs/guides/TROUBLESHOOTING_GUIDE.md`
- Fix Guides: `docs/fixes/`
- Test Suite: `npm run test:all`

---

**This runbook is your first line of defense for operational issues!**

**Keep it updated as the system evolves.** 📝

---

**Last Updated:** October 7, 2025  
**Next Review:** November 7, 2025

