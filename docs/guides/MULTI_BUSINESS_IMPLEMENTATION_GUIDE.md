# 🏢 Multi-Business Support System Implementation Guide

## Overview
This system supports **two distinct states** for users:
1. **Single Business State** - User has one business type selected
2. **Multi-Business State** - User has multiple business types selected

## 🎯 Key Features

### Single Business State
- **Simplified UI** - All data consolidated in one view
- **Direct access** - No switching needed
- **Streamlined workflow** - Optimized for single business operations

### Multi-Business State  
- **Business Type Switcher** - Easy switching between business types
- **Context-Aware Data** - Shows only relevant data for active business type
- **Separate Workflows** - Each business type can have its own configuration

## 📁 Files Created

### 1. Database Schema (`multi-business-support-system.sql`)
- Enhanced `business_profiles` table with multi-business support
- Helper functions for business state management
- RLS policies that respect business mode

### 2. JavaScript Service (`src/lib/multiBusinessStateManager.js`)
- `MultiBusinessStateManager` class for state management
- React hook `useBusinessState` for easy integration
- Functions for switching business types and getting active data

### 3. React Component (`src/components/MultiBusinessDashboard.jsx`)
- Example implementation showing both states
- Business type switcher for multi-business mode
- Context-aware UI rendering

## 🚀 Implementation Steps

### Step 1: Apply Database Changes
```sql
-- Run the multi-business-support-system.sql in Supabase SQL Editor
-- This creates all necessary tables, functions, and policies
```

### Step 2: Update Label Sync Service
```javascript
// In src/lib/labelSyncService.js
import { getBusinessStateManager } from './multiBusinessStateManager';

export async function syncOutlookFolders(accessToken, userId, businessType) {
  const manager = getBusinessStateManager(userId);
  const businessState = await manager.getBusinessState();
  
  // Use the active business type for multi-business users
  const activeBusinessType = businessState.isMultiBusiness 
    ? businessState.activeBusinessType 
    : businessType;
    
  // Rest of the sync logic...
}
```

### Step 3: Update Business Type Selection
```javascript
// In Step3BusinessType.jsx
import { getBusinessStateManager } from '@/lib/multiBusinessStateManager';

const handleBusinessTypeSelection = async (selectedTypes) => {
  const manager = getBusinessStateManager(user.id);
  
  // Create or update business profile
  const success = await manager.createOrUpdateBusinessProfile(
    selectedTypes,
    selectedTypes[0], // Primary type
    clientConfig
  );
  
  if (success) {
    // Navigate to next step
    navigate('/onboarding/business-information');
  }
};
```

### Step 4: Add Business Type Switcher
```javascript
// In your main dashboard component
import { useBusinessState } from '@/lib/multiBusinessStateManager';

const Dashboard = () => {
  const { user } = useAuth();
  const { 
    isMultiBusiness, 
    activeBusinessType, 
    allBusinessTypes,
    switchBusinessType 
  } = useBusinessState(user.id);

  return (
    <div>
      {/* Business Type Switcher */}
      {isMultiBusiness && (
        <div className="business-switcher">
          {allBusinessTypes.map(type => (
            <Button
              key={type}
              variant={type === activeBusinessType ? "default" : "outline"}
              onClick={() => switchBusinessType(type)}
            >
              {type}
            </Button>
          ))}
        </div>
      )}
      
      {/* Business-specific content */}
      <BusinessContent businessType={activeBusinessType} />
    </div>
  );
};
```

## 🔧 Database Functions

### Core Functions
- `determine_business_mode(user_uuid)` - Determines if user is single or multi-business
- `get_active_business_profile(user_uuid)` - Gets current active business profile
- `switch_active_business_type(user_uuid, new_type)` - Switches active business type
- `get_labels_for_active_business(user_uuid)` - Gets labels for active business type
- `get_user_business_state(user_uuid)` - Returns complete business state as JSON

### Usage Examples
```sql
-- Get user's business state
SELECT get_user_business_state('user-uuid-here');

-- Switch to different business type
SELECT switch_active_business_type('user-uuid-here', 'HVAC');

-- Get labels for active business
SELECT * FROM get_labels_for_active_business('user-uuid-here');
```

## 🎨 UI Patterns

### Single Business UI
```jsx
// Simple, consolidated view
<div className="single-business-dashboard">
  <h1>Business Dashboard</h1>
  <BusinessOverview />
  <TeamManagement />
  <LabelManagement />
</div>
```

### Multi-Business UI
```jsx
// Context-aware view with switcher
<div className="multi-business-dashboard">
  <BusinessTypeSwitcher />
  <ActiveBusinessContent />
  <BusinessTypeSelector />
</div>
```

## 🔄 State Management

### Business State Object
```javascript
{
  mode: 'single' | 'multi',
  activeBusinessType: 'HVAC',
  allBusinessTypes: ['HVAC', 'Plumbing'],
  primaryBusinessType: 'HVAC',
  profileId: 'uuid',
  isMultiBusiness: true
}
```

### State Changes
- **Automatic detection** - System detects single vs multi based on business types
- **Manual switching** - Users can switch between business types in multi mode
- **Persistent state** - Active business type is saved and restored

## 🚨 Migration Considerations

### Existing Users
- **Automatic migration** - Existing users will be set to 'single' mode
- **Gradual upgrade** - Users can add more business types to become multi-business
- **Backward compatibility** - All existing functionality continues to work

### Data Migration
```sql
-- Existing profiles are automatically migrated
UPDATE public.business_profiles
SET 
  business_mode = CASE 
    WHEN array_length(business_types, 1) <= 1 THEN 'single'
    ELSE 'multi'
  END,
  active_business_type = primary_business_type
WHERE business_mode IS NULL;
```

## 🎯 Benefits

### For Single Business Users
- **Simplified experience** - No unnecessary complexity
- **Faster workflows** - Direct access to all features
- **Clear focus** - Everything relevant to their business type

### For Multi-Business Users
- **Organized data** - Clear separation between business types
- **Context switching** - Easy switching between business contexts
- **Scalable system** - Can add more business types as needed

## 🔍 Testing

### Test Scenarios
1. **Single business user** - Verify simplified UI and direct access
2. **Multi-business user** - Test business type switching and context awareness
3. **Migration** - Test existing users upgrading from single to multi
4. **Data isolation** - Verify data is properly separated by business type

### Test Commands
```sql
-- Test single business mode
SELECT get_user_business_state('single-business-user-id');

-- Test multi-business mode
SELECT get_user_business_state('multi-business-user-id');

-- Test business type switching
SELECT switch_active_business_type('user-id', 'HVAC');
```

## 🚀 Next Steps

1. **Apply the database changes** using `multi-business-support-system.sql`
2. **Integrate the JavaScript service** into your existing components
3. **Update the UI** to show different views based on business state
4. **Test with both single and multi-business users**
5. **Add business type management** features for multi-business users

This system provides a solid foundation for supporting both single and multi-business users while maintaining a clean, intuitive user experience for both scenarios.
