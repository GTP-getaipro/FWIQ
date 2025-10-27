# HVAC SUPPORT - End-to-End Verification

## ✅ Schema (What Folders Get Created)
**Source:** `baseMasterSchema.js` - hvacExtension (lines 526-532)

```javascript
SUPPORT: {
  sub: [
    { name: "Technical Support" },
    { name: "Parts & Filters" },
    { name: "Appointment Scheduling" },
    { name: "General Inquiries" }
  ]
}
```

## ✅ Classifier (What AI Generates)
**Current categories in classifier:**
Need to check...

## ✅ Expected Mapping:
```
Technical Support      → TechnicalSupport
Parts & Filters        → PartsAndFilters (NOTE: Must match "Parts & Filters" not "PartsAndSupplies")
Appointment Scheduling → AppointmentScheduling
General Inquiries      → GeneralInquiries
```

## 🔍 Keywords Check:
- **TechnicalSupport:** repair, troubleshoot, furnace, AC, heat pump, broken, technical issue
- **PartsAndFilters:** parts, filters, supplies, order, thermostats (MUST include "filters" prominently)
- **AppointmentScheduling:** schedule, book, appointment, tune-up, maintenance visit
- **GeneralInquiries:** general questions, air quality, duct cleaning, consultation

