# 🚀 Auto-Profile System - Production Go-Live Checklist

## ✅ **Deploy in 7 Steps**

### 1. **Database Setup**
```bash
# Run the enhanced schema
psql -d your_database -f extracted-business-profiles-schema.sql

# Verify tables created
psql -d your_database -c "\dt extracted_business_profiles"
psql -d your_database -c "\dt profile_analysis_jobs"
psql -d your_database -c "\dt analytics_events"
```

**Required Tables:**
- ✅ `extracted_business_profiles` - Stores AI-extracted profiles
- ✅ `profile_analysis_jobs` - Tracks background jobs
- ✅ `profile_application_logs` - Logs when users apply suggestions
- ✅ `ai_analysis_logs` - AI analysis audit trail
- ✅ `analytics_events` - Observability events
- ✅ `voice_training_jobs` - Voice training tracking
- ✅ `pii_access_logs` - PII access audit
- ✅ `analysis_audit_trail` - Analysis audit trail

**RLS Policies:** ✅ All tables have proper Row Level Security enabled

---

### 2. **Environment Variables**
```bash
# Required secrets
export OPENAI_API_KEY="sk-..."
export VITE_SUPABASE_URL="https://..."
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# OAuth credentials
export GOOGLE_CLIENT_ID="..."
export GOOGLE_CLIENT_SECRET="..."
export MS_GRAPH_CLIENT_ID="..."
export MS_GRAPH_CLIENT_SECRET="..."

# Optional configuration
export CONFIDENCE_THRESHOLD="0.70"
export DEFAULT_TIMEZONE="America/New_York"
export DEFAULT_CURRENCY="USD"
export N8N_WEBHOOK_URL_VOICE_TRAINING="https://your-n8n.com/webhook/voice-training/start"
export N8N_WEBHOOK_URL_BUSINESS_PROFILE="https://your-n8n.com/webhook/business-profile/analyze"
```

---

### 3. **n8n Workflows Import**
```bash
# Import workflows
n8n import:workflow business-profile-analysis-workflow.json
n8n import:workflow voice-training-workflow.json

# Configure credentials
# - Gmail OAuth2 (per-tenant)
# - Microsoft Graph OAuth2 (per-tenant)
# - OpenAI API credentials
```

**Webhook Endpoints:**
- ✅ `/webhook/business-profile/analyze` - Business profile analysis
- ✅ `/webhook/voice-training/start` - Voice training analysis

---

### 4. **API Endpoints Deployment**
```bash
# Deploy API endpoints
cp src/pages/api/auto-profile/analyze.js /path/to/api/auto-profile/
cp src/pages/api/auto-profile/apply.js /path/to/api/auto-profile/
cp src/pages/api/ai/analyze-business-profile.js /path/to/api/ai/

# Test endpoints
curl -X POST https://your-domain.com/api/auto-profile/analyze \
  -H "Content-Type: application/json" \
  -d '{"businessId": "test-uuid"}'
```

**API Contracts:**
- ✅ `POST /api/auto-profile/analyze` - Start analysis
- ✅ `GET /api/auto-profile/suggestions?businessId=...` - Get suggestions
- ✅ `POST /api/auto-profile/apply` - Apply suggestions

---

### 5. **App Integration**
```javascript
// After OAuth success → enqueue background jobs
await Promise.all([
  fetch('/api/auto-profile/analyze', {
    method: 'POST',
    body: JSON.stringify({ businessId: user.id })
  }),
  fetch('/api/voice-training/start', {
    method: 'POST', 
    body: JSON.stringify({ businessId: user.id })
  })
]);

// Business Info page fetches suggestions
const suggestions = await fetch(`/api/auto-profile/suggestions?businessId=${user.id}`);
```

**Integration Points:**
- ✅ OAuth completion triggers analysis
- ✅ Business Info page shows "✨ AI-suggested" badges
- ✅ Confidence ≥0.70 fields are highlighted
- ✅ Preview and re-run analysis options

