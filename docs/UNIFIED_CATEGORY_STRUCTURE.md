# 🎯 Unified Category Structure

## 📋 **Overview**

This document defines the **universal category structure** used across all FloWorx business types. Both the **folder/label provisioning system** and the **AI classifier system** use the exact same structure to ensure perfect alignment.

---

## 🏗️ **Primary Categories (14 total)**

All businesses get these 14 primary categories:

```
1. BANKING
2. FORMSUB
3. GOOGLE REVIEW (or GoogleReview)
4. MANAGER
5. SALES
6. SUPPLIERS
7. SUPPORT
8. URGENT
9. MISC
10. PHONE
11. PROMO
12. RECRUITMENT
13. SOCIALMEDIA
```

---

## 📂 **Complete Category Structure**

### **1. BANKING** 🟢
**Description:** Financial transactions, invoices, payments, and banking communications

**Secondary Categories:**
- `BankAlert` - Banking security alerts, fraud warnings
- `e-Transfer` - Electronic money transfers
  - **Tertiary:** `From Business`, `To Business` (business-specific)
- `Invoice` - Bills, invoices, and payment requests
- `Receipts` - Payment receipts and transaction confirmations
  - **Tertiary:** `Payment Sent`, `Payment Received` (business-specific)
- `Refund` - Refund requests and processing notifications

---

### **2. FORMSUB** 🟢
**Description:** Automated submissions from website forms or field service apps

**Secondary Categories:**
- `NewSubmission` - Site visitor submissions with contact details
- `WorkOrderForms` - Completed work forms from field service apps

---

### **3. GOOGLE REVIEW** 🔵
**Description:** Notifications about new Google Reviews

**Secondary Categories:**
- `GoogleReview` - New Google Reviews with reviewer name, rating, review text

---

### **4. MANAGER** 🟠
**Description:** Emails requiring leadership oversight or internal operations

**Secondary Categories:** (Dynamic - injected from database)
- `Unassigned` - Internal alerts without specific manager
- `{{Manager1}}` → e.g., "Hailey"
- `{{Manager2}}` → e.g., "Jillian"  
- `{{Manager3}}` → e.g., "Stacie"
- `{{Manager4}}` → e.g., "Aaron"
- `{{Manager5}}` → (optional)

---

### **5. SALES** 🟢
**Description:** Leads or customers expressing purchase interest

**Secondary Categories:** (BUSINESS-SPECIFIC - varies by business type)

**Base Categories (All Businesses):**
- `NewInquiry` - New customer inquiries and lead generation
- `FollowUp` - Follow-up on previous sales conversations
- `QuoteRequest` - Specific requests for quotes and pricing

**Business-Specific Categories:**

**Hot Tub & Spa:**
- `InstallationInquiry` - Inquiries about hot tub/spa installation services
- `ModelSelection` - Questions about specific hot tub/spa models and features
- `MaintenancePackage` - Inquiries about maintenance and service packages

**Electrician:**
- `ServiceUpgrade` - Inquiries about electrical service upgrades and panel work
- `WiringProject` - Questions about wiring projects and electrical installations
- `CodeCompliance` - Inquiries about electrical code compliance and permits

**HVAC:**
- `SystemReplacement` - Inquiries about HVAC system replacement and upgrades
- `InstallationService` - Questions about HVAC installation and setup services
- `MaintenancePlan` - Inquiries about HVAC maintenance and service plans

**Plumber:**
- `FixtureInstallation` - Inquiries about plumbing fixture installation and replacement
- `WaterHeaterService` - Questions about water heater installation and service
- `PipeWork` - Inquiries about pipe installation, repair, and replacement

**Pools:**
- `PoolDesign` - Inquiries about pool design and construction
- `EquipmentSelection` - Questions about pool equipment and accessories
- `InstallationService` - Inquiries about pool installation and setup services

**Roofing:**
- `RoofReplacement` - Inquiries about roof replacement and major repairs
- `RoofRepair` - Questions about roof repairs and maintenance
- `GutterService` - Inquiries about gutter installation and maintenance

**Painting:**
- `InteriorPainting` - Inquiries about interior painting services
- `ExteriorPainting` - Questions about exterior painting and weather protection
- `ColorConsultation` - Inquiries about color selection and design consultation

