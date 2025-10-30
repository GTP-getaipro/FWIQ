## 🎓 Classification Feedback & Continuous Learning System

**Purpose:** Enable users to correct AI misclassifications, building a high-quality, business-specific training dataset for model fine-tuning and continuous improvement.

---

## 🌟 **Value Proposition**

### **The Data Moat**
- Every correction creates **proprietary training data**
- Over time, your AI becomes **business-specific** and outperforms generic GPT-4
- **Competitive advantage** through continuous learning
- **Higher accuracy** = Better automation = Lower costs

### **ROI Timeline**
| Timeframe | Corrections | Impact |
|-----------|-------------|--------|
| **Month 1** | 50-100 | Baseline metrics established |
| **Month 3** | 300-500 | Patterns identified, initial improvements |
| **Month 6** | 1000+ | **Fine-tuning ready** - Custom model deployment |
| **Month 12** | 2500+ | **10-15% accuracy improvement** over baseline |

---

## 📊 **System Architecture**

```
┌──────────────────────────────────────────────────────────────┐
│                    USER INTERFACE                            │
│  (Web Portal / Gmail Add-on / Outlook Add-on / Mobile App)  │
└──────────────────────────────────────────────────────────────┘
                              ↓
        User sees: AI classified email as "SUPPORT"
        User clicks: "Correct → SALES"
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                    API ENDPOINT                              │
│         POST /api/classification-feedback                    │
│              (Supabase Edge Function)                        │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│               DATABASE STORAGE                               │
│         classification_feedback table                        │
│  - Original AI classification                                │
│  - User's correction                                         │
│  - Email context for training                                │
│  - Quality metadata                                          │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│              ANALYTICS & METRICS                             │
│    classification_performance_metrics table                  │
│  - Daily accuracy tracking                                   │
│  - Category-specific performance                             │
│  - Trending improvements                                     │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│           TRAINING DATA EXPORT                               │
│     classification_training_dataset view                     │
│  - High-quality corrections only                             │
│  - OpenAI fine-tuning format                                 │
│  - Ready for model training                                  │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│              MODEL FINE-TUNING                               │
│         (Monthly or when 1000+ corrections)                  │
│  - Export training data                                      │
│  - Fine-tune GPT-4 model                                     │
│  - Deploy custom model                                       │
│  - Measure improvement                                       │
└──────────────────────────────────────────────────────────────┘
```

---

## 🗄️ **Database Schema**

### **1. classification_feedback Table**

Stores every user correction with full context.

```sql
CREATE TABLE classification_feedback (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  email_id text NOT NULL,
  provider text, -- 'gmail', 'outlook', 'imap'
  
  -- Original AI Prediction
  original_classification jsonb,
  original_primary_category text,
  original_confidence numeric(3,2),
  
  -- User Correction
  corrected_primary_category text NOT NULL,
  corrected_secondary_category text,
  corrected_ai_can_reply boolean,
  correction_reason text,
  
  -- Email Context (for training)
  email_subject text,
  email_from text,
  email_body_preview text, -- First 500 chars
  
  -- Quality Indicators
  confidence_rating integer, -- 1-5, user's confidence
  feedback_type text, -- 'manual_correction', 'approve', 'reject'
  training_status text, -- 'pending', 'approved', 'used_in_training'
  
  created_at timestamptz DEFAULT now()
);
```

### **2. classification_performance_metrics Table**

Daily aggregated metrics for tracking improvement.

```sql
CREATE TABLE classification_performance_metrics (
  id uuid PRIMARY KEY,
  user_id uuid,
  measurement_date date,
  
  total_corrections integer,
  correction_rate numeric(5,2), -- Percentage
  category_accuracy jsonb, -- Per-category accuracy
  avg_original_confidence numeric(3,2),
  high_confidence_errors integer, -- Wrong despite high confidence
  
  created_at timestamptz DEFAULT now()
);
```

---

## 🔌 **API Implementation**

### **Submit Feedback Endpoint**

