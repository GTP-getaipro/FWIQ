# 🎤 Voice Training Integration Plan

## 📊 Current System Evaluation

### ✅ **What Already Exists:**

#### 1. **Complete Voice Analyzer Service** (`src/lib/emailVoiceAnalyzer.js`)
- ✅ **Fetches sent emails** from Gmail/Outlook API (up to 50 emails)
- ✅ **Categorizes emails** by intent (support, sales, urgent, follow-up, general)
- ✅ **Extracts few-shot examples** (3 per category)
- ✅ **AI analysis** via `/api/ai/analyze-email-voice` endpoint
- ✅ **Stores in `communication_styles` table** (used by n8n deployment)
- ✅ **Stores in `profiles` table** (backward compatibility)
- ✅ **Supports both Gmail and Outlook**
- ✅ **Graceful fallback** if no emails found (uses default profile)
- ✅ **Token refresh** via oauthTokenManager
- ✅ **Universal keywords** work across all business types

#### 2. **Database Schema** (Already Created)
```sql
communication_styles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  style_profile JSONB,  -- Complete voice profile
  learning_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP,
  created_at TIMESTAMP
)
```

#### 3. **Edge Function Integration** (`supabase/functions/deploy-n8n/index.ts`)
- ✅ Line 1066: Fetches voice profile from `communication_styles`
- ✅ Line 1162-1200: Injects voice profile into behavior prompts
- ✅ Includes learned phrases, empathy levels, formality, etc.

#### 4. **Workflow Deployer** (`src/lib/workflowDeployer.js`)
- ✅ Line 306-308: Passes voiceProfile to edge function
- ✅ Already integrated into deployment flow

#### 5. **Template Service** (`src/lib/templateService.js`)
- ✅ Injects onboarding data into workflow templates
- ✅ Supports multi-business types

---

## 🚀 **Where to Integrate Voice Scraping**

### **Option 1: After Business Type Selection** (Recommended)
**File**: `src/pages/onboarding/Step3BusinessType.jsx`
**Line**: 226-290 (inside `handleContinue` function)

**When**: Right after user clicks "Save & Continue" on business type selection

**Why**:
- ✅ Email integration already complete (Step 2)
- ✅ Business type known (needed for AI context)
- ✅ User hasn't reached deployment yet (good time for background work)
- ✅ Non-blocking (can run in background with toast notification)

#### **Implementation**:

```javascript
// In Step3BusinessType.jsx, after line 252
const handleContinue = async () => {
  // ... existing validation code ...
  
  setIsLoading(true);

  try {
    // Store business types
    await onboardingData.storeStepData('business_type', {
      businessTypes: selectedTypes,
      primaryBusinessType: selectedTypes[0],
      selectedAt: new Date().toISOString()
    });

    // Update profiles table
    const { error } = await supabase
      .from('profiles')
      .update({
        business_type: selectedTypes[0],
        business_types: selectedTypes,
        onboarding_step: 'team_setup'
      })
      .eq('id', user.id);

    if (error) throw error;

    // ✨ NEW: Trigger voice training (non-blocking)
    toast({
      title: '🎤 Analyzing your communication style...',
      description: 'We\'re learning how you write to personalize AI drafts',
    });

    // Run voice analysis in background
    triggerVoiceAnalysis(user.id, selectedTypes[0]);

    // Navigate immediately (don't wait for voice analysis)
    navigate('/onboarding/team-setup');

  } catch (error) {
    console.error('Error:', error);
    toast({
      variant: 'destructive',
      title: 'Error',
      description: error.message,
    });
  } finally {
    setIsLoading(false);
  }
};

// Helper function (non-blocking)
async function triggerVoiceAnalysis(userId, businessType) {
  try {
    const { emailVoiceAnalyzer } = await import('@/lib/emailVoiceAnalyzer');
    const analysis = await emailVoiceAnalyzer.analyzeEmailVoice(userId, businessType);
    
    console.log('✅ Voice analysis complete:', {
      tone: analysis.tone,
      confidence: analysis.confidence,
      emailCount: analysis.emailCount,
      fewShotExamples: Object.keys(analysis.fewShotExamples || {})
    });
    
  } catch (error) {
    console.warn('⚠️ Voice analysis failed (non-critical):', error.message);
    // Don't throw - this is non-blocking
  }
}
```

