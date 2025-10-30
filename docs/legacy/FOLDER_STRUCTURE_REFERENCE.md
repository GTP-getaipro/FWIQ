# 📁 Complete Folder Structure Reference - Gmail & Outlook

## Overview

FloWorx uses a **3-tier folder hierarchy** that works consistently across **Gmail** and **Outlook** for all **12 business types**.

---

## 🏗️ Three-Tier Hierarchy

### Tier 1: PRIMARY Categories (Top-level folders)
```
BANKING        - Financial transactions
SALES          - Sales inquiries & leads
SUPPORT        - Customer support
MANAGER        - Manager-specific routing
SUPPLIERS      - Supplier communications
URGENT         - Emergency requests
GOOGLE REVIEW  - Google review notifications
FORMSUB        - Form submissions
PHONE          - Phone/voicemail logs
PROMO          - Marketing & promotions
RECRUITMENT    - HR & hiring
SOCIALMEDIA    - Social media engagement
MISC           - Miscellaneous
SEASONAL       - Seasonal events (some businesses)
```

### Tier 2: SECONDARY Categories (Subfolders)
```
BANKING/
  ├── BankAlert
  ├── e-Transfer (has tertiary)
  ├── Invoice
  ├── Payment Confirmation
  ├── Receipts (has tertiary)
  └── Refund

MANAGER/
  ├── Unassigned
  ├── Hailey (dynamic)
  ├── Jillian (dynamic)
  ├── Stacie (dynamic)
  └── Aaron (dynamic)

SUPPLIERS/
  ├── StrongSpas (dynamic)
  ├── AquaSpaPoolSupply (dynamic)
  ├── WaterwayPlastics (dynamic)
  └── ParadisePatioFurnitureLtd (dynamic)
```

### Tier 3: TERTIARY Categories (Sub-subfolders)
```
BANKING/e-Transfer/
  ├── From Business
  └── To Business

BANKING/Receipts/
  ├── Payment Received
  └── Payment Sent
```

---

## 📧 Gmail vs Outlook Implementation

### Gmail (Uses "/" Delimited Paths)

**Primary Folder**:
```
Label Name: "BANKING"
Gmail ID: Label_abc123
```

**Secondary Folder**:
```
Label Name: "BANKING/Receipts"
Gmail ID: Label_def456
Parent: None (Gmail uses path strings, not parent IDs)
```

**Tertiary Folder**:
```
Label Name: "BANKING/Receipts/Payment Sent"
Gmail ID: Label_ghi789
Parent: None (full path in name)
```

**Dynamic Folder**:
```
Label Name: "MANAGER/Hailey"
Gmail ID: Label_xyz123
Metadata: {email: "hailey@business.com"}
```

### Outlook (Uses Parent-Child Relationships)

**Primary Folder**:
```
Folder Name: "BANKING"
Outlook ID: AAMkADExN...
Parent: null (inbox root)
```

**Secondary Folder**:
```
Folder Name: "Receipts"
Outlook ID: AAMkADExN...
Parent: <BANKING folder ID>
URL: /me/mailFolders/<BANKING-ID>/childFolders
```

**Tertiary Folder**:
```
Folder Name: "Payment Sent"
Outlook ID: AAMkADExN...
Parent: <Receipts folder ID>
URL: /me/mailFolders/<Receipts-ID>/childFolders
```

**Dynamic Folder**:
```
Folder Name: "Hailey"
Outlook ID: AAMkADExN...
Parent: <MANAGER folder ID>
Metadata: {email: "hailey@business.com"}
```

---

## 🏢 Complete Structure by Business Type

### Hot tub & Spa

#### Primary Folders (13)
```
BANKING, SALES, SUPPORT, MANAGER, SUPPLIERS, URGENT, GOOGLE REVIEW, 
FORMSUB, PHONE, PROMO, RECRUITMENT, SOCIALMEDIA, MISC
```

#### Secondary + Tertiary Structure