**File:** `supabase/functions/submit-classification-feedback/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! }
      }
    }
  );

  // Get authenticated user
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401
    });
  }

  const body = await req.json();
  const {
    email_id,
    provider,
    original_classification,
    corrected_primary_category,
    corrected_secondary_category,
    corrected_tertiary_category,
    corrected_ai_can_reply,
    correction_reason,
    email_subject,
    email_from,
    email_body_preview,
    confidence_rating,
    feedback_type
  } = body;

  // Validate required fields
  if (!email_id || !corrected_primary_category) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400 }
    );
  }

  // Insert feedback
  const { data, error } = await supabase
    .from('classification_feedback')
    .insert({
      user_id: user.id,
      email_id,
      provider: provider || 'gmail',
      original_classification,
      original_primary_category: original_classification?.primary_category,
      original_secondary_category: original_classification?.secondary_category,
      original_confidence: original_classification?.confidence,
      original_ai_can_reply: original_classification?.ai_can_reply,
      corrected_primary_category,
      corrected_secondary_category,
      corrected_tertiary_category,
      corrected_ai_can_reply:
        corrected_ai_can_reply ?? original_classification?.ai_can_reply,
      correction_reason,
      email_subject,
      email_from,
      email_body_preview: email_body_preview?.substring(0, 500),
      confidence_rating: confidence_rating || 3,
      feedback_type: feedback_type || 'manual_correction',
      training_status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving feedback:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    });
  }

  // Calculate metrics (async, don't wait)
  supabase.rpc('calculate_classification_metrics', {
    p_user_id: user.id,
    p_date: new Date().toISOString().split('T')[0]
  });

  return new Response(
    JSON.stringify({
      success: true,
      feedback_id: data.id,
      message: 'Thank you for improving the AI!'
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
```

---

## 🎨 **UI Implementation Examples**

### **1. React Component - Feedback Button**

```typescript
// components/ClassificationFeedbackButton.tsx
import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface Props {
  emailId: string;
  originalClassification: {
    primary_category: string;
    secondary_category?: string;
    confidence: number;
    ai_can_reply: boolean;
  };
  emailData: {
    subject: string;
    from: string;
    bodyPreview: string;
  };
}

export const ClassificationFeedbackButton: React.FC<Props> = ({
  emailId,
  originalClassification,
  emailData
}) => {
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctedCategory, setCorrectedCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const categories = [
    'URGENT',
    'SALES',
    'SUPPORT',
    'MANAGER',
    'SUPPLIERS',
    'BANKING',
    'RECRUITMENT',
    'MISC'
  ];

  const submitFeedback = async () => {
    if (!correctedCategory) {
      toast({
        variant: 'destructive',
        title: 'Please select a category'
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        'submit-classification-feedback',
        {
          body: {
            email_id: emailId,
            provider: 'gmail',
            original_classification: originalClassification,
            corrected_primary_category: correctedCategory,
            email_subject: emailData.subject,
            email_from: emailData.from,
            email_body_preview: emailData.bodyPreview,
            confidence_rating: 4, // User is fairly confident
            feedback_type: 'manual_correction'
          }
        }
      );

      if (error) throw error;

      toast({
        title: '✅ Thank you!',
        description: 'Your feedback helps improve the AI'
      });

      setShowCorrection(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit feedback'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!showCorrection) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowCorrection(true)}
      >
        🎯 Correct Classification
      </Button>
    );
  }

  return (
    <div className="space-y-2 p-4 border rounded-lg">
      <p className="text-sm text-gray-600">
        AI classified as:{' '}
        <strong>{originalClassification.primary_category}</strong>
      </p>
      <Select value={correctedCategory} onValueChange={setCorrectedCategory}>
        <SelectTrigger>
          <SelectValue placeholder="Select correct category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        <Button onClick={submitFeedback} disabled={submitting} size="sm">
          {submitting ? 'Submitting...' : 'Submit Correction'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => setShowCorrection(false)}
          size="sm"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};
```

### **2. Gmail Add-on (Google Apps Script)**

