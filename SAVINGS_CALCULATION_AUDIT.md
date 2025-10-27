# Savings Calculation Audit

## Current Formula (lines 418-457)

```javascript
// Inputs:
- emailsPerDay = 25.0 (from email logs)
- classificationTime = 2 minutes (default)
- responseTime = 5 minutes (default)
- hourlyRate = $25 (default)
- aiAccuracy = 85% (default)

// Annual Calculation:
emailsPerYear = 25 * 22 * 12 = 6,600 emails/year
  (22 working days/month × 12 months)

totalTimePerEmail = 2 + 5 = 7 minutes

// Without AI:
totalTimeWithoutAI = 6,600 × 7 = 46,200 minutes = 770 hours

// With AI (AI does 85%, human reviews 15%):
totalTimeWithAI = 6,600 × 7 × (1 - 0.85) = 6,930 minutes = 115.5 hours

// Time Saved:
timeSaved = 770 - 115.5 = 654.5 hours ❌ MISMATCH!
  (But dashboard shows 1029h)

// Cost Saved:
costSaved = 654.5 × $25 = $16,362 ❌ MISMATCH!
  (But dashboard shows $25,713)
```

## 🚨 Issues Found:

1. **Time doesn't match**: Should be ~655h, but shows 1029h
2. **Cost doesn't match**: Should be ~$16,362, but shows $25,713
3. **Possible causes:**
   - Different default values being used
   - Calculator using different logic than display
   - Values not syncing properly

Let me check the actual default values...