**BANKING** (6 secondary, 4 tertiary):
```
BANKING/
  ├── BankAlert
  ├── e-Transfer/
  │   ├── From Business
  │   └── To Business
  ├── Invoice
  ├── Payment Confirmation
  ├── Receipts/
  │   ├── Payment Received
  │   └── Payment Sent
  └── Refund
```

**SALES** (3-4 secondary, business-specific):
```
SALES/
  ├── New Spa Sales
  ├── Accessory Sales
  └── Consultations
```

**SUPPORT** (4 secondary, business-specific):
```
SUPPORT/
  ├── Appointment Scheduling
  ├── General
  ├── Parts And Chemicals
  └── Technical Support
```

**MANAGER** (1 + dynamic):
```
MANAGER/
  ├── Unassigned
  ├── {Manager1} (e.g., Hailey)
  ├── {Manager2} (e.g., Jillian)
  ├── {Manager3} (e.g., Stacie)
  └── {Manager4} (e.g., Aaron)
```

**SUPPLIERS** (dynamic):
```
SUPPLIERS/
  ├── {Supplier1} (e.g., StrongSpas)
  ├── {Supplier2} (e.g., AquaSpaPoolSupply)
  ├── {Supplier3} (e.g., WaterwayPlastics)
  └── {Supplier4} (e.g., ParadisePatioFurnitureLtd)
```

**FORMSUB** (2-3 secondary):
```
FORMSUB/
  ├── New Submission
  ├── Quote Requests
  └── Service Requests
```

**GOOGLE REVIEW** (2 secondary):
```
GOOGLE REVIEW/
  ├── New Reviews
  └── Review Responses
```

**PHONE** (2 secondary):
```
PHONE/
  ├── Incoming Calls
  └── Voicemails
```

**URGENT** (3-4 secondary):
```
URGENT/
  ├── Emergency Repairs
  ├── Leak Emergencies
  └── Power Outages
```

**PROMO** (2 secondary):
```
PROMO/
  ├── Social Media
  └── Special Offers
```

**RECRUITMENT** (3 secondary):
```
RECRUITMENT/
  ├── Job Applications
  ├── Interviews
  └── New Hires
```

**SOCIALMEDIA** (4 secondary):
```
SOCIALMEDIA/
  ├── Facebook
  ├── Instagram
  ├── Google My Business
  └── LinkedIn
```

**MISC** (2 secondary):
```
MISC/
  ├── General
  └── Personal
```

---

## 🔄 How It Works for Different Business Types

### Electrician
**Same primary structure, different secondary/tertiary:**

```
SALES/
  ├── Service Upgrades
  ├── Wiring Projects
  └── Code Compliance

SUPPORT/
  ├── Code Compliance
  ├── Panel Upgrades
  ├── Parts And Supplies
  └── Electrical Repair

SUPPLIERS/
  ├── ElectricalSupplyCo
  ├── WireWorld
  └── {Dynamic suppliers from Step 4}
```

### HVAC
```
SALES/
  ├── New System Quotes
  ├── Consultations
  ├── Maintenance Plans
  └── Ductless Quotes

SUPPORT/
  ├── Indoor Air Quality
  ├── Duct Cleaning
  ├── Parts And Supplies
  └── HVAC Repair

SUPPLIERS/
  ├── Lennox
  ├── Carrier
  └── {Dynamic suppliers from Step 4}
```

### Plumber
```
SALES/
  ├── Fixture Installation
  ├── Water Heater Service
  └── Pipe Work

SUPPORT/
  ├── Fixture Installation
  ├── Pipe Inspection
  ├── Parts And Supplies
  └── Plumbing Repair

SUPPLIERS/
  ├── Kohler
  ├── Moen
  ├── Delta
  └── {Dynamic suppliers from Step 4}
```

---

## 📐 Universal Structure Pattern

### Core Structure (ALL business types)
```
13-14 PRIMARY folders (same for everyone)
  └── 2-6 SECONDARY folders each (varies by business)
      └── 0-4 TERTIARY folders (only BANKING has these)
```

### Business-Specific Customizations

**What Changes**:
- ✅ SALES secondary folders (specific to services offered)
- ✅ SUPPORT secondary folders (specific to support types)
- ✅ SUPPLIERS default folders (industry suppliers)