**Flooring:**
- `FloorInstallation` - Inquiries about flooring installation and replacement
- `FloorRepair` - Questions about floor repair and restoration services
- `MaterialSelection` - Inquiries about flooring materials and options

**Landscaping:**
- `DesignConsultation` - Inquiries about landscape design and planning
- `InstallationService` - Questions about landscape installation and construction
- `MaintenanceService` - Inquiries about landscape maintenance and care

**General Construction:**
- `ProjectPlanning` - Inquiries about construction project planning and design
- `RenovationService` - Questions about renovation and remodeling services
- `NewConstruction` - Inquiries about new construction and building services

**Insulation & Foam Spray:**
- `EnergyAudit` - Inquiries about energy audits and efficiency assessments
- `InsulationInstallation` - Questions about insulation installation and upgrades
- `AirSealing` - Inquiries about air sealing and weatherization services

**Sauna & Icebath:**
- `SaunaInstallation` - Inquiries about sauna installation and setup
- `IceBathInstallation` - Questions about ice bath and cold plunge installation
- `EquipmentSelection` - Inquiries about sauna and ice bath equipment options

---

### **6. SUPPLIERS** 🟠
**Description:** Emails from suppliers and vendors

**Secondary Categories:** (Dynamic - injected from database)
- `{{Supplier1}}` → e.g., "Strong Spas"
- `{{Supplier2}}` → e.g., "Aqua Spa Supply"
- `{{Supplier3}}` → e.g., "Paradise Patio"

---

### **7. SUPPORT** 🔵
**Description:** Existing customers needing post-sales support

**Secondary Categories:** (BUSINESS-SPECIFIC - varies by business type)

**Base Categories (All Businesses):**
- `AppointmentScheduling` - Booking/rescheduling/canceling visits
- `General` - Other support inquiries

**Business-Specific Categories:**

**Hot Tub & Spa:**
- `WaterCare` - Spa water care and chemical balance questions
- `Winterization` - Spa winterization and seasonal maintenance
- `PartsAndChemicals` - Orders or inquiries about spa parts, chemicals, and supplies
- `SpaRepair` - Spa equipment repair and troubleshooting

**Electrician:**
- `CodeCompliance` - Electrical code questions and compliance issues
- `PanelUpgrades` - Electrical panel upgrades and service upgrades
- `PartsAndSupplies` - Orders or inquiries about electrical parts, supplies, and materials
- `ElectricalRepair` - Electrical system repair and troubleshooting

**HVAC:**
- `IndoorAirQuality` - Indoor air quality testing and improvement
- `DuctCleaning` - Duct cleaning and maintenance services
- `PartsAndSupplies` - Orders or inquiries about HVAC parts, supplies, and materials
- `HVACRepair` - HVAC system repair and troubleshooting

**Plumber:**
- `FixtureInstallation` - Plumbing fixture installation and replacement
- `PipeInspection` - Pipe inspection and maintenance services
- `PartsAndSupplies` - Orders or inquiries about plumbing parts, supplies, and materials
- `PlumbingRepair` - Plumbing system repair and troubleshooting

**Pools:**
- `WaterChemistry` - Pool water chemistry and balance
- `EquipmentRepair` - Pool equipment repair and maintenance
- `PartsAndChemicals` - Orders or inquiries about pool parts, chemicals, and supplies
- `PoolTroubleshooting` - Pool system troubleshooting and repair

**Roofing:**
- `RoofInspection` - Roof inspection and assessment services
- `GutterCleaning` - Gutter cleaning and maintenance services
- `PartsAndSupplies` - Orders or inquiries about roofing parts, supplies, and materials
- `RoofRepair` - Roof repair and maintenance services

**Painting:**
- `ColorConsultation` - Color consultation and paint selection
- `SurfacePrep` - Surface preparation and paint preparation
- `PartsAndSupplies` - Orders or inquiries about painting supplies, materials, and equipment
- `PaintIssues` - Paint problems and touch-up services

**Flooring:**
- `FloorRepair` - Floor repair and restoration services
- `MaterialSelection` - Flooring material consultation and selection
- `PartsAndSupplies` - Orders or inquiries about flooring materials, supplies, and tools
- `FlooringIssues` - Flooring problems and maintenance

**Landscaping:**
- `GardenDesign` - Garden design and landscaping consultation
- `Irrigation` - Irrigation system installation and maintenance
- `PartsAndSupplies` - Orders or inquiries about landscaping supplies, plants, and equipment
- `LandscapeMaintenance` - Landscape maintenance and care issues

