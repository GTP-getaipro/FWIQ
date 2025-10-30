# Voice Training Schema Enhancement

## Overview
Enhanced the `communication_styles` table to properly support AI Voice Training with dedicated columns for vocabulary patterns, tone analysis, signature phrases, response templates, sample size, and updated_at timestamp.

## Problem
The original schema only had a generic `style_profile` JSONB column, which made it:
- Difficult to query specific voice training data
- Hard to index for performance
- Unclear what data should be stored
- Not optimized for AI voice analysis workflows

## Solution
Added dedicated columns for each aspect of voice training while maintaining backward compatibility with the existing `style_profile` JSONB column.

## Database Migration

### File: `supabase/migrations/20250122_enhance_communication_styles_for_voice_training.sql`

### New Columns Added:

1. **`vocabulary_patterns`** (JSONB)
   - Stores common words, preferred phrases, avoid words, and terminology
   - Structure:
     ```json
     {
       "common_words": ["...", "..."],
       "preferred_phrases": ["...", "..."],
       "avoid_words": ["...", "..."],
       "terminology": ["...", "..."]
     }
     ```
   - **Indexed with GIN** for fast JSONB queries

2. **`tone_analysis`** (JSONB)
   - Stores tone metrics and personality traits
   - Structure:
     ```json
     {
       "tone": "professional",
       "formality": "professional",
       "personality": "friendly",
       "confidence_level": 0.85,
       "sentence_structure": "varied"
     }
     ```
   - **Indexed with GIN** for fast JSONB queries

3. **`signature_phrases`** (TEXT[])
   - Array of signature phrases the user commonly uses
   - Example: `["Best regards", "Let me know if you need anything else"]`
   - Easier to query than JSONB arrays

4. **`response_templates`** (JSONB)
   - Response templates organized by category
   - Structure:
     ```json
     {
       "greeting": "...",
       "closing": "...",
       "followup": "...",
       "urgent": "...",
       "routine": "..."
     }
     ```
   - **Indexed with GIN** for fast JSONB queries

5. **`sample_size`** (INTEGER)
   - Number of emails analyzed to build the profile
   - **Indexed** for sorting by sample size
   - Helps determine profile confidence

6. **`updated_at`** (TIMESTAMPTZ)
   - Automatically managed by trigger
   - Separate from `last_updated` for flexibility
   - Updates on every table modification

### Performance Improvements

#### Indexes Created:
```sql
CREATE INDEX idx_communication_styles_vocabulary 
  ON communication_styles USING GIN (vocabulary_patterns);

CREATE INDEX idx_communication_styles_tone 
  ON communication_styles USING GIN (tone_analysis);

CREATE INDEX idx_communication_styles_templates 
  ON communication_styles USING GIN (response_templates);

CREATE INDEX idx_communication_styles_sample_size 
  ON communication_styles(sample_size DESC);
```

#### Auto-Update Trigger:
```sql
CREATE TRIGGER trg_communication_styles_updated_at
  BEFORE UPDATE ON communication_styles
  FOR EACH ROW
  EXECUTE FUNCTION update_communication_styles_updated_at();
```

### Data Migration
The migration automatically migrates existing data from `style_profile` JSONB to the new dedicated columns, ensuring backward compatibility.

## Code Changes

### 1. **src/lib/styleAnalyzer.js**
Updated `saveStyleProfile()` method to:
- Extract vocabulary patterns into dedicated column
- Extract tone analysis into dedicated column
- Store signature phrases in array column
- Extract response templates into dedicated column
- Store sample size
- Maintain backward compatibility with `style_profile`

**Before:**
```javascript
await supabase
  .from('communication_styles')
  .upsert({
    user_id: userId,
    style_profile: styleProfile,
    last_updated: new Date().toISOString()
  }, { onConflict: 'user_id' });
```

