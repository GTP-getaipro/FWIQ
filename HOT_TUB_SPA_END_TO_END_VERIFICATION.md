# Hot Tub & Spa - End-to-End Verification

## 🎯 Goal: Verify ALL components are aligned

### Components to Check:
1. ✅ **Schema** - What folders get created (baseMasterSchema.js)
2. ✅ **Classifier** - What categories AI generates (enhancedDynamicClassifierGenerator.js)
3. ✅ **System Prompt** - What AI sees in instructions (goldStandardSystemPrompt.js)
4. ✅ **Keywords** - Trigger words for each category
5. ✅ **Descriptions** - Clear explanations

---

## 📂 SUPPORT Category

### 1. Folders Created (Schema):
```javascript
poolsSpasExtension.SUPPORT.sub = [
  "Appointment Scheduling",
  "General",
  "Technical Support",
  "Parts And Chemicals"
]
```

### 2. Classifier Categories (MUST MATCH):
```javascript
"Hot tub & Spa": {
  "AppointmentScheduling",    // ✅ Matches
  "General",                   // ✅ Matches
  "TechnicalSupport",          // ✅ Matches  
  "PartsAndChemicals"          // ✅ Matches
}
```

### 3. System Prompt (Need to check):
- Does goldStandardSystemPrompt list these 4 categories?
- Are keywords comprehensive?

### 4. Keywords Check:
- AppointmentScheduling: schedule, book, appointment, etc. ✅
- General: water care, winterization, basic questions ✅
- TechnicalSupport: repair, leak, broken, error ✅
- PartsAndChemicals: parts, chemicals, order, buy ✅

**Status:** Need to verify system prompt

---

## 🛒 SALES Category

### 1. Folders Created (Schema):
```javascript
poolsSpasExtension.SALES.sub = [
  "New Spa Sales",
  "Accessory Sales",
  "Consultations",
  "Quote Requests"
]
```

### 2. Classifier Categories (Need to check):
Need to verify classifier generates exact names

### 3. System Prompt (Need to check):
Need to verify goldStandardSystemPrompt has these

**Status:** Need to verify

---

## 🚨 URGENT Category

### 1. Folders Created (Schema):
```javascript
poolsSpasExtension.URGENT.sub = [
  "Emergency Repairs",
  "Leak Emergencies",
  "Power Outages",
  "Other"
]
```

### 2. Classifier Categories (Need to check):
Need to verify classifier generates exact names

### 3. System Prompt (Need to check):
Need to verify goldStandardSystemPrompt has these

**Status:** Need to verify

---

## Next Steps:
1. Check SALES classifier for Hot Tub & Spa
2. Check URGENT classifier for Hot Tub & Spa
3. Verify goldStandardSystemPrompt has all categories
4. Update any mismatches
5. THEN move to next business type