**General Construction:**
- `ProjectManagement` - Construction project management and coordination
- `PermitAssistance` - Building permit assistance and documentation
- `PartsAndSupplies` - Orders or inquiries about construction materials, supplies, and equipment
- `ConstructionIssues` - Construction problems and quality issues

**Insulation & Foam Spray:**
- `EnergyEfficiency` - Energy efficiency consultation and upgrades
- `Soundproofing` - Soundproofing solutions and installation
- `PartsAndSupplies` - Orders or inquiries about insulation materials, supplies, and equipment
- `InsulationIssues` - Insulation problems and performance issues

**Sauna & Icebath:**
- `HeaterRepair` - Sauna heater repair and maintenance
- `ChillerRepair` - Ice bath chiller repair and maintenance
- `PartsAndSupplies` - Orders or inquiries about sauna/ice bath parts, supplies, and equipment
- `SaunaIceBathIssues` - Sauna and ice bath system problems

---

### **8. URGENT** 🔴
**Description:** Emergency-related emails requiring immediate action

**Secondary Categories:** (GENERIC - same for all businesses)
- `Urgent` - Generic urgent/emergency category

**❌ REMOVED:** Business-specific urgent subcategories
- ~~Spa Leak~~ (Hot Tub & Spa)
- ~~Heater Failure~~ (Hot Tub & Spa)
- ~~Power Outage~~ (Electrician)
- ~~Electrical Emergency~~ (Electrician)
- ~~No Heat~~ (HVAC)
- ~~No Cooling~~ (HVAC)
- etc.

---

### **9. MISC** ⚫
**Description:** Unclassifiable emails (last resort)

**Secondary Categories:**
- `Misc` - General miscellaneous

---

### **10. PHONE** 🟤
**Description:** Phone/SMS/voicemail provider notifications

**Secondary Categories:**
- `Phone` - All phone provider emails (e.g., service@ringcentral.com)

---

### **11. PROMO** 🟣
**Description:** Marketing, discounts, sales flyers

**Secondary Categories:**
- `Promo` - Marketing campaigns and promotional content

---

### **12. RECRUITMENT** ⚫
**Description:** Job applications, resumes, interviews

**Secondary Categories:**
- `Recruitment` - HR and recruitment communications

---

### **13. SOCIALMEDIA** 🔴
**Description:** Social media platform notifications

**Secondary Categories:**
- `Socialmedia` - Social media engagement and DMs

---

## ✅ **What Gets Customized Per Business?**

### **1. Tertiary Categories (BANKING only)**

**e-Transfer:**
- `From Business` - Business-specific description
- `To Business` - Business-specific description

**Receipts:**
- `Payment Sent` - Business-specific description
- `Payment Received` - Business-specific description

**Example for Hot Tub & Spa:**
```
e-Transfer > From Business:
"Outgoing e-transfers for spa equipment, chemicals, and supplier payments"

e-Transfer > To Business:
"Incoming e-transfers from customers for spa and hot tub services"
```

**Example for Electrician:**
```
e-Transfer > From Business:
"Outgoing e-transfers for electrical suppliers, contractors, and material vendors"

e-Transfer > To Business:
"Incoming e-transfers from customers for electrical services and repairs"
```

### **2. Sales Subcategories (BUSINESS-SPECIFIC)**

**Hot Tub & Spa:**
- Base: NewInquiry, FollowUp, QuoteRequest
- Business-specific: InstallationInquiry, ModelSelection, MaintenancePackage

**Electrician:**
- Base: NewInquiry, FollowUp, QuoteRequest
- Business-specific: ServiceUpgrade, WiringProject, CodeCompliance

**HVAC:**
- Base: NewInquiry, FollowUp, QuoteRequest
- Business-specific: SystemReplacement, InstallationService, MaintenancePlan

**And so on for all 12 business types...**

### **3. Support Subcategories (BUSINESS-SPECIFIC)**

**Hot Tub & Spa:**
- Base: AppointmentScheduling, General
- Business-specific: WaterCare, Winterization, PartsAndChemicals, SpaRepair

**Electrician:**
- Base: AppointmentScheduling, General
- Business-specific: CodeCompliance, PanelUpgrades, PartsAndSupplies, ElectricalRepair