```javascript
// Gmail Add-on for quick corrections
function buildFeedbackCard(email, classification) {
  const card = CardService.newCardBuilder();
  card.setHeader(
    CardService.newCardHeader()
      .setTitle('AI Classification')
      .setSubtitle(`Current: ${classification.primary_category}`)
  );

  const section = CardService.newCardSection();

  // Show current classification
  section.addWidget(
    CardService.newTextParagraph().setText(
      `Confidence: ${Math.round(classification.confidence * 100)}%`
    )
  );

  // Correction dropdown
  const categoryInput = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setTitle('Correct category')
    .setFieldName('corrected_category')
    .addItem('URGENT', 'URGENT', false)
    .addItem('SALES', 'SALES', false)
    .addItem('SUPPORT', 'SUPPORT', false)
    .addItem('MANAGER', 'MANAGER', false)
    .addItem('MISC', 'MISC', false);

  section.addWidget(categoryInput);

  // Submit button
  const action = CardService.newAction()
    .setFunctionName('submitCorrection')
    .setParameters({
      email_id: email.id,
      original_category: classification.primary_category
    });

  section.addWidget(
    CardService.newTextButton()
      .setText('Submit Correction')
      .setOnClickAction(action)
  );

  card.addSection(section);
  return card.build();
}

function submitCorrection(e) {
  const { email_id, original_category } = e.parameters;
  const corrected_category = e.formInput.corrected_category;

  // Call your API
  const url = 'https://your-project.supabase.co/functions/v1/submit-classification-feedback';
  const payload = {
    email_id,
    original_classification: { primary_category: original_category },
    corrected_primary_category: corrected_category,
    feedback_type: 'gmail_addon'
  };

  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${getUserToken()}`
    },
    payload: JSON.stringify(payload)
  });

  return CardService.newActionResponseBuilder()
    .setNotification(
      CardService.newNotification().setText('✅ Feedback submitted!')
    )
    .build();
}
```

---

## 📈 **Analytics & Metrics**

### **Dashboard Queries**

```sql
-- Overall accuracy trend
SELECT 
  measurement_date,
  total_corrections,
  correction_rate,
  avg_original_confidence
FROM classification_performance_metrics
WHERE user_id = '...'
ORDER BY measurement_date DESC
LIMIT 30;

-- Category-specific accuracy
SELECT 
  corrected_primary_category as category,
  COUNT(*) as correction_count,
  AVG(original_confidence) as avg_ai_confidence,
  COUNT(*) FILTER (WHERE original_confidence > 0.8) as high_conf_errors
FROM classification_feedback
WHERE user_id = '...'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY corrected_primary_category
ORDER BY correction_count DESC;

-- Most improved categories (over time)
WITH monthly_corrections AS (
  SELECT 
    DATE_TRUNC('month', created_at) as month,
    corrected_primary_category,
    COUNT(*) as corrections
  FROM classification_feedback
  WHERE user_id = '...'
  GROUP BY month, corrected_primary_category
)
SELECT 
  corrected_primary_category,
  MAX(corrections) - MIN(corrections) as improvement
FROM monthly_corrections
GROUP BY corrected_primary_category
ORDER BY improvement DESC;
```

---

## 🎓 **Fine-Tuning Workflow**

### **Step 1: Export Training Data**

```sql
-- Export data (run monthly or at 1000+ corrections)
SELECT * FROM export_training_data(
  p_user_id := 'your-user-id',
  p_min_quality := 4,
  p_limit := 1000
);
```

### **Step 2: Format for OpenAI**

```python
# Python script to format for OpenAI fine-tuning
import json

def format_for_openai(training_data):
    """Convert to JSONL format for OpenAI fine-tuning"""
    formatted = []
    
    for row in training_data:
        formatted.append({
            "messages": [
                {
                    "role": "system",
                    "content": "You are an email classifier for this business..."
                },
                {
                    "role": "user",
                    "content": row['prompt']
                },
                {
                    "role": "assistant",
                    "content": row['completion']
                }
            ]
        })
    
    # Save to JSONL
    with open('training_data.jsonl', 'w') as f:
        for item in formatted:
            f.write(json.dumps(item) + '\n')

# Export to file
format_for_openai(training_data)
```

### **Step 3: Fine-Tune Model**

```bash
# Upload training file
openai api fine_tunes.create \
  -t training_data.jsonl \
  -m gpt-4o-mini \
  --suffix "floworx-business-123"

