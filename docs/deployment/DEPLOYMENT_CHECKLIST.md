# Floworx Profile System Rollout Checklist

## Pre-Deployment Checklist

### ✅ Code Quality & Testing
- [ ] All unit tests passing (`npm test`)
- [ ] Contract tests passing (`npm run test:contract`)
- [ ] Golden file tests passing (`npm run test:golden`)
- [ ] Property-based tests passing (`npm run test:props`)
- [ ] Error handling tests passing (`npm run test:error`)
- [ ] Cache behavior tests passing (`npm run test:cache`)
- [ ] Integration tests passing (`npm run test:integration`)
- [ ] Smoke tests passing (`npm run smoke:build-n8n`)
- [ ] Code coverage ≥ 80% (`npm run test:coverage`)
- [ ] Linting passes (`npm run lint`)

### ✅ Feature Flags & Configuration
- [ ] Feature flags configured in environment
- [ ] Rollout percentages set to 0% in production
- [ ] Canary users identified and added to feature flags
- [ ] Disabled users list maintained
- [ ] Environment variables documented

### ✅ Monitoring & Alerting
- [ ] SLOs defined and configured
- [ ] Monitoring dashboards deployed
- [ ] Alert thresholds configured
- [ ] Error tracking enabled
- [ ] Performance metrics collection active

### ✅ Database & Infrastructure
- [ ] Database migrations applied
- [ ] Backup procedures tested
- [ ] Rollback procedures documented
- [ ] Cache configuration validated
- [ ] Performance baseline established

## Deployment Phases