---

### 6. **Permissions & Scopes**
```javascript
// Gmail scopes
const gmailScopes = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send'
];

// Outlook scopes  
const outlookScopes = [
  'https://graph.microsoft.com/Mail.Read',
  'https://graph.microsoft.com/Mail.ReadWrite',
  'https://graph.microsoft.com/Mail.Send'
];
```

**Required Scopes:**
- ✅ Gmail: `gmail.readonly`, `gmail.modify`, `gmail.send`
- ✅ Outlook: `Mail.Read`, `Mail.ReadWrite`, `Mail.Send`
- ✅ Sent mailbox access for tone extraction

---

### 7. **UX & Fallbacks**
```javascript
// Fallback message for low confidence
if (suggestions.length === 0 || avgConfidence < 0.70) {
  showMessage(
    "We didn't find enough reliable info in your mailbox, " +
    "so we prefilled safe defaults. You can edit anytime."
  );
}

// Preview and re-run options
<Button onClick={previewChanges}>Preview Changes</Button>
<Button onClick={rerunAnalysis}>Re-run Analysis</Button>
```

**UX Features:**
- ✅ Graceful fallback for low confidence
- ✅ Preview applied changes
- ✅ Re-run analysis option
- ✅ Clear confidence indicators

---

## 🔌 **API Contracts**

### Start Analysis
```http
POST /api/auto-profile/analyze
Content-Type: application/json

{
  "businessId": "uuid-string"
}

→ 202 {
  "jobId": "job_timestamp_uuid",
  "message": "Analysis started"
}
```

### Get Suggestions
```http
GET /api/auto-profile/suggestions?businessId=uuid-string

→ 200 {
  "businessName": { "value": "The Hot Tub Man Ltd.", "confidence": 0.97 },
  "phone": { "value": "+1 (403) 550-5140", "confidence": 0.95 },
  "website": { "value": "https://www.thehottubman.ca", "confidence": 0.96 },
  "serviceArea": { "value": "Alberta", "confidence": 0.88 }
}
```

### Apply Suggestions
```http
POST /api/auto-profile/apply
Content-Type: application/json

{
  "businessId": "uuid-string",
  "fields": ["businessName", "phone", "website"]
}

→ 200 {
  "applied": ["businessName", "phone", "website"],
  "message": "Applied 3 suggestions successfully"
}
```

---

## 🧠 **Classifier & Drafts Integration**

### Behavior JSON Structure
```json
{
  "businessProfile": {
    "name": "The Hot Tub Man Ltd.",
    "phone": "+1 (403) 550-5140",
    "website": "https://www.thehottubman.ca",
    "timezone": "Canada/Mountain",
    "serviceArea": "Alberta"
  },
  "voiceProfile": {
    "tone": "friendly-professional",
    "greeting": "Hi [Name],",
    "closing": "Best regards,",
    "commonPhrases": ["Let me know if you have any questions"],
    "responseStyle": "detailed-helpful"
  }
}
```

### AI Draft System Prompt
```javascript
const systemPrompt = `
${baseRules}
${businessTypeBehavior}
${voiceProfile.tone} - ${voiceProfile.greeting} - ${voiceProfile.closing}
Business: ${businessProfile.name} | ${businessProfile.phone} | ${businessProfile.website}
Timezone: ${businessProfile.timezone} | Service Area: ${businessProfile.serviceArea}
`;
```

---

## 🛡️ **Security Guardrails**

### PII Protection
- ✅ **Never store raw email bodies** - Only extracted fields + content hashes
- ✅ **Sampling cap**: 150 messages maximum
- ✅ **Prefer sent emails** for most reliable business info
- ✅ **Remove quoted text** and signatures
- ✅ **Content hashing** for audit trails

### Confidence Thresholds
- ✅ **Default threshold**: 0.70 (configurable via env)
- ✅ **Re-train cadence**: Manual button + optional 90-day refresh
- ✅ **Audit logging**: All analysis requests logged