---

### **Option 2: During Team Setup** (Alternative)
**File**: `src/pages/onboarding/StepTeamSetup.jsx`
**When**: While user is filling out team members

**Why**:
- ✅ More time for analysis to complete in background
- ✅ User is busy with form, won't notice delay
- ❌ Less clear context about "why" analysis is happening

---

### **Option 3: Right Before Deployment** (Current Approach)
**File**: `src/lib/deployment.js` or `src/lib/workflowDeployer.js`
**When**: During `deployAutomation()` call

**Why**:
- ✅ Ensures voice profile is ready for deployment
- ✅ Already partially integrated
- ❌ Blocks deployment (adds 10-30 seconds delay)
- ❌ User is waiting for deployment to finish

---

## 🎯 **Recommended Flow (Option 1 Enhanced)**

### **Step-by-Step Integration**

#### **1. Modify Step3BusinessType.jsx**
Add voice analysis trigger after business type selection:

```javascript
import { emailVoiceAnalyzer } from '@/lib/emailVoiceAnalyzer';

// Inside handleContinue():
toast({
  title: '🎤 Learning your communication style',
  description: 'Analyzing your sent emails to personalize AI drafts (30 sec)',
});

// Non-blocking background task
emailVoiceAnalyzer.analyzeEmailVoice(user.id, selectedTypes[0])
  .then(analysis => {
    console.log('✅ Voice training complete:', analysis);
    toast({
      title: '✅ Communication style learned!',
      description: `Analyzed ${analysis.emailCount} emails. AI will match your tone.`,
    });
  })
  .catch(error => {
    console.warn('⚠️ Voice analysis skipped:', error.message);
    // Graceful degradation - will use default tone
  });

// Navigate immediately (don't block user)
navigate('/onboarding/team-setup');
```

#### **2. Add Loading Indicator (Optional)**
Show a subtle progress indicator while analysis runs:

```jsx
{isAnalyzingVoice && (
  <div className="fixed bottom-4 right-4 bg-blue-50 p-4 rounded-lg shadow-lg">
    <div className="flex items-center gap-3">
      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
      <div>
        <p className="font-medium text-sm">Analyzing your writing style</p>
        <p className="text-xs text-gray-600">This helps AI match your tone</p>
      </div>
    </div>
  </div>
)}
```

#### **3. Verify in Deployment**
The voice profile is automatically fetched and used:
- ✅ Edge function fetches from `communication_styles` (line 1066)
- ✅ Injects into behavior prompts (line 1162-1200)
- ✅ AI uses learned phrases and tone in drafts

---

## 📋 **Implementation Checklist**

### **Phase 1: Basic Integration** (15 min)
- [ ] Import `emailVoiceAnalyzer` in Step3BusinessType.jsx
- [ ] Add voice analysis call in `handleContinue()`
- [ ] Add toast notification for user feedback
- [ ] Test with Gmail integration
- [ ] Test with Outlook integration

### **Phase 2: Enhanced UX** (15 min)
- [ ] Add loading indicator component
- [ ] Add success/skip toast messages
- [ ] Handle edge cases (no emails, API errors)
- [ ] Add progress state management

### **Phase 3: Backend API Endpoint** (30 min)
- [ ] Create `/api/ai/analyze-email-voice` endpoint (if not exists)
- [ ] Implement OpenAI GPT-4o-mini analysis
- [ ] Return structured voice profile
- [ ] Add error handling and rate limiting

### **Phase 4: Testing** (30 min)
- [ ] Test with fresh Gmail account
- [ ] Test with fresh Outlook account
- [ ] Test with no sent emails (fallback)
- [ ] Test with multiple business types
- [ ] Verify voice profile in deployment
- [ ] Verify AI drafts match user's tone

---

## 🔧 **Technical Details**

### **What Gets Analyzed:**
1. **Tone**: Professional, Friendly, Casual, Formal
2. **Empathy Level**: 0.0-1.0 (how caring/understanding)
3. **Formality Level**: 0.0-1.0 (casual → formal)
4. **Directness**: 0.0-1.0 (indirect → very direct)
5. **Common Phrases**: 5-15 frequently used phrases
6. **Greeting Pattern**: "Hi [Name]," vs "Dear [Name],"
7. **Closing Pattern**: "Best regards," vs "Thanks,"
8. **Technical Terms**: Industry-specific vocabulary
9. **Sentence Structure**: Short/medium/long, simple/complex
10. **Few-Shot Examples**: 3 per category (support, sales, urgent, follow-up, general)