**After:**
```javascript
await supabase
  .from('communication_styles')
  .upsert({
    user_id: userId,
    vocabulary_patterns: vocabularyPatterns,  // Dedicated column
    tone_analysis: toneAnalysis,              // Dedicated column
    signature_phrases: signaturePhrases,      // Dedicated column
    response_templates: responseTemplates,    // Dedicated column
    sample_size: sampleSize,                  // Dedicated column
    style_profile: styleProfile,              // Keep for backward compatibility
    updated_at: new Date().toISOString(),
    last_updated: new Date().toISOString()
  }, { onConflict: 'user_id' });
```

### 2. **backend/src/services/aiService.js**
Updated `storeVoiceAnalysis()` method with the same enhancements as styleAnalyzer.js.

## Benefits

### 1. **Better Query Performance**
```sql
-- Fast queries now possible:
SELECT * FROM communication_styles 
WHERE vocabulary_patterns @> '{"common_words": ["professional"]}'::jsonb;

SELECT * FROM communication_styles 
WHERE tone_analysis->>'formality' = 'professional';

SELECT * FROM communication_styles 
WHERE 'Best regards' = ANY(signature_phrases);

SELECT * FROM communication_styles 
ORDER BY sample_size DESC 
LIMIT 10;
```

### 2. **Clearer Data Structure**
- Each column has a specific purpose
- Easy to understand what data is stored
- Better documentation with COMMENT ON COLUMN

### 3. **Improved AI Training**
- Vocabulary patterns can be easily analyzed
- Tone metrics are directly accessible
- Signature phrases can be quickly identified
- Response templates are categorized

### 4. **Backward Compatibility**
- Original `style_profile` JSONB column is preserved
- Existing code continues to work
- Gradual migration path for old data

### 5. **Better Monitoring**
- `sample_size` shows training data quality
- `updated_at` tracks last modification
- Can query profiles by confidence level

## Usage Examples

### Storing a Voice Profile:
```javascript
await styleAnalyzer.saveStyleProfile(userId, {
  vocabulary: {
    commonWords: ['professional', 'service', 'customer'],
    preferredPhrases: ['happy to help', 'looking forward'],
    avoidWords: ['cheap', 'discount'],
    industryTerminology: ['HVAC', 'maintenance', 'repair']
  },
  tone: 'professional',
  formality: 'professional',
  personality: 'friendly',
  confidence: 0.85,
  signaturePhrases: ['Best regards', 'Have a great day'],
  responseTemplates: {
    greeting: 'Hi there! Thanks for reaching out.',
    closing: 'Looking forward to serving you.',
    followup: 'Just following up on our previous conversation.',
    urgent: 'I understand this is urgent. Let me help right away.'
  }
}, sampleSize);
```

### Querying Voice Profiles:
```javascript
// Get profiles with high sample size
const { data } = await supabase
  .from('communication_styles')
  .select('*')
  .gte('sample_size', 50)
  .order('sample_size', { ascending: false });

// Find profiles with specific tone
const { data } = await supabase
  .from('communication_styles')
  .select('*')
  .contains('tone_analysis', { tone: 'professional' });

// Find profiles using specific phrases
const { data } = await supabase
  .from('communication_styles')
  .select('*')
  .contains('signature_phrases', ['Best regards']);
```

## Running the Migration

### Option 1: Via Supabase Dashboard
1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20250122_enhance_communication_styles_for_voice_training.sql`
4. Click **Run**

### Option 2: Via Supabase CLI
```bash
supabase db push
```

### Verification:
```sql
-- Check that new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'communication_styles';

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'communication_styles';

-- Verify data migration
SELECT 
  user_id,
  vocabulary_patterns,
  tone_analysis,
  signature_phrases,
  sample_size
FROM communication_styles 
LIMIT 5;
```

## Deployment Status
- ✅ Migration SQL created
- ✅ Code updated to use new columns
- ✅ Backward compatibility maintained
- ✅ Performance indexes added
- ✅ Auto-update trigger implemented
- ⏳ Ready for deployment

## Next Steps
1. **Run the migration** in your Supabase database
2. **Test voice training** to ensure data is saved correctly
3. **Monitor performance** of new indexes
4. **Update queries** to take advantage of new structure
5. **Consider removing** `style_profile` JSONB in future version once fully migrated

