# 📊 Monitoring and Maintenance Guide

## Overview
Comprehensive guide for monitoring FloworxV2 system health and performing routine maintenance.

---

## 🏥 Health Monitoring

### Automated Health Checks

**GitHub Actions Workflow:**
- **Schedule:** Every 6 hours
- **Workflow:** `.github/workflows/health-check.yml`
- **Reports:** Stored in `monitoring/health-report.json`

**Manual Health Check:**
```bash
node scripts/monitor-system-health.js
```

---

## 🔍 Key Health Indicators

### 1. Supabase Database
**Check:** Database connectivity and query performance

**Metrics:**
- Connection status
- Query response time
- Active connections
- Error rate

**Warning Signs:**
- ❌ Connection failures
- ⚠️ Slow query responses (> 1s)
- ⚠️ High error rates (> 5%)

**Action:**
```bash
# Test database connection
node scripts/test-database-connection.js

# Check table health
psql $SUPABASE_URL -c "SELECT * FROM pg_stat_user_tables;"
```

---

### 2. N8N Workflows
**Check:** Workflow status and execution health

**Metrics:**
- Active workflows count
- Execution success rate
- Average execution time
- Error rate

**Warning Signs:**
- ❌ Workflows not activating
- ⚠️ High execution failure rate (> 10%)
- ⚠️ Slow executions (> 30s)

**Action:**
```bash
# Validate credentials
node scripts/validate-n8n-credentials.js

# Fix refresh tokens
node scripts/fix-n8n-refresh-tokens.js
```

---

### 3. OAuth Credentials
**Check:** Token validity and refresh capability

**Metrics:**
- Credentials with refresh tokens
- Token expiry times
- Last refresh timestamp
- Scope completeness

**Warning Signs:**
- ❌ Missing refresh tokens
- ⚠️ Tokens expiring soon (< 5 min)
- ⚠️ Missing offline_access scope

**Action:**
```bash
# Check credential health
node scripts/validate-n8n-credentials.js

# Follow fix guide
# See: docs/fixes/OUTLOOK_OAUTH_REFRESH_TOKEN_FIX.md
```

---

### 4. Email Processing
**Check:** Email queue status and processing rate

**Metrics:**
- Emails processed (last 24h)
- Processing success rate
- Average processing time
- Queue backlog size

**Warning Signs:**
- ❌ Failed emails (> 5%)
- ⚠️ Growing backlog
- ⚠️ Slow processing (> 5 min per email)

**Action:**
```bash
# Check email queue
node scripts/check-email-queue.js

# Test email processing
node scripts/test-email-processing.js
```

---

### 5. Voice Analysis
**Check:** Analysis coverage and quality

**Metrics:**
- Users with voice analysis
- Analysis coverage percentage
- Average confidence scores
- Last analysis timestamp

**Warning Signs:**
- ⚠️ Low coverage (< 70%)
- ⚠️ Low confidence scores (< 0.6)
- ⚠️ Stale analysis (> 30 days)

**Action:**
```bash
# Test voice analysis
node test-voice-analysis-database.js

# Trigger analysis for user
node scripts/trigger-voice-analysis.js <USER_ID>
```

---

## 📅 Maintenance Schedule

### Daily Tasks
- [ ] Review system health report
- [ ] Check error logs
- [ ] Monitor email processing rate
- [ ] Verify workflow executions

**Commands:**
```bash
# Daily health check
node scripts/monitor-system-health.js

# Check recent errors
node scripts/check-recent-errors.js
```

---

### Weekly Tasks
- [ ] Review credential status
- [ ] Check for expired tokens
- [ ] Analyze email processing trends
- [ ] Review voice analysis coverage
- [ ] Clean up old test data

**Commands:**
```bash
# Weekly credential check
node scripts/validate-n8n-credentials.js

# Clean old data
node scripts/cleanup-old-test-data.js
```

---

### Monthly Tasks
- [ ] Full system audit
- [ ] Performance optimization review
- [ ] Update dependencies
- [ ] Review and update documentation
- [ ] Security audit
- [ ] Backup verification

**Commands:**
```bash
# Monthly audit
node scripts/comprehensive-audit.js

# Update dependencies
npm update
npm audit fix
```

---

## 🚨 Alert Thresholds

