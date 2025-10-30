# 🎓 Classification Feedback System - Implementation Guide

## Quick Start (5 Minutes)

### **Step 1: Apply Database Migration**

Go to Supabase Dashboard → SQL Editor:

```sql
-- Run this migration
-- File: supabase/migrations/20251030_create_classification_feedback_system.sql
```

Or use CLI:
```bash
supabase db push
```

### **Step 2: Deploy Edge Function**

```bash
cd supabase/functions
supabase functions deploy submit-classification-feedback
```

### **Step 3: Add UI Component**

In your email inbox/dashboard page:

```tsx
import ClassificationFeedbackButton from '@/components/ClassificationFeedbackButton';

// Inside your email list component:
<ClassificationFeedbackButton
  emailId={email.id}
  originalClassification={email.ai_classification}
  emailData={{
    subject: email.subject,
    from: email.from,
    bodyPreview: email.body.substring(0, 500)
  }}
  provider="gmail"
/>
```

---

## 📊 **Integration Points**

### **Where to Add Feedback Buttons**

1. **Email Inbox Page** - Next to each classified email
2. **Email Detail View** - In the header or sidebar
3. **Classification Results** - After AI processes email
4. **Gmail Add-on** - Custom card in Gmail sidebar
5. **Outlook Add-on** - Custom taskpane in Outlook

---

## 🔄 **Complete User Journey**

```
USER SEES EMAIL
    ↓
Email classified by AI as "SUPPORT"
User notices it should be "SALES"
    ↓
USER CLICKS "Correct Classification" button
    ↓
Modal opens with:
- Current: SUPPORT (Confidence: 85%)
- Correct category dropdown
- Confidence rating (1-5 stars)
- Optional reason field
    ↓
USER SELECTS "SALES" + Rates 4 stars + Adds reason
    ↓
CLICKS "Submit Feedback"
    ↓
API ENDPOINT called
    ↓
DATA SAVED to classification_feedback table
    ↓
METRICS UPDATED automatically
    ↓
TOAST NOTIFICATION: "✅ Thank you! Your feedback helps improve the AI"
    ↓
BACKGROUND: Daily metrics calculated
           Training dataset updated
           Ready for export when sufficient data collected
```

---

## 📈 **Analytics Dashboard Integration**

Add to your main dashboard:

```tsx
import ClassificationFeedbackDashboard from '@/components/ClassificationFeedbackDashboard';

// In your dashboard layout:
<Tab label="AI Learning">
  <ClassificationFeedbackDashboard />
</Tab>
```

Shows:
- Total corrections (all-time)
- Today's feedback count
- Average AI confidence
- 7-day trend
- Recent corrections list
- Export training data button

---

## 🎯 **Department Scope Integration**

### **How Feedback Works with Department Scope**

#### **HUB Mode (`["all"]`):**
```javascript
// User can correct ANY category
Available categories in feedback form:
✅ URGENT
✅ SALES
✅ SUPPORT
✅ MANAGER
✅ SUPPLIERS
✅ BANKING
✅ RECRUITMENT
✅ MISC
✅ OUT_OF_SCOPE
```

#### **DEPARTMENT Mode (`["sales", "support"]`):**
```javascript
// User can correct to allowed categories + OUT_OF_SCOPE
Available categories in feedback form:
✅ SALES
✅ FORMSUB
✅ SUPPORT  
✅ URGENT
✅ OUT_OF_SCOPE

❌ MANAGER (grayed out - not in scope)
❌ SUPPLIERS (grayed out - not in scope)
❌ BANKING (grayed out - not in scope)
```

**Smart Filtering:** The feedback component should filter categories based on `department_scope`:

```tsx
// Enhance ClassificationFeedbackButton to filter categories
const [departmentScope, setDepartmentScope] = useState(['all']);

useEffect(() => {
  // Fetch user's department scope
  const fetchScope = async () => {
    const { data } = await supabase
      .from('business_profiles')
      .select('department_scope')
      .eq('user_id', user.id)
      .single();
    
    setDepartmentScope(data?.department_scope || ['all']);
  };
  fetchScope();
}, [user]);

// Filter categories based on department scope
const getAvailableCategories = () => {
  if (departmentScope.includes('all')) {
    return allCategories;
  }
  
  const departmentCategoryMap = {
    'sales': ['SALES', 'FORMSUB'],
    'support': ['SUPPORT', 'URGENT'],
    'operations': ['MANAGER', 'SUPPLIERS', 'BANKING', 'RECRUITMENT'],
    'urgent': ['URGENT']
  };
  
  const allowed = [];
  departmentScope.forEach(dept => {
    allowed.push(...(departmentCategoryMap[dept] || []));
  });
  
  // Always include OUT_OF_SCOPE
  allowed.push('OUT_OF_SCOPE');
  
  return [...new Set(allowed)]; // Remove duplicates
};
```

---

## 🔍 **Monitoring & Quality Control**

### **Weekly Review Query**

```sql
-- Review this week's feedback for quality
SELECT 
  email_subject,
  original_primary_category as ai_said,
  corrected_primary_category as user_said,
  original_confidence as ai_confidence,
  confidence_rating as user_confidence,
  correction_reason,
  training_status,
  created_at
FROM classification_feedback
WHERE user_id = 'your-user-id'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### **Flag Suspicious Corrections**

```sql
-- Find corrections that might be wrong
SELECT *
FROM classification_feedback
WHERE user_id = 'your-user-id'
  AND original_confidence > 0.9  -- AI was very confident
  AND confidence_rating < 3      -- User not confident
  AND training_status = 'pending'
