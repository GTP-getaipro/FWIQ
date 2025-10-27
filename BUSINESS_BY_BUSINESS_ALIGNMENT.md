# Business-by-Business Classifier Alignment Plan

## Strategy: Align Each Business Type Individually

Each business type has unique SUPPORT folders. The classifier must match EXACTLY what each schema creates.

---

## 1️⃣ Hot Tub & Spa / Pools & Spas

### Folders Created (poolsSpasExtension line 380-399):
```javascript
SUPPORT: {
  sub: [
    "Appointment Scheduling",
    "General",
    "Technical Support",
    "Parts And Chemicals"
  ]
}
```

### Classifier Should Generate:
```javascript
"Hot tub & Spa": {
  "AppointmentScheduling": { ... },  // ✅ Matches "Appointment Scheduling"
  "General": { ... },                 // ✅ Matches "General"  
  "TechnicalSupport": { ... },        // ✅ Matches "Technical Support"
  "PartsAndChemicals": { ... }        // ✅ Matches "Parts And Chemicals"
}
```

**Status:** ✅ ALREADY FIXED (commit 42711bf)

---

## 2️⃣ HVAC

### Folders Created (hvacExtension line 526-532):
```javascript
SUPPORT: {
  sub: [
    "Technical Support",
    "Parts & Filters",
    "Appointment Scheduling",
    "General Inquiries"
  ]
}
```

### Classifier Should Generate:
```javascript
"HVAC": {
  "AppointmentScheduling": { ... },
  "GeneralInquiries": { ... },      // Note: "General Inquiries" not "General"
  "TechnicalSupport": { ... },
  "PartsAndFilters": { ... }         // Note: "Parts & Filters" not "Parts And Chemicals"
}
```

**Status:** ❌ NEEDS FIX

---

## 3️⃣ Next Steps:

1. Check each business extension schema
2. Note exact folder names
3. Update classifier to match those exact names
4. Go through all 12 business types

Should I continue checking all business types?