### Critical Alerts (Immediate Action)
- ❌ Supabase connection failed
- ❌ N8N API unreachable
- ❌ All credentials invalid
- ❌ Email processing stopped
- ❌ > 50% test failures

### Warning Alerts (Action Within 24h)
- ⚠️ Credentials missing refresh tokens
- ⚠️ Email processing slow
- ⚠️ Low voice analysis coverage
- ⚠️ Test failure rate > 10%

### Info Alerts (Review Next Week)
- ℹ️ Low email volume
- ℹ️ Unused credentials
- ℹ️ Old voice analysis data

---

## 🛠️ Maintenance Scripts

### System Health
```bash
node scripts/monitor-system-health.js      # Full health check
node scripts/test-complete-flow.js         # End-to-end test
```

### Credentials
```bash
node scripts/validate-n8n-credentials.js   # Validate credentials
node scripts/fix-n8n-refresh-tokens.js     # Fix refresh tokens
```

### Email & Voice Analysis
```bash
node test-voice-analysis-database.js       # Test voice analysis
node validate-email-voice-analysis.js      # Validate email parsing
```

### Database
```bash
node scripts/check-database-health.js      # Database health
node scripts/cleanup-old-data.js           # Clean old data
```

---

## 📊 Metrics Dashboard

### Key Performance Indicators (KPIs)

**System Availability:**
- Target: 99.9% uptime
- Measure: Health check success rate

**Email Processing:**
- Target: > 95% success rate
- Target: < 5 min average processing time

**Voice Analysis:**
- Target: > 80% user coverage
- Target: > 0.7 average confidence

**Credential Health:**
- Target: 100% with refresh tokens
- Target: 0 expired credentials

**Test Coverage:**
- Target: > 85%
- Current: 87% ✅

---

## 🔔 Notification Channels

### Email Alerts
Configure for critical issues:
- Database failures
- API outages
- Credential expirations

### Slack/Discord Webhooks
Configure for warnings:
- Low voice analysis coverage
- High error rates
- Test failures

### GitHub Issues
Automatically create issues for:
- Failed health checks
- Missing refresh tokens
- Critical system errors

---

## 📝 Incident Response

### When Health Check Fails

1. **Identify Issue:**
   - Check health report JSON
   - Review error messages
   - Check recent changes

2. **Assess Impact:**
   - Which services affected?
   - How many users impacted?
   - Is data at risk?

3. **Take Action:**
   - Follow relevant troubleshooting guide
   - Apply documented fixes
   - Monitor results

4. **Document:**
   - What happened
   - What was done
   - How to prevent

5. **Communicate:**
   - Update team
   - Notify affected users (if any)
   - Post-mortem review

---

## 📚 Related Documentation

- [Troubleshooting Guide](../guides/TROUBLESHOOTING_GUIDE.md)
- [OAuth Credential Management](../guides/OAUTH_CREDENTIAL_MANAGEMENT.md)
- [N8N Credential Troubleshooting](../systems/N8N_CREDENTIAL_TROUBLESHOOTING.md)
- [Outlook OAuth Fix](../fixes/OUTLOOK_OAUTH_REFRESH_TOKEN_FIX.md)

---

## 🎯 Maintenance Checklist

### Before Deployment
- [ ] Run full test suite
- [ ] Check system health
- [ ] Validate all credentials
- [ ] Backup database
- [ ] Review recent errors

### After Deployment
- [ ] Monitor error logs (1 hour)
- [ ] Check email processing
- [ ] Verify workflow executions
- [ ] Test critical user flows
- [ ] Update monitoring dashboards

### Weekly Review
- [ ] Review health reports
- [ ] Check credential expiry
- [ ] Analyze performance trends
- [ ] Update documentation
- [ ] Plan improvements

---

## 🚀 Performance Optimization

### Database
- Monitor slow queries
- Optimize indexes
- Review RLS policies
- Clean old data

### API
- Monitor response times
- Optimize heavy endpoints
- Implement caching
- Rate limit protection

### Email Processing
- Monitor queue size
- Optimize batch processing
- Parallel processing where possible
- Error recovery improvements

---

**Maintenance is key to system reliability!**

**Schedule:** Daily checks + Weekly reviews + Monthly audits  
**Tools:** Automated scripts + GitHub Actions + Manual reviews  
**Goal:** 99.9% uptime with proactive issue detection  

---

**Last Updated:** October 7, 2025  
**Review Frequency:** Monthly

