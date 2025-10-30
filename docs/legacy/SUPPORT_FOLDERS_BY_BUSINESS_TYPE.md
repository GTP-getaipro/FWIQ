# SUPPORT Folders by Business Type - Exact Mapping

## From baseMasterSchema.js Analysis:

### 1. **Pools & Spas** / **Hot tub & Spa** (Line 380)
```
SUPPORT: [
  "Appointment Scheduling",
  "General",
  "Technical Support",
  "Parts And Chemicals"
]
```
**Classifier needs:** AppointmentScheduling, General, TechnicalSupport, PartsAndChemicals

---

### 2. **HVAC** (Line 526)
```
SUPPORT: [
  "Technical Support",
  "Parts & Filters",
  "Appointment Scheduling",
  "General Inquiries"
]
```
**Classifier needs:** TechnicalSupport, PartsAndFilters, AppointmentScheduling, GeneralInquiries

---

### 3. **Electrician** (Line 724)
```
SUPPORT: [
  "Appointment Scheduling",
  "Estimate Follow-up",
  "Technical Support",
  "General"
]
```
**Classifier needs:** AppointmentScheduling, EstimateFollowUp, TechnicalSupport, General

---

### 4. **General Contractor** (Line 902)
```
SUPPORT: [
  "Scheduling",
  "Customer Service",
  "Technical Support",
  "General"
]
```
**Classifier needs:** Scheduling, CustomerService, TechnicalSupport, General

---

### 5. **Insulation & Foam Spray** (Line 1066)
```
SUPPORT: [
  "Scheduling",
  "Customer Service",
  "Warranty Questions",
  "Technical Support",
  "General"
]
```
**Classifier needs:** Scheduling, CustomerService, WarrantyQuestions, TechnicalSupport, General

---

### 6. **Flooring Contractor** (Line 1233)
```
SUPPORT: [
  "Scheduling",
  "Product Questions",
  "Warranty Support",
  "Customer Service",
  "General"
]
```
**Classifier needs:** Scheduling, ProductQuestions, WarrantySupport, CustomerService, General

---

### 7. **Landscaping** (Line 1401)
```
SUPPORT: [
  "Scheduling",
  "General Inquiries",
  "Billing Questions",
  "Service Complaints",
  "Warranty Issues"
]
```
**Classifier needs:** Scheduling, GeneralInquiries, BillingQuestions, ServiceComplaints, WarrantyIssues

---

### 8. **Painting Contractor** (Line 1569)
```
SUPPORT: [
  "Scheduling",
  "General Inquiries",
  "Paint Warranty Issues",
  "Color Adjustments",
  "Post-Job Support"
]
```
**Classifier needs:** Scheduling, GeneralInquiries, PaintWarrantyIssues, ColorAdjustments, PostJobSupport

---

### 9. **Roofing Contractor** (Line 1724)
```
SUPPORT: [
  "Scheduling",
  "Warranty Repairs",
  "Leak Concerns",
  "Customer Questions",
  "Post-Install Support"
]
```
**Classifier needs:** Scheduling, WarrantyRepairs, LeakConcerns, CustomerQuestions, PostInstallSupport

---

### 10. **Plumber** (Uses Base Schema - Line 187)
```
SUPPORT: [
  "Appointment Scheduling",
  "General",
  "Technical Support"
]
```
**Classifier needs:** AppointmentScheduling, General, TechnicalSupport

---

**Now I need to update the classifier with each business type's EXACT folder names.**

Ready to proceed business-by-business?