### Data Retention
- ✅ **Analysis logs**: 90 days
- ✅ **Profile data**: Until user deletion
- ✅ **Audit trails**: 1 year (configurable)

---

## 📈 **Success Criteria (First Week)**

### Primary KPIs
- ✅ **≥70%** of businesses see **≥3 fields** auto-filled
- ✅ **Avg confidence ≥0.82** on applied fields  
- ✅ **Drop-off on Business Info step reduced by ≥25%**
- ✅ **First-reply draft CSAT (thumbs-up) ≥85%**

### Secondary Metrics
- ✅ **Fields auto-filled count**
- ✅ **Avg confidence score**
- ✅ **Time saved (seconds)**
- ✅ **Draft adoption rate**

### Monitoring
```javascript
// Track key events
await emitEvent('profile_analysis_started', { businessId, jobId });
await emitEvent('profile_analysis_completed', { businessId, fieldsExtracted, avgConfidence });
await emitEvent('profile_suggestions_applied', { businessId, appliedFields, timeSaved });
await emitEvent('voice_training_completed', { businessId, voiceProfile, avgConfidence });
await emitEvent('ai_draft_created', { businessId, threadId, draftType });
await emitEvent('ai_draft_adopted', { businessId, threadId, draftType });
```

---

## 🚀 **Deployment Commands**

### 1. Database Migration
```bash
psql -d production_db -f extracted-business-profiles-schema.sql
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env.production

# Set required variables
export OPENAI_API_KEY="your-key"
export VITE_SUPABASE_URL="your-url"
export SUPABASE_SERVICE_ROLE_KEY="your-key"
```

### 3. API Deployment
```bash
# Deploy API endpoints
rsync -av src/pages/api/ /path/to/production/api/
```

### 4. n8n Workflow Import
```bash
# Import workflows
curl -X POST https://your-n8n.com/api/v1/workflows/import \
  -H "Content-Type: application/json" \
  -d @business-profile-analysis-workflow.json
```

### 5. Validation
```bash
# Run deployment validation
node validate-deployment.js
```

---

## 🎯 **Post-Deployment Checklist**

### Immediate (Day 1)
- [ ] Monitor error rates in logs
- [ ] Check API endpoint health
- [ ] Verify n8n workflow executions
- [ ] Test with 2-3 real users

### Week 1
- [ ] Track success criteria metrics
- [ ] Monitor confidence score distribution
- [ ] Review user feedback
- [ ] Optimize based on data

### Month 1
- [ ] Analyze adoption rates
- [ ] Review PII compliance reports
- [ ] Optimize AI prompts based on accuracy
- [ ] Plan feature enhancements

---

## 🆘 **Troubleshooting**

### Common Issues
1. **Low confidence scores** → Review AI prompts, improve email filtering
2. **Analysis failures** → Check OAuth tokens, API limits
3. **Missing suggestions** → Verify email access, check sampling
4. **Performance issues** → Optimize email fetching, reduce sample size

### Support Contacts
- **Technical Issues**: dev-team@floworx.com
- **AI Accuracy**: ai-team@floworx.com  
- **User Experience**: ux-team@floworx.com

---

## 🎉 **Ready to Ship!**

This auto-profile system represents a **massive competitive advantage** for Floworx. Users will love the time savings and accuracy, while you'll see higher conversion rates and better data quality.

**The system is production-ready with:**
- ✅ Complete PII protection
- ✅ Comprehensive audit logging  
- ✅ Real-time metrics tracking
- ✅ Graceful error handling
- ✅ Scalable architecture

**Success is measured by:**
- 🎯 **70%+ adoption rate**
- 🎯 **82%+ average confidence**  
- 🎯 **25%+ reduction in drop-off**
- 🎯 **85%+ draft satisfaction**

**Ready to revolutionize onboarding! 🚀✨**