**What Stays Same**:
- ✅ BANKING structure (universal financial structure)
- ✅ MANAGER structure (Unassigned + dynamics)
- ✅ URGENT, PHONE, PROMO, RECRUITMENT, SOCIALMEDIA (universal)
- ✅ Tertiary nesting (always BANKING/e-Transfer and BANKING/Receipts)

---

## 🔢 Folder Count by Business Type

| Business Type | Primary | Secondary | Tertiary | Dynamic (Max) | Total (Max) |
|---------------|---------|-----------|----------|---------------|-------------|
| Hot tub & Spa | 13 | ~35 | 4 | 5 + 10 | ~67 |
| Pools | 14 | ~38 | 4 | 5 + 10 | ~71 |
| Electrician | 13 | ~32 | 4 | 5 + 10 | ~64 |
| HVAC | 13 | ~34 | 4 | 5 + 10 | ~66 |
| Plumber | 13 | ~33 | 4 | 5 + 10 | ~65 |
| Roofing | 13 | ~31 | 4 | 5 + 10 | ~63 |
| Painting | 13 | ~30 | 4 | 5 + 10 | ~62 |
| Flooring | 13 | ~32 | 4 | 5 + 10 | ~64 |
| Landscaping | 13 | ~35 | 4 | 5 + 10 | ~67 |
| General Construction | 13 | ~34 | 4 | 5 + 10 | ~66 |
| Insulation & Foam Spray | 13 | ~30 | 4 | 5 + 10 | ~62 |
| Sauna & Icebath | 13 | ~32 | 4 | 5 + 10 | ~64 |

**Note**: Dynamic count = managers (max 5) + suppliers (max 10)

---

## 🎯 Dynamic Folder Injection

### Source: Step 4 (Team Setup)

```javascript
// User enters:
Managers:
  - Hailey (hailey@business.com)
  - Jillian (jillian@business.com)
  - Stacie (stacie@business.com)
  - Aaron (aaron@business.com)

Suppliers:
  - StrongSpas (sales@strongspas.com)
  - AquaSpaPoolSupply (info@aquaspa.com)
  - WaterwayPlastics (sales@waterway.com)
  - ParadisePatioFurnitureLtd (contact@paradise.com)
```

### Processing:

```javascript
// Extract metadata
const managerData = managers.map(m => ({
  name: m.name,              // "Hailey"
  email: m.email             // "hailey@business.com"
}));

const supplierData = suppliers.map(s => ({
  name: s.name,              // "StrongSpas"
  email: s.email,            // "sales@strongspas.com"
  domain: extractDomain(s.email)  // "@strongspas.com"
}));
```

### Injection:

```javascript
// MANAGER folder gets subfolders
MANAGER.sub = [
  "Unassigned",
  ...managerData.map(m => m.name)
];

// SUPPLIERS folder gets subfolders
SUPPLIERS.sub = supplierData.map(s => s.name);
```

### Result in Gmail:

```
MANAGER/Unassigned
MANAGER/Hailey
MANAGER/Jillian
MANAGER/Stacie
MANAGER/Aaron

SUPPLIERS/StrongSpas
SUPPLIERS/AquaSpaPoolSupply
SUPPLIERS/WaterwayPlastics
SUPPLIERS/ParadisePatioFurnitureLtd
```

### Result in Outlook:

```
MANAGER (folder)
  ├── Unassigned (child folder)
  ├── Hailey (child folder)
  ├── Jillian (child folder)
  ├── Stacie (child folder)
  └── Aaron (child folder)

SUPPLIERS (folder)
  ├── StrongSpas (child folder)
  ├── AquaSpaPoolSupply (child folder)
  ├── WaterwayPlastics (child folder)
  └── ParadisePatioFurnitureLtd (child folder)
```

---

## 🤖 Classifier Integration

### Metadata Stored in `business_profiles` Table

