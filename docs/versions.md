# FloworxV2 Version Registry

> **Last Updated**: 2025-10-07  
> **Current System Version**: v2.4.0

---

## 📊 Current Module Versions

### Core System
```yaml
system:
  version: "2.4.0"
  release_date: "2025-10-07"
  status: "stable"
  environment: "development"
```

### Frontend
```yaml
frontend:
  version: "0.9.0"
  last_updated: "2025-10-07"
  framework: "React 18 + Vite 4"
  key_changes:
    - "OAuth callback handling"
    - "Workflow deployment UI"
    - "Label provisioning interface"
```

### Backend API
```yaml
backend:
  version: "1.2.0"
  last_updated: "2025-10-07"
  runtime: "Node.js 18"
  key_endpoints:
    - "POST /api/workflows/deploy"
    - "POST /api/analytics"
```

### Database Schema
```yaml
database:
  schema_version: "2025.10.07"
  last_migration: "add-n8n-credential-columns"
  migration_count: 12
  tables: 15
  key_changes:
    - "Added n8n_credential_id to integrations"
    - "Added category, intent, path to business_labels"
    - "Added synced_at, is_deleted for label sync"
```

### n8n Workflows
```yaml
n8n_workflows:
  version: "1.4.2"
  last_updated: "2025-10-07"
  active_workflows: 2
  templates:
    pools_spas:
      version: "1.4.2"
      nodes: 8
      last_deployed: "2025-10-07"
    hvac:
      version: "1.3.1"
      nodes: 8
      last_deployed: "2025-10-06"
    electrician:
      version: "1.2.0"
      nodes: 7
      last_deployed: "2025-10-05"
```

### AI Classifier
```yaml
ai_classifier:
  version: "2.1.0"
  last_updated: "2025-10-07"
  model: "gpt-4"
  intent_taxonomy_version: "1.0"
  supported_categories: 7
  supported_intents: 24
```

### Label Sync System
```yaml
label_sync:
  version: "1.0.0"
  last_updated: "2025-10-07"
  features:
    - "Gmail label synchronization"
    - "Outlook folder synchronization"
    - "Automatic upsert on provision"
    - "Soft delete support"
```

### CORS Proxy (Edge Function)
```yaml
n8n_proxy:
  version: "1.1.0"
  last_updated: "2025-10-07"
  runtime: "Deno"
  endpoint: "https://oinxzvqszingwstrbdro.supabase.co/functions/v1/n8n-proxy"
  status: "deployed"
```

---

## 📅 Version History

### v2.4.0 (2025-10-07) - Current

**Changes**:
- ✅ Implemented n8n programmatic credential creation
- ✅ Fixed credential API endpoint to `/rest/credentials`
- ✅ Added credential mapping to `integrations` table
- ✅ Created Architecture Governance Blueprint
- ✅ Implemented contract validation system
- ✅ Added RLS security policies
- ✅ Updated label sync system with category/intent

**Migrations**:
- `add-n8n-credential-columns.sql` - Add credential mapping to integrations
- `add-intent-based-columns.sql` - Add category/intent to business_labels
- `fix-business-labels-schema.sql` - Update label_id as primary key

**Breaking Changes**: None

---

### v2.3.0 (2025-10-06)

**Changes**:
- Implemented unified folder structure
- Added label sync service
- Enhanced error handling in workflow deployer

**Migrations**:
- `20250107_multi_business_system.sql`

**Breaking Changes**: None

---

### v2.2.0 (2025-10-05)

**Changes**:
- Multi-business type support
- Enhanced OAuth token validation
- Improved frontend error handling

**Migrations**:
- `add-business-types-column.sql`

**Breaking Changes**: None

---

### v2.1.0 (2025-10-04)

**Changes**:
- Direct n8n deployer implementation
- Backend API integration
- Workflow activation manager

**Migrations**: None

**Breaking Changes**: None

---

### v2.0.0 (2025-10-03) - Major Release

**Changes**:
- Complete system rewrite
- Supabase integration
- n8n workflow automation
- Multi-provider support (Gmail + Outlook)

**Migrations**: Initial schema

**Breaking Changes**: Complete API redesign from v1.x

---

## 🔄 Version Bump Guidelines

### When to Bump

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Bug fix, no contract change | Patch (2.4.0 → 2.4.1) | Fix typo in UI |
| New feature, backward compatible | Minor (2.4.0 → 2.5.0) | Add new label category |
| Contract breaking change | Major (2.4.0 → 3.0.0) | Change API response structure |

### Bump Checklist

Before bumping version:
- [ ] Update this file (`docs/versions.md`)
- [ ] Update `package.json` version
- [ ] Tag git commit: `git tag v2.4.0`
- [ ] Create changelog entry
- [ ] Notify team in #architecture-changes

---

## 📦 Deployment Status by Environment

### Production
```yaml
version: "2.3.0"
deployed: "2025-10-06"
url: "https://app.floworx-iq.com"
database_schema: "2025.10.06"
n8n_workflows: "1.4.1"
status: "stable"
```

### Staging
```yaml
version: "2.4.0"
deployed: "2025-10-07"
url: "https://staging.floworx-iq.com"
database_schema: "2025.10.07"
n8n_workflows: "1.4.2"
status: "testing"
```

### Local Development
```yaml
version: "2.4.0"
branch: "main"
database_schema: "2025.10.07"
n8n_workflows: "1.4.2"
status: "active-development"
```

---

## 🎯 Upcoming Versions

### v2.5.0 (Planned - 2025-10-14)

**Features**:
- [ ] Complete hierarchical folder structure migration
- [ ] Enhanced AI training system
- [ ] Automated label sync scheduling
- [ ] Performance monitoring dashboard

**Est. Migrations**: 2-3

---

### v3.0.0 (Planned - Q4 2025)

**Major Changes**:
- Multi-tenant architecture
- Separate n8n credentials per business
- Enhanced analytics platform
- Real-time collaboration features

**Est. Migrations**: 10+

**Breaking Changes**: API authentication model

---

## 📋 Version Compatibility Matrix

| Frontend | Backend | Database | n8n Workflows | Compatible |
|----------|---------|----------|---------------|------------|
| 0.9.0 | 1.2.0 | 2025.10.07 | 1.4.2 | ✅ Yes |
| 0.9.0 | 1.1.0 | 2025.10.06 | 1.4.1 | ✅ Yes |
| 0.8.0 | 1.2.0 | 2025.10.07 | 1.4.2 | ⚠️ Partial |
| 0.9.0 | 1.0.0 | 2025.10.05 | 1.3.0 | ❌ No |

---

## 🔍 How to Check Current Version

### In Browser Console
```javascript
console.log('Frontend Version:', import.meta.env.VITE_APP_VERSION);
```

### Via API
```bash
curl https://app.floworx-iq.com/api/version
```

### In Database
```sql
SELECT version, deployed_at 
FROM system_metadata 
ORDER BY deployed_at DESC 
LIMIT 1;
```

---

## 📝 Changelog

See individual version sections above for detailed changes.

**Format**: We follow [Keep a Changelog](https://keepachangelog.com/) format:
- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

---

**Next Review**: 2025-10-14 (weekly)  
**Owner**: Architecture Team Lead


