# 🎤 Email Voice Analysis Flow

## Overview
The Email Voice Analysis system automatically analyzes a client's email communication style during onboarding to personalize AI responses.

## Trigger Point

### When: Team Setup Onboarding Step
The voice analysis is triggered **automatically** when the client clicks **"Save and Continue"** in the Team Setup page (`StepTeamSetup.jsx`).

### Location in Code
```javascript
// File: src/pages/onboarding/StepTeamSetup.jsx
// Lines: 344-382

const handleContinue = async () => {
  // ... (team setup saving logic)
  
  // 🎤 Voice analysis triggers here after navigation
  setTimeout(() => {
    emailVoiceAnalyzer.forceFreshAnalysis(user.id, businessType)
      .then(voiceAnalysis => {
        // Show success notification if analysis completes
      })
      .catch(voiceError => {
        // Silently fail - doesn't block user flow
      });
  }, 1000);
};
```

## Flow Diagram

```
┌─────────────────────────────────────┐
│ User Clicks "Save and Continue"     │
│ in Team Setup                       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Save Team Data (Managers/Suppliers) │
│ Update Profile                      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Navigate to Business Information    │
│ (Non-blocking)                      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Background: Start Label Provisioning│
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Background: Start Voice Analysis    │
│ (1 second delay)                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ EmailVoiceAnalyzer.forceFreshAnalysis│
└──────────────┬──────────────────────┘
               │
               ├─→ Check for email integration
               │
               ├─→ Fetch recent emails from:
               │   • Backend API (/api/emails/recent)
               │   • Database queue (fallback)
               │
               ├─→ Filter outbound emails
               │   • direction === 'outbound'
               │   • body_text length > 50 chars
               │
               ├─→ Analyze writing patterns:
               │   • Tone (professional, friendly, etc.)
               │   • Empathy (high, moderate, low)
               │   • Formality (formal, balanced, conversational)
               │   • Responsiveness (high, standard)
               │
               ├─→ Store analysis in profiles.voice_analysis
               │
               └─→ Show success notification
```

## Data Sources

### 1. Backend API
- **Endpoint**: `GET http://localhost:3001/api/emails/recent?limit=50&offset=0`
- **Authentication**: Bearer token (Supabase session)
- **Returns**: Emails from `email_queue` table

### 2. Database Queue (Fallback)
- **Table**: `email_queue`
- **Columns**: 
  - `client_id` (user ID)
  - `direction` ('inbound' or 'outbound')
  - `body_text` (email content)
  - `from_addr`, `to_addrs`
  - `subject`, `metadata`

## Analysis Process

### Step 1: Email Filtering
```javascript
const sentEmails = emails.filter(email => {
  // Check if outbound
  const isOutbound = email.direction === 'outbound';
  
  // Must have substantial content
  const hasContent = email.body_text && email.body_text.trim().length > 50;
  
  return isOutbound && hasContent;
});
```

### Step 2: Pattern Detection
The system analyzes outbound emails for writing patterns:
- ✅ "thank you"
- ✅ "please"
- ✅ "appreciate"
- ✅ "look forward"
- ✅ "hesitate"
- ✅ "questions"
- ✅ "help"
- ✅ "happy"
- ✅ "pleased"

### Step 3: Voice Characteristics
Based on detected patterns:

**Tone:**
- `friendly` - Contains "thank you", "appreciate", "look forward"
- `professional` - Contains "thank you", "please"
- `direct` - Contains urgent language

**Empathy:**
- `high` - Strong presence of polite and considerate language
- `moderate` - Balanced professional language
- `low` - Minimal emotional language

**Formality:**
- `formal` - Uses "pleased", "appreciate"
- `balanced` - Professional but approachable
- `conversational` - Contains "hesitate", "questions"

**Responsiveness:**
- `high` - Contains "questions", "help"
- `standard` - Normal response patterns

### Step 4: Confidence Score
```javascript
const patternCount = Object.values(patterns).filter(Boolean).length;
const confidence = Math.min(0.95, 0.6 + (patternCount * 0.05));
```

## Storage

### Database Location
- **Table**: `profiles`
- **Column**: `voice_analysis` (JSONB)

