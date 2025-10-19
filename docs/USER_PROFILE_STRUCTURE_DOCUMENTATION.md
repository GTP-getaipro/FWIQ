# User Profile Data Structure Documentation

## 📋 **Current Profile Structure Analysis**

Based on the codebase analysis, the user profile data is stored in the `profiles` table with the following structure:

### **Database Table: `profiles`**

#### **Core Profile Fields**
```sql
-- Basic user information
id UUID PRIMARY KEY REFERENCES auth.users(id)
business_type VARCHAR(50)
onboarding_step VARCHAR(50)

-- Provider management
primary_provider VARCHAR(50) DEFAULT 'gmail'
dual_provider_mode BOOLEAN DEFAULT FALSE
last_provider_change TIMESTAMP WITH TIME ZONE
migration_enabled BOOLEAN DEFAULT TRUE

-- Timestamps
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

#### **JSONB Configuration Fields**
```sql
-- Main configuration object
client_config JSONB

-- Team and contact information
managers JSONB
suppliers JSONB

-- Email management
email_labels JSONB
```

### **Detailed Field Structures**

#### **1. `client_config` JSONB Structure**
```javascript
{
  // Business Information
  business: {
    name: string,
    legalEntityName: string,
    taxNumber: string,
    address: string,
    serviceArea: string,
    timezone: string,
    currency: string, // 'USD', 'EUR', etc.
    emailDomain: string,
    website: string
  },
  
  // Contact Information
  contact: {
    primaryContactName: string,
    primaryContactRole: string,
    primaryContactEmail: string,
    afterHoursPhone: string
  },
  
  // Business Rules & Settings
  rules: {
    sla: string, // '24h', '48h', etc.
    tone: string, // 'Friendly', 'Professional', etc.
    defaultEscalationManager: string,
    escalationRules: string,
    businessHours: {
      mon_fri: string, // '09:00-18:00'
      sat: string,     // '10:00-16:00'
      sun: string      // 'Closed'
    },
    holidays: string[], // Array of holiday dates
    language: string,   // 'en', 'es', etc.
    aiGuardrails: {
      allowPricing: boolean,
      signatureMode: string // 'custom', 'none'
    }
  },
  
  // Services Offered
  services: [
    {
      name: string,
      description: string,
      pricingType: string, // 'hourly', 'fixed', 'per_unit'
      price: string,
      category: string
    }
  ],
  
  // Signature Configuration
  signature: string,
  
  // Version Control
  version: number,
  client_id: string // UUID
}
```

#### **2. `managers` JSONB Structure**
```javascript
[
  {
    name: string,
    email: string,
    role: string,      // Optional
    phone: string,     // Optional
    department: string // Optional
  }
]
```

#### **3. `suppliers` JSONB Structure**
```javascript
[
  {
    name: string,
    email: string,
    domains: string[], // Email domains for supplier emails
    category: string,  // 'equipment', 'parts', 'services', etc.
    phone: string,     // Optional
    contact_person: string // Optional
  }
]
```

#### **4. `email_labels` JSONB Structure**
```javascript
{
  // Gmail Labels
  gmail: {
    [labelName]: {
      id: string,
      name: string,
      color: {
        backgroundColor: string,
        textColor: string
      }
    }
  },
  
  // Outlook Folders
  outlook: {
    [folderName]: {
      id: string,
      name: string,
      parentId: string | null
    }
  }
}
```

### **Onboarding Data Structure**

The system also uses a separate `onboarding_data` table for step-by-step data collection:

```sql
CREATE TABLE onboarding_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  step VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Onboarding Steps**
1. `email_integration` - Email provider setup
2. `business_type` - Business type selection
3. `team_setup` - Manager and supplier setup
4. `business_information` - Detailed business configuration
5. `label_mapping` - Email label/folder configuration
6. `provision_labels` - Label creation and validation

### **Related Tables**

#### **Integrations Table**
```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  provider VARCHAR(50), -- 'gmail', 'outlook'
  access_token TEXT,
  refresh_token TEXT,
  status VARCHAR(20), -- 'active', 'inactive', 'expired'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Credentials Table**
```sql
CREATE TABLE credentials (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  provider VARCHAR(50), -- 'openai', 'mysql', 'n8n'
  encrypted_data TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Current Usage Patterns**

#### **Frontend Components Using Profile Data**
- `Dashboard.jsx` - Displays profile information
- `StepBusinessInformation.jsx` - Business configuration
- `StepTeamSetup.jsx` - Manager and supplier setup
- `Step3BusinessType.jsx` - Business type selection
- `Step5ProvisionLabels.jsx` - Label provisioning

#### **Backend Services Using Profile Data**
- `n8nConfigMapper.js` - Maps profile data to n8n workflows
- `deployment.js` - Uses profile for workflow deployment
- `credentialService.js` - Manages user credentials

### **Data Flow**

1. **User Registration** → Creates basic profile record
2. **Onboarding Steps** → Updates `onboarding_step` and stores data in `onboarding_data`
3. **Business Configuration** → Updates `client_config` with business details
4. **Team Setup** → Updates `managers` and `suppliers` arrays
5. **Email Integration** → Creates records in `integrations` table
6. **Label Provisioning** → Updates `email_labels` with created labels

### **Validation Rules**

#### **Required Fields**
- `business_type` - Must be one of predefined business types
- `client_config.business.name` - Business name is required
- `client_config.contact.primaryContactEmail` - Primary contact email required

#### **Optional Fields**
- `managers` - Can be empty array
- `suppliers` - Can be empty array
- `email_labels` - Populated during label provisioning

#### **Business Rules**
- `managers` array limited to 5 entries
- `suppliers` array limited to 10 entries
- `client_config.version` auto-increments on updates
- `onboarding_step` follows defined sequence

### **Migration Considerations**

The profile structure has evolved over time with additions for:
- Provider migration support (`primary_provider`, `dual_provider_mode`)
- Enhanced onboarding data collection
- Improved email label management
- Better business configuration structure

### **Performance Considerations**

- JSONB fields are indexed for common queries
- Profile updates use versioning to prevent conflicts
- Large JSONB objects are split into logical sections
- Related data is normalized into separate tables where appropriate
