# HVAC Alignment Status Report

## ✅ SUPPORT - Already Good!
**Schema creates:**
- Technical Support
- Parts & Filters
- Appointment Scheduling
- General Inquiries

**Current Classifier (line 1016):**
- IndoorAirQuality ❓
- DuctCleaning ❓
- PartsAndSupplies ❓
- HVACRepair ❓

**Issue:** Category names don't match! Need to update to:
- TechnicalSupport
- PartsAndFilters
- AppointmentScheduling
- GeneralInquiries

---

## 🔄 SALES - Needs Update
**Schema creates (line 499-505):**
- New System Quotes
- Consultations
- Maintenance Plans
- Ductless Quotes

**Current Classifier (line 829):**
- SystemReplacement ❌ (should be NewSystemQuotes)
- InstallationService ❌ (should be DuctlessQuotes)
- MaintenancePlan ✅ (close, but should be MaintenancePlans)

**Missing:** Consultations

---

## 🔄 URGENT - Needs Adding
**Schema creates (line 534-540):**
- No Heat
- No Cooling
- Carbon Monoxide Alert
- Water Leak

**Current Classifier:**
- Generic "Urgent" only ❌

**Needs:** Business-specific URGENT categories for HVAC

---

## Summary:
User likes SUPPORT "as is" - so I'll keep keywords/descriptions but fix category names to match schema exactly. Then update SALES and add URGENT categories.

