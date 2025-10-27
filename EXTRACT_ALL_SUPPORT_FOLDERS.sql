-- Extract SUPPORT folder structure for each business type from baseMasterSchema.js

-- Base Schema (Lines 187-204): 
-- Used by: Plumber, Sauna & Icebath (no extension)
SUPPORT: [
  "Appointment Scheduling",
  "General", 
  "Technical Support"
]

-- Pools & Spas Extension (Lines 380-399):
-- Used by: Hot tub & Spa, Pools, Pools & Spas
SUPPORT: [
  "Appointment Scheduling",
  "General",
  "Technical Support",
  "Parts And Chemicals"  -- ADDED
]

-- HVAC Extension (Lines 526-532):
SUPPORT: [
  "Technical Support",
  "Parts & Filters",           -- DIFFERENT NAME
  "Appointment Scheduling",
  "General Inquiries"          -- DIFFERENT NAME (not "General")
]

-- Need to check:
- Electrician Extension
- General Contractor Extension
- Insulation & Foam Spray Extension
- Flooring Contractor Extension
- Landscaping Extension
- Painting Contractor Extension
- Roofing Contractor Extension

