# Communication Styles Schema Fix

## Issue
The application was throwing a **400 Bad Request** error when trying to save communication styles:
```
POST https://oinxzvqszingwstrbdro.supabase.co/rest/v1/communication_styles?on_conflict=user_id 400 (Bad Request)
```

## Root Cause
The code was trying to insert/update database columns that **don't exist** in the `communication_styles` table:
- `vocabulary_patterns`
- `tone_analysis`
- `signature_phrases`
- `response_templates`
- `sample_size`
- `updated_at` (should be `last_updated`)

## Migration Schema
The `communication_styles` table (created in `20241220_create_communication_styles_table.sql`) only has these columns:
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to auth.users)
- `style_profile` (JSONB - stores all style data)
- `learning_count` (INTEGER)
- `last_updated` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)

**All style-related data should be stored inside the `style_profile` JSONB column, not as separate columns.**

## Files Fixed

### 1. `src/lib/styleAnalyzer.js`
**Before:**
```javascript
.upsert({
  user_id: userId,
  style_profile: styleProfile,
  vocabulary_patterns: styleProfile.vocabulary,
  tone_analysis: { ... },
  signature_phrases: styleProfile.signaturePhrases.map(p => p.phrase),
  response_templates: styleProfile.responsePatterns
}, { onConflict: 'user_id' });
```

**After:**
```javascript
.upsert({
  user_id: userId,
  style_profile: styleProfile,
  last_updated: new Date().toISOString()
}, { onConflict: 'user_id' });
```

### 2. `backend/src/services/aiService.js`
**Before:**
```javascript
.upsert({
  user_id: userId,
  style_profile: voiceAnalysis,
  sample_size: sampleSize,
  updated_at: new Date().toISOString()
}, { onConflict: 'user_id' });
```

**After:**
```javascript
const styleProfile = {
  ...voiceAnalysis,
  sample_size: sampleSize
};

.upsert({
  user_id: userId,
  style_profile: styleProfile,
  last_updated: new Date().toISOString()
}, { onConflict: 'user_id' });
```

### 3. `src/lib/styleProfileManager.js`
Removed non-existent columns from `importStyleProfile()` method.

### 4. `src/lib/styleAwareAI.js`
**Before:**
```javascript
const vocabulary = styleProfile.vocabulary_patterns || {};
const toneAnalysis = styleProfile.tone_analysis || {};
const signaturePhrases = styleProfile.signature_phrases || [];
```

**After:**
```javascript
const profile = styleProfile.style_profile || {};
const vocabulary = profile.vocabulary || {};
const toneAnalysis = { 
  tone: profile.tone, 
  formality: profile.formality, 
  personality: profile.personality 
} || {};
const signaturePhrases = profile.signaturePhrases || [];
```

### 5. `src/lib/personalizedPrompts.js`
Fixed to access `tone_analysis` data from within `style_profile.style_profile` object.

## Deployment Status

✅ **Fixed files committed and pushed** (commit: c8829ec)
✅ **Frontend rebuilt** - New bundles generated in `dist/`
✅ **Changes pushed to GitHub** - Coolify should auto-deploy

## Testing

Once deployed, test the voice analysis feature:
1. Navigate to the voice learning/style profile section
2. Trigger voice analysis for a user with business type
3. Verify no 400 Bad Request errors occur
4. Check that communication styles are saved successfully

## Expected Result

The voice analysis should complete without errors:
```
🎤 Starting voice learning analysis...
📁 Starting automatic folder provisioning...
✅ Communication style saved successfully
```

## Notes

- The `response_templates` table is a **separate table** and is not affected by this fix
- All style data (vocabulary, tone, phrases, patterns, etc.) should be nested inside the `style_profile` JSONB field
- The column name is `last_updated`, not `updated_at`

## Related Files
- Migration: `supabase/migrations/20241220_create_communication_styles_table.sql`
- Schema definition in Supabase should match the migration exactly