**HVAC:**
- Base: AppointmentScheduling, General
- Business-specific: IndoorAirQuality, DuctCleaning, PartsAndSupplies, HVACRepair

**And so on for all 12 business types...**

### **4. Dynamic Names**

**Managers:** Injected from database
- Hailey, Jillian, Stacie, Aaron (for Hot Tub Man)
- John, Mary, Steve (for another business)

**Suppliers:** Injected from database
- Strong Spas, Aqua Spa Supply (for Hot Tub Man)
- ABC Electric Supply, DEF Electrical (for Electrician)

### **5. Keywords (for AI intelligence)**

**Sales Keywords:**
- Hot Tub & Spa: "hot tub, spa, jacuzzi, whirlpool"
- Electrician: "electrical, wiring, panel, outlet"
- Plumber: "plumbing, pipe, fixture, water heater"

**Urgent Keywords:**
- Hot Tub & Spa: "heater not working, spa leaking, jets broken"
- Electrician: "no power, electrical emergency, breaker tripping"
- Plumber: "water leak, burst pipe, no water"

---

## 🎯 **Folder Structure = Classifier Structure**

The folder provisioning system creates **exactly these folders** in Gmail/Outlook:

```
BANKING/
  ├── BankAlert
  ├── e-Transfer/
  │   ├── From Business
  │   └── To Business
  ├── Invoice
  ├── Receipts/
  │   ├── Payment Received
  │   └── Payment Sent
  └── Refund

FORMSUB/
  ├── NewSubmission
  └── WorkOrderForms

GOOGLE REVIEW/
  └── GoogleReview

MANAGER/
  ├── Unassigned
  ├── Hailey
  ├── Jillian
  ├── Stacie
  └── Aaron

SALES/
  ├── NewInquiry
  ├── FollowUp
  ├── QuoteRequest
  ├── InstallationInquiry (Hot Tub & Spa only)
  ├── ModelSelection (Hot Tub & Spa only)
  └── MaintenancePackage (Hot Tub & Spa only)

SUPPLIERS/
  ├── Strong Spas
  ├── Aqua Spa Supply
  └── Paradise Patio

SUPPORT/
  ├── AppointmentScheduling
  ├── General
  ├── WaterCare (Hot Tub & Spa only)
  ├── Winterization (Hot Tub & Spa only)
  ├── PartsAndChemicals (Hot Tub & Spa only)
  └── SpaRepair (Hot Tub & Spa only)

URGENT/
  └── Urgent

MISC/
  └── Misc

PHONE/
  └── Phone

PROMO/
  └── Promo

RECRUITMENT/
  └── Recruitment

SOCIALMEDIA/
  └── Socialmedia
```

The AI classifier uses **exactly the same structure** to categorize emails, ensuring they land in the correct folders.

---

## 🚀 **Benefits**

✅ **Perfect Alignment** - Folders and classifier always match
✅ **Consistency** - Same structure for all 12 business types
✅ **Maintainability** - One system to update, not 12+
✅ **Scalability** - Easy to add new business types
✅ **Simplicity** - Clients understand the structure easily

---

## 📝 **Implementation Files**

### **Folder Provisioning:**
- `src/lib/labelProvisionService.js` - Creates folders
- `src/lib/baseMasterSchema.js` - Defines base folder structure
- `src/lib/labelSchemaMerger.js` - Merges schemas for multi-business

### **Classifier Generation:**
- `src/lib/enhancedDynamicClassifierGenerator.js` - Generates classifier
- `src/lib/aiSchemaInjector.js` - Integrates into workflow
- `supabase/functions/deploy-n8n/index.ts` - Edge function implementation

### **Customization Data:**
- `src/lib/enhancedDynamicClassifierGenerator.js` - `BUSINESS_TERTIARY_CUSTOMIZATIONS`
- Database `profiles` table - `managers`, `suppliers` arrays

---

## 🎯 **Result**

**One unified category structure** that:
- ✅ Creates folders in Gmail/Outlook
- ✅ Tells AI how to categorize emails
- ✅ Works for all 12 business types
- ✅ Scales to hundreds of clients
- ✅ Requires minimal maintenance

**Only business-specific customizations:**
- Tertiary category descriptions (e-Transfer, Receipts)
- Dynamic manager/supplier names
- Sales/urgent keywords for AI intelligence