### Data Structure
```json
{
  "tone": "friendly",
  "empathy": "high",
  "formality": "conversational",
  "responsiveness": "high",
  "confidence": 0.95,
  "analyzedAt": "2025-10-07T23:00:00.000Z",
  "emailCount": 3,
  "businessType": "pools_spas",
  "sampleSize": 3,
  "analysisVersion": "1.0",
  "patterns": {
    "thankYou": true,
    "please": true,
    "appreciate": true,
    "lookForward": true,
    "hesitate": true,
    "questions": true,
    "help": true,
    "happy": true,
    "pleased": true
  },
  "avgEmailLength": 216,
  "totalTextLength": 649,
  "skipped": false
}
```

## User Experience

### Success Scenario
1. User clicks "Save and Continue"
2. Page navigates to Business Information
3. Background: Label provisioning starts
4. Background: Voice analysis starts (1 second later)
5. If successful: Toast notification appears
   - **Title**: "Email Voice Analysis Complete!"
   - **Description**: "Analyzed your email style: friendly tone, high empathy."

### No Emails Scenario
1. User clicks "Save and Continue"
2. Page navigates to Business Information
3. Background: Voice analysis runs
4. No outbound emails found
5. System stores default analysis:
   ```json
   {
     "tone": "professional",
     "formality": "balanced",
     "empathy": "moderate",
     "responsiveness": "standard",
     "confidence": 0,
     "sampleSize": 0,
     "skipped": true,
     "reason": "No outbound emails found for analysis"
   }
   ```
6. No notification shown (silent)
7. System continues normally with default settings

## Error Handling

### Graceful Degradation
The voice analysis is designed to **never block the user flow**:

1. **API Failure**: Falls back to database queue
2. **Database Failure**: Returns empty array
3. **No Emails**: Uses default settings
4. **Analysis Error**: Logs error, continues with defaults
5. **Storage Error**: Logs error, user flow continues

### Console Logging
All steps are logged for debugging:
```
🎤 Starting email voice analysis in background...
📋 Business Type: pools_spas
👤 User ID: fedf818f-986f-4b30-bfa1-7fc339c7bb60
📧 Fetching recent emails from outlook API...
📬 Received outlook email data
📧 No emails from API, checking database queue...
📬 Found 4 emails in database queue
📝 Analyzing 3 sent emails
📊 Voice Analysis Results: {...}
✅ Voice analysis completed successfully in background
```

## Testing

### Manual Test
1. Add test emails to `email_queue` table
2. Navigate to Team Setup
3. Fill in team information
4. Click "Save and Continue"
5. Check console for voice analysis logs
6. Verify `profiles.voice_analysis` column

### Automated Test
```bash
node test-voice-analysis-database.js
```

## Integration Points

### 1. Email Voice Analyzer Service
- **File**: `src/lib/emailVoiceAnalyzer.js`
- **Method**: `forceFreshAnalysis(userId, businessType)`

### 2. Database Tables
- `profiles.voice_analysis` - Stores analysis results
- `email_queue` - Source of email data
- `integrations` - Email provider credentials

### 3. Backend API
- `GET /api/emails/recent` - Fetches emails from queue

## Configuration

### Timing
- **Delay**: 1000ms after navigation
- **Purpose**: Ensures navigation completes before background work

### Limits
- **Max Emails Analyzed**: 50
- **Min Body Length**: 50 characters
- **Max Confidence**: 0.95

## Future Enhancements

1. **Real-time Updates**: Update voice analysis as more emails are sent
2. **Multi-language Support**: Detect and analyze in different languages
3. **Sentiment Analysis**: Include emotional sentiment in analysis
4. **Industry-specific Patterns**: Customize patterns per business type
5. **AI-powered Analysis**: Use OpenAI for deeper analysis
6. **Voice Evolution Tracking**: Track how voice changes over time

---

## Summary

✅ **Automatic Trigger**: Runs when user clicks "Save and Continue" in Team Setup  
✅ **Non-blocking**: Runs in background, never blocks user flow  
✅ **Graceful Fallback**: Uses database queue if API fails  
✅ **Default Settings**: Uses defaults if no emails found  
✅ **User Feedback**: Shows success notification when analysis completes  
✅ **Error Resilient**: Silent failures, logs errors for debugging  

**The email voice analysis is fully integrated and working!** 🎉