### **How It's Used:**
```javascript
// In edge function (deploy-n8n/index.ts)
if (clientData.voiceProfile?.style_profile) {
  const voice = clientData.voiceProfile.style_profile.voice || {};
  const signaturePhrases = clientData.voiceProfile.style_profile.signaturePhrases || [];
  
  behaviorReplyPrompt += `
🎤 LEARNED VOICE PROFILE (from ${learningCount} analyzed edits):
- Empathy Level: ${voice.empathyLevel}/1.0
- Formality Level: ${voice.formalityLevel}/1.0
- Directness Level: ${voice.directnessLevel}/1.0

YOUR PREFERRED PHRASES (use these frequently):
${signaturePhrases.map(p => `- "${p.phrase}"`).join('\n')}

IMPORTANT: Match the style of YOUR learned voice profile.
  `;
}
```

---

## ⚡ **Performance Considerations**

### **Analysis Time:**
- Email fetch: 5-10 seconds
- AI analysis: 10-20 seconds
- Total: **15-30 seconds**

### **Optimization:**
1. ✅ **Non-blocking**: User can continue onboarding
2. ✅ **Cached**: Results stored in DB, reused in deployment
3. ✅ **Fallback**: Default profile if analysis fails
4. ✅ **Parallel**: Can run while user fills out team form

---

## 🎯 **Expected Results**

### **Before Voice Training:**
```
AI Draft:
"Dear Customer,

Thank you for contacting us. We have received your inquiry 
regarding the pool pump issue. Our team will review your 
request and respond within 24 hours.

Best regards,
The Hot Tub Man Team"
```

### **After Voice Training:**
```
AI Draft:
"Hi Sarah!

Thanks for reaching out! I'm so sorry to hear about your pump issue - 
definitely frustrating when that happens. I can definitely get someone 
out there within 2 hours to take a look.

I'll have our tech give you a call in the next 15 minutes to 
schedule a time that works for you.

Thanks for your patience!
- John"
```

---

## 🚨 **Error Handling**

### **Scenario 1: No Sent Emails**
```javascript
// Already handled in emailVoiceAnalyzer.js (line 380-395)
if (sentEmails.length === 0) {
  return {
    tone: 'professional',
    formality: 'balanced',
    empathy: 'moderate',
    confidence: 0,
    sampleSize: 0,
    skipped: true,
    reason: 'No outbound emails found for analysis'
  };
}
```

### **Scenario 2: API Rate Limit**
```javascript
// Graceful degradation
catch (error) {
  if (error.message.includes('429')) {
    toast({
      title: 'Voice analysis delayed',
      description: 'Will retry during deployment',
    });
  }
}
```

### **Scenario 3: Invalid OAuth Token**
```javascript
// Already handled via oauthTokenManager.js
const accessToken = await getValidAccessToken(userId, integration.provider);
// Automatically refreshes if expired
```

---

## 📈 **Success Metrics**

### **Track These:**
1. ✅ Voice analysis completion rate
2. ✅ Average analysis time
3. ✅ Email sample size (target: 10+)
4. ✅ User editing rate (lower = better tone match)
5. ✅ Confidence scores (target: 0.7+)

### **Monitor:**
```sql
-- Voice analysis adoption
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN learning_count > 0 THEN 1 END) as with_voice_profile,
  AVG(CASE WHEN learning_count > 0 THEN learning_count END) as avg_learning_count
FROM communication_styles;

-- Analysis quality
SELECT 
  style_profile->'voice'->>'confidence' as confidence,
  style_profile->'emailCount' as email_count,
  created_at
FROM communication_styles
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## ✅ **Next Steps**

1. **Implement Option 1** (after business type selection)
2. **Test with real email accounts**
3. **Create backend API endpoint** (if not exists)
4. **Monitor success metrics**
5. **Iterate based on user feedback**

**Estimated Time**: 1-2 hours for full implementation and testing