```json
{
  "managers": [
    {"name": "Hailey", "email": "hailey@business.com"},
    {"name": "Jillian", "email": "jillian@business.com"},
    {"name": "Stacie", "email": "stacie@business.com"},
    {"name": "Aaron", "email": "aaron@business.com"}
  ],
  "suppliers": [
    {"name": "StrongSpas", "email": "sales@strongspas.com", "domain": "@strongspas.com"},
    {"name": "AquaSpaPoolSupply", "email": "info@aquaspa.com", "domain": "@aquaspa.com"},
    {"name": "WaterwayPlastics", "email": "sales@waterway.com", "domain": "@waterway.com"},
    {"name": "ParadisePatioFurnitureLtd", "email": "contact@paradise.com", "domain": "@paradise.com"}
  ],
  "client_config": {
    "supplierDomains": ["@strongspas.com", "@aquaspa.com", "@waterway.com", "@paradise.com"],
    "managerEmails": ["hailey@business.com", "jillian@business.com", "stacie@business.com", "aaron@business.com"]
  }
}
```

### Classifier System Message (Generated)

```
### Categories:

**MANAGER**: Emails requiring leadership oversight or directed at specific managers
secondary_category: [Unassigned, Hailey, Jillian, Stacie, Aaron]

- Hailey - Mail explicitly for Hailey (hailey@business.com)
  Keywords: hailey, hailey@business.com, manager, assigned

- Jillian - Mail explicitly for Jillian (jillian@business.com)
  Keywords: jillian, jillian@business.com, manager, assigned

**SUPPLIERS**: Emails from suppliers and vendors
secondary_category: [StrongSpas, AquaSpaPoolSupply, WaterwayPlastics, ParadisePatioFurnitureLtd]

- StrongSpas - Emails from StrongSpas (@strongspas.com)
  Keywords: strongspas, @strongspas.com, strongspas.com, supplier, vendor

- AquaSpaPoolSupply - Emails from AquaSpaPoolSupply (@aquaspa.com)
  Keywords: aquaspapoolsupply, @aquaspa.com, aquaspa.com, supplier, vendor
```

### Routing Examples

| Email From | Content/To | Route To |
|------------|------------|----------|
| `sales@strongspas.com` | "Order update" | `SUPPLIERS/StrongSpas` |
| `customer@example.com` | "Contact Hailey about..." | `MANAGER/Hailey` |
| To: `jillian@business.com` | "Team update" | `MANAGER/Jillian` |
| `info@aquaspa.com` | "New products available" | `SUPPLIERS/AquaSpaPoolSupply` |

---

## 📋 Complete Schema Example (Hot tub & Spa)

### Primary → Secondary → Tertiary

```
1. BANKING (PRIMARY)
   ├── BankAlert (SECONDARY)
   ├── e-Transfer (SECONDARY)
   │   ├── From Business (TERTIARY)
   │   └── To Business (TERTIARY)
   ├── Invoice (SECONDARY)
   ├── Payment Confirmation (SECONDARY)
   ├── Receipts (SECONDARY)
   │   ├── Payment Received (TERTIARY)
   │   └── Payment Sent (TERTIARY)
   └── Refund (SECONDARY)

2. SALES (PRIMARY)
   ├── New Spa Sales (SECONDARY)
   ├── Accessory Sales (SECONDARY)
   └── Consultations (SECONDARY)

3. SUPPORT (PRIMARY)
   ├── Appointment Scheduling (SECONDARY)
   ├── General (SECONDARY)
   ├── Parts And Chemicals (SECONDARY)
   └── Technical Support (SECONDARY)

4. MANAGER (PRIMARY)
   ├── Unassigned (SECONDARY)
   ├── Hailey (SECONDARY - DYNAMIC)
   ├── Jillian (SECONDARY - DYNAMIC)
   ├── Stacie (SECONDARY - DYNAMIC)
   └── Aaron (SECONDARY - DYNAMIC)

5. SUPPLIERS (PRIMARY)
   ├── StrongSpas (SECONDARY - DYNAMIC)
   ├── AquaSpaPoolSupply (SECONDARY - DYNAMIC)
   ├── WaterwayPlastics (SECONDARY - DYNAMIC)
   └── ParadisePatioFurnitureLtd (SECONDARY - DYNAMIC)

6. URGENT (PRIMARY)
   ├── Emergency Repairs (SECONDARY)
   ├── Leak Emergencies (SECONDARY)
   ├── Power Outages (SECONDARY)
   └── Other (SECONDARY)

7. GOOGLE REVIEW (PRIMARY)
   ├── New Reviews (SECONDARY)
   └── Review Responses (SECONDARY)

8. FORMSUB (PRIMARY)
   ├── New Submission (SECONDARY)
   ├── Quote Requests (SECONDARY)
   └── Service Requests (SECONDARY)

9. PHONE (PRIMARY)
   ├── Incoming Calls (SECONDARY)
   └── Voicemails (SECONDARY)

10. PROMO (PRIMARY)
    ├── Social Media (SECONDARY)
    └── Special Offers (SECONDARY)

11. RECRUITMENT (PRIMARY)
    ├── Job Applications (SECONDARY)
    ├── Interviews (SECONDARY)
    └── New Hires (SECONDARY)

12. SOCIALMEDIA (PRIMARY)
    ├── Facebook (SECONDARY)
    ├── Instagram (SECONDARY)
    ├── Google My Business (SECONDARY)
    └── LinkedIn (SECONDARY)

13. MISC (PRIMARY)
    ├── General (SECONDARY)
    └── Personal (SECONDARY)
```