### Phase 1: Shadow Builds (1-2 days)
- [ ] Deploy to staging environment
- [ ] Enable shadow builds (generate but don't use)
- [ ] Compare shadow vs production artifacts
- [ ] Log structured deltas
- [ ] Validate template generation
- [ ] Test error handling paths
- [ ] Verify cache behavior

### Phase 2: Canary Rollout (5% → 25% → 100%)
- [ ] **5% Rollout**
  - [ ] Enable for 5% of users
  - [ ] Monitor for 30 minutes
  - [ ] Check SLO compliance
  - [ ] Verify error rates
  - [ ] Validate cache hit rates
  - [ ] Check template selection performance

- [ ] **25% Rollout**
  - [ ] Increase to 25% if 5% successful
  - [ ] Monitor for 1 hour
  - [ ] Check system health
  - [ ] Verify performance metrics
  - [ ] Validate user experience

- [ ] **100% Rollout**
  - [ ] Increase to 100% if 25% successful
  - [ ] Monitor for 2 hours
  - [ ] Verify all SLOs met
  - [ ] Check error rates
  - [ ] Validate performance

### Phase 3: Post-Deployment (24-48 hours)
- [ ] Monitor system health for 24 hours
- [ ] Verify all metrics within SLOs
- [ ] Check user feedback
- [ ] Validate error rates
- [ ] Confirm performance improvements
- [ ] Document lessons learned

## SLOs & Monitoring

### Performance SLOs
- **Build Latency P95**: ≤ 400ms (warn at 600ms)
- **Build Error Rate**: ≤ 0.5% (warn at 1%)
- **Cache Hit Rate**: ≥ 85% (warn at 75%)
- **Template Selection Latency P95**: ≤ 80ms (warn at 150ms)

### Monitoring Dashboards
- [ ] Build duration histogram
- [ ] Error breakdown by class
- [ ] Cache hit/miss rates
- [ ] Retry counts and backoff
- [ ] Top failing templates
- [ ] Validation score distribution
- [ ] Feature flag status
- [ ] Rollout progress

### Alerting Rules
- [ ] High build latency alert
- [ ] High error rate alert
- [ ] Low cache hit rate alert
- [ ] System health degradation alert
- [ ] Feature flag rollback alert

## Rollback Procedures

### Automatic Rollback Triggers
- [ ] Build latency P95 > 600ms for 5 minutes
- [ ] Error rate > 1% for 5 minutes
- [ ] Cache hit rate < 75% for 5 minutes
- [ ] System health = 'critical' for 2 minutes

### Manual Rollback Steps
1. [ ] Pause rollout immediately
2. [ ] Set feature flag to 0%
3. [ ] Revert to legacy system
4. [ ] Monitor system recovery
5. [ ] Investigate root cause
6. [ ] Document incident

### Rollback Verification
- [ ] System returns to baseline performance
- [ ] Error rates return to normal
- [ ] User experience restored
- [ ] All SLOs met
- [ ] Incident documented

## Migration & Compatibility

### Backward Compatibility
- [ ] Legacy `business_type` field still supported
- [ ] Old profile format still works
- [ ] Existing workflows continue functioning
- [ ] No breaking changes introduced

### Data Migration
- [ ] `business_types` column populated from `business_type`
- [ ] Profile data normalized
- [ ] Cache warmed up
- [ ] Templates preloaded

### Gradual Migration
- [ ] Read both old and new fields
- [ ] Write to both fields during transition
- [ ] Monitor migration progress
- [ ] Plan deprecation timeline

## Success Criteria

### Technical Success
- [ ] All SLOs met consistently
- [ ] Error rates below baseline
- [ ] Performance improved by 50%+
- [ ] Cache hit rate > 85%
- [ ] Zero data loss incidents

### User Experience Success
- [ ] Faster profile loading
- [ ] More reliable template selection
- [ ] Better error recovery
- [ ] Improved system responsiveness
- [ ] Positive user feedback

### Business Success
- [ ] Reduced support tickets
- [ ] Improved system reliability
- [ ] Better scalability
- [ ] Enhanced maintainability
- [ ] Cost savings achieved

## Post-Deployment Tasks

### Documentation
- [ ] Update API documentation
- [ ] Update user guides
- [ ] Document new features
- [ ] Update troubleshooting guides
- [ ] Create migration guides

### Training
- [ ] Train support team
- [ ] Update runbooks
- [ ] Conduct knowledge transfer
- [ ] Document operational procedures
- [ ] Create monitoring runbooks

### Cleanup
- [ ] Remove old code paths
- [ ] Clean up unused configurations
- [ ] Archive old templates
- [ ] Optimize database queries
- [ ] Update monitoring thresholds

## Emergency Contacts

### On-Call Team
- **Primary**: [Name] - [Phone] - [Email]
- **Secondary**: [Name] - [Phone] - [Email]
- **Escalation**: [Name] - [Phone] - [Email]

### Key Stakeholders
- **Product Manager**: [Name] - [Email]
- **Engineering Manager**: [Name] - [Email]
- **DevOps Lead**: [Name] - [Email]
- **QA Lead**: [Name] - [Email]

### External Dependencies
- **N8N Service**: [Contact] - [Status Page]
- **Database**: [Contact] - [Status Page]
- **CDN**: [Contact] - [Status Page]
- **Monitoring**: [Contact] - [Status Page]

## Sign-off

### Pre-Deployment Sign-off
- [ ] **Engineering Lead**: [Name] - [Date] - [Signature]
- [ ] **QA Lead**: [Name] - [Date] - [Signature]
- [ ] **DevOps Lead**: [Name] - [Date] - [Signature]
- [ ] **Product Manager**: [Name] - [Date] - [Signature]

### Post-Deployment Sign-off
- [ ] **Engineering Lead**: [Name] - [Date] - [Signature]
- [ ] **QA Lead**: [Name] - [Date] - [Signature]
- [ ] **DevOps Lead**: [Name] - [Date] - [Signature]
- [ ] **Product Manager**: [Name] - [Date] - [Signature]

---

**Deployment Date**: [Date]
**Deployment Window**: [Time]
**Rollback Window**: [Time]
**Success Criteria**: [Criteria]
**Risk Level**: [Low/Medium/High]