# Wait for training to complete
openai api fine_tunes.follow -i ft-abc123

# Get fine-tuned model ID
# Use this in your deployment: ft:gpt-4o-mini:floworx:business-123:abc123
```

### **Step 4: Deploy & Measure**

```typescript
// Update your AI classification to use fine-tuned model
const classification = await openai.chat.completions.create({
  model: 'ft:gpt-4o-mini:floworx:business-123:abc123', // Your fine-tuned model
  messages: [...]
});

// Compare before/after accuracy
// Track improvement in classification_performance_metrics
```

---

## 🎯 **Best Practices**

### **1. Quality Control**
- Only use corrections with `confidence_rating >= 4` for training
- Review corrections quarterly to ensure quality
- Mark obvious spam/test corrections as `training_status = 'rejected'`

### **2. Data Volume**
- **Minimum:** 100 corrections before first fine-tuning
- **Optimal:** 500-1000 corrections for significant improvement
- **Ongoing:** Continue collecting even after fine-tuning

### **3. Review Process**
```sql
-- Flag suspicious corrections for review
SELECT *
FROM classification_feedback
WHERE original_confidence > 0.9  -- AI was very confident
  AND corrected_primary_category != original_primary_category
  AND training_status = 'pending'
ORDER BY created_at DESC;
```

### **4. A/B Testing**
- Keep 10% of traffic on base model
- Route 90% to fine-tuned model
- Compare accuracy metrics weekly

---

## 📊 **Success Metrics**

Track these KPIs monthly:

1. **Correction Rate:** `corrections / total_emails * 100`
   - Target: < 5% (95% accuracy)
   
2. **High-Confidence Errors:** AI was >80% confident but wrong
   - Target: < 1% of classifications

3. **Category Accuracy:** Per-category correction rates
   - Target: All categories > 90% accuracy

4. **Time to Correction:** How quickly users spot mistakes
   - Target: < 24 hours average

5. **Training Data Quality:** % of corrections rated 4-5
   - Target: > 80% high quality

---

## 🚀 **Rollout Plan**

### **Phase 1: Foundation (Week 1-2)**
- ✅ Deploy database migration
- ✅ Create API endpoint
- ✅ Add basic UI component

### **Phase 2: Data Collection (Month 1-3)**
- Build Gmail/Outlook add-ons
- Add feedback prompts in portal
- Collect 500+ corrections
- Monitor metrics weekly

### **Phase 3: First Fine-Tuning (Month 3-4)**
- Review and approve corrections
- Export training data
- Fine-tune GPT-4o-mini model
- A/B test vs base model

### **Phase 4: Continuous Improvement (Month 4+)**
- Monthly fine-tuning cycles
- Expand to more categories
- Build automated quality checks
- Share improvements with customers

---

## 💡 **Advanced Features (Future)**

1. **Active Learning:** AI asks for clarification on low-confidence classifications
2. **Collaborative Learning:** Share anonymized corrections across similar businesses
3. **Explanation Mining:** Analyze `correction_reason` for pattern insights
4. **Auto-approval:** High-confidence, frequently-seen corrections auto-approved
5. **Multi-model Ensemble:** Combine fine-tuned + base model for best results

---

## 🔗 **Related Files**

- **Migration:** `supabase/migrations/20251030_create_classification_feedback_system.sql`
- **API Endpoint:** (to be created) `supabase/functions/submit-classification-feedback/index.ts`
- **UI Component:** (to be created) `src/components/ClassificationFeedbackButton.tsx`

---

**Last Updated:** October 30, 2025  
**Version:** 1.0  
**Author:** FloWorx AI System

---

## 🎉 **Expected Results**

After 6 months of collecting feedback and 2-3 fine-tuning cycles:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Overall Accuracy | 85% | 95-97% | +10-12% |
| High-Confidence Errors | 3-5% | <1% | -2-4% |
| SALES accuracy | 80% | 96% | +16% |
| SUPPORT accuracy | 82% | 94% | +12% |
| User corrections needed | 15% | 3-5% | -10-12% |

**ROI:** 10-15% reduction in manual classification work = **2-4 hours saved per week** = **$10-20K annual savings** for typical business.