**Total Folders**: ~67 (13 primary + 40 secondary + 4 tertiary + up to 10 dynamic)

---

## 🔄 Two-Phase Provisioning Flow

### Phase 1: Skeleton (Step 3 - Business Type)

**Created**:
```
✅ All 13 PRIMARY folders
✅ All business-specific SECONDARY folders
✅ All 4 TERTIARY folders (BANKING only)
✅ MANAGER/Unassigned (placeholder)
✅ SUPPLIERS (empty or with defaults)
```

**NOT Created**:
```
❌ Manager-specific subfolders (user hasn't entered yet)
❌ Supplier-specific subfolders (user hasn't entered yet)
```

**Total**: ~50 folders

### Phase 2: Dynamic Injection (Step 4 - Team Setup)

**User Enters**:
- 4 managers: Hailey, Jillian, Stacie, Aaron
- 4 suppliers: StrongSpas, AquaSpaPoolSupply, WaterwayPlastics, ParadisePatioFurnitureLtd

**System Injects**:
```
✅ MANAGER/Hailey
✅ MANAGER/Jillian
✅ MANAGER/Stacie
✅ MANAGER/Aaron

✅ SUPPLIERS/StrongSpas
✅ SUPPLIERS/AquaSpaPoolSupply
✅ SUPPLIERS/WaterwayPlastics
✅ SUPPLIERS/ParadisePatioFurnitureLtd
```

**Total Added**: 8 dynamic folders

**Grand Total**: ~58 folders for this specific configuration

---

## 🎨 Color Coding (Gmail Only)

| Category | Color | Hex Code |
|----------|-------|----------|
| BANKING | Green | #16a766 |
| SALES | Green | #16a766 |
| SUPPORT | Blue | #4a86e8 |
| MANAGER | Orange | #ffad47 |
| SUPPLIERS | Orange | #ffad47 |
| URGENT | Red | #e11d21 |
| GOOGLE REVIEW | Blue | #4285f4 |
| FORMSUB | Dark Green | #0b804b |
| PHONE | Blue | #4a86e8 |
| PROMO | Purple | #a479e2 |
| RECRUITMENT | Pink | #ff85ad |
| SOCIALMEDIA | Yellow | #ffd351 |
| MISC | Gray | #cccccc |

**Note**: Outlook doesn't support folder colors

---

## 📊 Validation Rules

### Every Business Type Must Have:

#### Required Primary Folders (13):
- ✅ BANKING
- ✅ SALES
- ✅ SUPPORT
- ✅ MANAGER
- ✅ SUPPLIERS
- ✅ URGENT
- ✅ GOOGLE REVIEW
- ✅ FORMSUB
- ✅ PHONE
- ✅ PROMO
- ✅ RECRUITMENT
- ✅ SOCIALMEDIA
- ✅ MISC

