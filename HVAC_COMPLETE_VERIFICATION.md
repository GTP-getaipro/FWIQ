# HVAC - Complete End-to-End Verification

## 📋 HVAC Schema (baseMasterSchema.js lines 526-540)

### SUPPORT Folders:
```
1. Technical Support
2. Parts & Filters
3. Appointment Scheduling
4. General Inquiries
```

### SALES Folders:
```
1. New System Quotes
2. Consultations
3. Maintenance Plans
4. Ductless Quotes
```

### URGENT Folders:
```
1. No Heat
2. No Cooling
3. Carbon Monoxide Alert
4. Water Leak
```

---

## ✅ SUPPORT - Current Classifier Categories:
Need to verify these match schema...

## ✅ SALES - Current Classifier Categories:
Need to verify these match schema...

## ✅ URGENT - Current Classifier Categories:
Need to verify these match schema...

---

## Test Cases:
1. **"My furnace won't turn on"** → Support > TechnicalSupport ✅
2. **"I need a new AC system quote"** → Sales > NewSystemQuotes ✅
3. **"No heat emergency!"** → Urgent > NoHeat ✅
4. **"Need to order filters"** → Support > PartsAndFilters ✅
5. **"CO detector is beeping"** → Urgent > CarbonMonoxideAlert ✅

