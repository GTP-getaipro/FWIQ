# ✅ client_id → user_id Migration Fix

## Problem

N8N deployment failing with:
```
GET /workflows?client_id=eq.40b2d58f... 400 (Bad Request)
❌ Error: column workflows.client_id does not exist
```

## Root Cause

The database was standardized to use `user_id` everywhere (migration: `20241027_standardize_user_id.sql`), but several frontend files still queried using the old `client_id` column name.

## Files Fixed

### 1. ✅ src/lib/deployment.js (Line 62)
```javascript
// Before
.eq('client_id', userId)

// After  
.eq('user_id', userId)  ✅
```

### 2. ✅ src/lib/workflowService.js (Lines 72, 138, 340)
```javascript
// Before (3 instances)
.eq('client_id', clientId)

// After
.eq('user_id', clientId)  ✅
```

### 3. ✅ src/lib/templateVersionManager.js (Line 99)
```javascript
// Before
.eq('client_id', userId)

// After
.eq('user_id', userId)  ✅
```

## Commits

- `524c8b7` - Fixed client_id in 3 files
- Follow-up - Fixed remaining instance

## Testing

After redeploy, n8n deployment should work:
```
✅ Queries workflows table with user_id
✅ No more "client_id does not exist" errors
✅ Deployment proceeds successfully
```

## Related

This is part of the broader `user_id` standardization (see: `20241027_standardize_user_id.sql`)

---

**Status**: ✅ Fixed in code  
**Deployed**: ⏳ Waiting for Coolify rebuild  
**Impact**: Unblocks n8n workflow deployment  