#### Required Secondary Under BANKING (6):
- ✅ BankAlert
- ✅ e-Transfer (with 2 tertiary)
- ✅ Invoice
- ✅ Payment Confirmation
- ✅ Receipts (with 2 tertiary)
- ✅ Refund

#### Required Tertiary Under BANKING (4):
- ✅ BANKING/e-Transfer/From Business
- ✅ BANKING/e-Transfer/To Business
- ✅ BANKING/Receipts/Payment Received
- ✅ BANKING/Receipts/Payment Sent

#### Dynamic Requirements:
- ✅ MANAGER must have: Unassigned + {dynamic managers}
- ✅ SUPPLIERS must have: {dynamic suppliers}

---

## 🧪 Testing Structure

### Gmail API Response

```json
{
  "labels": [
    {
      "id": "Label_abc123",
      "name": "BANKING",
      "type": "user",
      "color": {"backgroundColor": "#16a766", "textColor": "#ffffff"}
    },
    {
      "id": "Label_def456",
      "name": "BANKING/Receipts",
      "type": "user",
      "color": {"backgroundColor": "#16a766", "textColor": "#ffffff"}
    },
    {
      "id": "Label_ghi789",
      "name": "BANKING/Receipts/Payment Sent",
      "type": "user",
      "color": {"backgroundColor": "#16a766", "textColor": "#ffffff"}
    },
    {
      "id": "Label_xyz123",
      "name": "MANAGER/Hailey",
      "type": "user",
      "color": {"backgroundColor": "#ffad47", "textColor": "#000000"}
    }
  ]
}
```

### Outlook API Response

```json
{
  "value": [
    {
      "id": "AAMkADExN...",
      "displayName": "BANKING",
      "parentFolderId": null,
      "childFolderCount": 6
    },
    {
      "id": "AAMkADExM...",
      "displayName": "Receipts",
      "parentFolderId": "AAMkADExN...",
      "childFolderCount": 2
    },
    {
      "id": "AAMkADExL...",
      "displayName": "Payment Sent",
      "parentFolderId": "AAMkADExM...",
      "childFolderCount": 0
    },
    {
      "id": "AAMkADExK...",
      "displayName": "Hailey",
      "parentFolderId": "<MANAGER-ID>",
      "childFolderCount": 0
    }
  ]
}
```

---

## 📐 Schema Files Location

| File | Purpose |
|------|---------|
| `src/lib/baseMasterSchema.js` | Base universal schema + business extensions |
| `src/labelSchemas/pools_spas.json` | Pools & Spas specific schema |
| `src/lib/labelProvisionService.js` | Provisioning logic |
| `src/lib/labelSyncValidator.js` | Standard labels definition |

---

## ✅ Consistency Guarantees

**Same structure across**:
- ✅ All 12 business types
- ✅ Gmail and Outlook
- ✅ Single and multi-business profiles
- ✅ Fresh provisioning and re-provisioning
- ✅ Manual and automatic provisioning

**Only differences**:
- ✅ SALES secondary folders (business-specific services)
- ✅ SUPPORT secondary folders (business-specific support)
- ✅ Default SUPPLIERS (industry-specific vendors)
- ✅ Dynamic managers (user-entered)
- ✅ Dynamic suppliers (user-entered)

---

## 🎯 Key Takeaways

1. **3 Tiers**: Primary (13) → Secondary (2-6 each) → Tertiary (4 total, BANKING only)
2. **Dynamic Folders**: Managers and Suppliers injected in Phase 2
3. **Gmail**: Uses "/" in label names for hierarchy
4. **Outlook**: Uses parent-child folder relationships
5. **Business-Agnostic**: Core structure same for all, extensions customize SALES/SUPPORT
6. **Classifier-Ready**: Metadata (emails, domains) extracted and stored
7. **Consistent**: Same logic works for all business types

---

**Total Possible Folders**: 50-70 depending on business type and team size  
**Core Structure**: Consistent across all 12 business types  
**Dynamic Customization**: Via managers/suppliers (Step 4)  

🎉 **Your folder structure is production-grade and scalable!**