ORDER BY created_at DESC;
```

### **Approve High-Quality Corrections**

```sql
-- Batch approve good corrections
UPDATE classification_feedback
SET training_status = 'approved',
    reviewed_by = 'admin-user-id',
    reviewed_at = NOW()
WHERE user_id = 'your-user-id'
  AND confidence_rating >= 4
  AND training_status = 'pending'
  AND created_at > NOW() - INTERVAL '7 days';
```

---

## 🤖 **Fine-Tuning Process**

### **When to Fine-Tune**

| Corrections | Action |
|-------------|--------|
| 0-100 | Keep collecting, monitor patterns |
| 100-500 | Review data quality, prepare for tuning |
| 500-1000 | **Ready for first fine-tuning** |
| 1000+ | Fine-tune every 3-6 months |

### **Fine-Tuning Steps**

```bash
# 1. Export training data from Supabase
# Use the "Export Training Data" button in dashboard
# OR run SQL query and save as JSONL

# 2. Upload to OpenAI
curl https://api.openai.com/v1/files \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F purpose="fine-tune" \
  -F file="@training-data.jsonl"

# 3. Create fine-tuning job
curl https://api.openai.com/v1/fine_tuning/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "training_file": "file-abc123",
    "model": "gpt-4o-mini-2024-07-18",
    "suffix": "floworx-biz-123"
  }'

# 4. Monitor progress
curl https://api.openai.com/v1/fine_tuning/jobs/{job_id} \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# 5. Get fine-tuned model ID
# Result: ft:gpt-4o-mini:floworx:biz-123:abc123
```

### **Deploy Fine-Tuned Model**

```typescript
// Update AI classifier to use custom model
// In deploy-n8n/index.ts or your AI config

const AI_CLASSIFIER_MODEL = user.has_custom_model 
  ? `ft:gpt-4o-mini:floworx:${user.id}:latest`
  : 'gpt-4o-mini';

// Use in classification
const response = await openai.chat.completions.create({
  model: AI_CLASSIFIER_MODEL,
  messages: [...]
});
```

---

## 💡 **Best Practices**

### **1. Data Quality**

✅ **Do:**
- Correct obvious mistakes immediately
- Rate confidence accurately (4-5 for certain, 1-2 for uncertain)
- Add reasons for complex corrections
- Review weekly for patterns

❌ **Don't:**
- Submit corrections you're unsure about
- Correct the same email multiple times
- Use feedback for spam/junk emails
- Guess at categories

### **2. Training Data Hygiene**

```sql
-- Clean up bad corrections before export
UPDATE classification_feedback
SET training_status = 'rejected',
    review_notes = 'Low confidence, inconsistent'
WHERE confidence_rating < 3
  AND training_status = 'pending';

-- Mark duplicates
WITH duplicates AS (
  SELECT email_id, COUNT(*) as count
  FROM classification_feedback
  GROUP BY email_id
  HAVING COUNT(*) > 1
)
UPDATE classification_feedback cf
SET training_status = 'rejected',
    review_notes = 'Duplicate correction'
FROM duplicates d
WHERE cf.email_id = d.email_id
  AND cf.id NOT IN (
    SELECT id FROM classification_feedback
    WHERE email_id = d.email_id
    ORDER BY created_at DESC
    LIMIT 1
  );
```

### **3. Continuous Monitoring**

Set up weekly dashboard review:
- Check correction trends
- Identify problem categories
- Measure AI improvement
- Plan next fine-tuning cycle

---

## 🚀 **Rollout Checklist**

- [ ] Apply database migration
- [ ] Deploy Edge Function
- [ ] Add feedback button to email inbox
- [ ] Test submit feedback flow
- [ ] Add analytics dashboard
- [ ] Set up weekly review process
- [ ] Document internal procedures
- [ ] Train team on using feedback system
- [ ] Set monthly export reminder
- [ ] Plan first fine-tuning at 500 corrections

---

## 📊 **Expected Outcomes**

### **Month 1:**
- 50-100 corrections collected
- Baseline metrics established
- Team trained on system

### **Month 3:**
- 300-500 corrections
- Patterns identified (which categories AI struggles with)
- First export ready

### **Month 6:**
- 1000+ corrections
- **First fine-tuning completed**
- 5-10% accuracy improvement measured

### **Month 12:**
- 2500+ corrections
- **Second fine-tuning completed**
- 10-15% accuracy improvement
- Reduced manual work by 20-30%

---

## 🔗 **Files Created**

1. **Database:**
   - `supabase/migrations/20251030_create_classification_feedback_system.sql`

2. **Backend:**
   - `supabase/functions/submit-classification-feedback/index.ts`

3. **Frontend:**
   - `src/components/ClassificationFeedbackButton.jsx`
   - `src/components/ClassificationFeedbackDashboard.jsx`

4. **Documentation:**
   - `docs/CLASSIFICATION_FEEDBACK_SYSTEM.md`
   - `docs/CLASSIFICATION_FEEDBACK_IMPLEMENTATION_GUIDE.md`

---

**Start collecting feedback today and build your competitive moat through AI learning!** 🚀

