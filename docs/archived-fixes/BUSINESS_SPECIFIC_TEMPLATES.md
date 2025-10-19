# Business-Specific N8N Templates

## Overview

The N8N templates have been updated to be business-type specific, containing tailored keywords, scenarios, and configurations for each industry. This replaces the previous identical templates with specialized versions that provide better AI classification and response generation.

## Template Structure

### 1. **Electrician Template** (`electrician_template.json`)
- **Keywords**: `electrician`, `wiring`, `outlet`, `switch`, `panel`, `circuit`, `breaker`, `GFCI`, `AFCI`
- **Emergency Terms**: `spark`, `shock`, `fire`, `smoke` (electrical safety)
- **Services**: Electrical Repairs, Panel Upgrades, Outlets & Switches, Lighting
- **Suppliers**: Electrical Suppliers, Fixture Suppliers, Wire Suppliers, Tool Suppliers
- **AI Tone**: "Professional and safety-focused"
- **Special Features**: Safety-first approach, permit requirements, code compliance

### 2. **HVAC Template** (`hvac_template.json`)
- **Keywords**: `hvac`, `heating`, `cooling`, `furnace`, `heat pump`, `ductwork`, `thermostat`, `refrigerant`
- **Emergency Terms**: `no heat`, `no cooling`, `emergency`, `freezing`, `overheating`
- **Services**: Heating Repairs, Cooling Repairs, Maintenance, Ductwork
- **Suppliers**: Equipment Suppliers, Parts Suppliers, Refrigerant Suppliers, Filter Suppliers
- **AI Tone**: "Professional and knowledgeable"
- **Special Features**: Seasonal priority, energy efficiency focus, comfort concerns

### 3. **Pools & Spas Template** (`pools_spas_generic_template.json`)
- **Keywords**: `hot tub`, `spa`, `jacuzzi`, `pool`, `cold plunge`, `sauna`, `water care`, `chemicals`
- **Emergency Terms**: `leak`, `emergency`, `not working`, `water damage`
- **Services**: Repairs, Installations, Water Care Visits, Cold Plunge Installation
- **Suppliers**: AquaSpaPoolSupply, StrongSpas, WaterwayPlastics, Cold Plunge Co
- **AI Tone**: "Friendly and professional"
- **Special Features**: Water chemistry expertise, installation tips, relaxation focus

### 4. **Hot Tub & Spa Template** (`hot_tub_base_template.json`)
- **Keywords**: `hot tub`, `spa`, `jacuzzi`, `heater`, `pump`, `filter`, `water care`, `chemicals`, `pH`, `chlorine`
- **Emergency Terms**: `leak`, `heater problem`, `electrical issue`, `water damage`
- **Services**: Hot Tub Sales, Spa Repairs, Water Care, Installation, Maintenance
- **Suppliers**: StrongSpas, WaterwayPlastics, AquaSpaPoolSupply, chemical suppliers
- **AI Tone**: "Friendly and professional"
- **Special Features**: Water chemistry focus, spa expertise, customer relaxation

## Key Differences Between Templates

### Content Analysis
Each template includes business-specific content analysis in the Code node:
- **Electrician**: Detects electrical terminology and safety concerns
- **HVAC**: Identifies heating/cooling issues and seasonal concerns
- **Pools & Spas**: Recognizes water equipment and chemistry issues
- **Hot Tub**: Focuses on spa-specific equipment and water care

### AI Classification Prompts
- **Electrician**: Safety-focused classification with electrical expertise
- **HVAC**: Comfort and energy efficiency focused classification
- **Pools & Spas**: Water chemistry and equipment focused classification
- **Hot Tub**: Spa-specific classification with water care expertise

### Emergency Response Generation
- **Electrician**: Safety-oriented, immediate action for electrical hazards
- **HVAC**: Comfort-focused, addressing immediate heating/cooling needs
- **Pools & Spas**: Equipment protection, water safety priority
- **Hot Tub**: Spa equipment protection, water safety focus

### General Response Generation
- **Electrician**: Electrical expertise, code compliance, permit requirements
- **HVAC**: Energy efficiency advice, seasonal maintenance tips
- **Pools & Spas**: Water chemistry guidance, installation support
- **Hot Tub**: Spa expertise, water care advice, relaxation focus

## Template Loading Logic

The system now uses business-specific template selection:

```javascript
const templateMap = {
  'Electrician': 'electrician_template.json',
  'HVAC': 'hvac_template.json',
  'Insulation & Foam Spray': 'hvac_template.json',
  'Pools': 'pools_spas_generic_template.json',
  'Pools & Spas': 'pools_spas_generic_template.json',
  'Hot tub & Spa': 'hot_tub_base_template.json',
  'Sauna & Icebath': 'pools_spas_generic_template.json',
  // Fallbacks for business types without specific templates yet
  'Flooring': 'electrician_template.json',
  'General Construction': 'electrician_template.json',
  'Landscaping': 'electrician_template.json',
  'Painting': 'electrician_template.json',
  'Plumber': 'electrician_template.json',
  'Roofing': 'electrician_template.json'
};
```

## Benefits

1. **Accurate Classification**: Business-specific keywords improve AI classification accuracy
2. **Relevant Responses**: Tailored AI responses match industry terminology and concerns
3. **Proper Escalation**: Emergency keywords trigger appropriate urgent responses
4. **Industry Expertise**: AI responses demonstrate industry-specific knowledge
5. **Better Customer Experience**: Customers receive responses that understand their specific needs

## Future Enhancements

1. **Additional Templates**: Create specific templates for remaining business types
2. **Seasonal Adjustments**: Add seasonal keyword variations (e.g., heating emergencies in winter)
3. **Regional Customization**: Include region-specific terminology and regulations
4. **Supplier Integration**: Enhanced supplier-specific communication patterns
5. **Multi-Business Support**: Improved handling of businesses with multiple service types

## Complete Business Type Coverage

**✅ ALL 12 BUSINESS TYPES NOW HAVE SPECIFIC TEMPLATES:**

1. ✅ **Electrician** - Emergency electrical repairs, wiring, panel upgrades, lighting installation
2. ✅ **HVAC** - Emergency heating/cooling, seasonal maintenance, new installations, duct cleaning  
3. ✅ **Plumber** - Water leaks, burst pipes, drain cleaning, water heater repair/installation
4. ✅ **Flooring** - Hardwood, tile, carpet installation, refinishing, repair, commercial flooring
5. ✅ **General Construction** - Home renovations, construction projects, permits, subcontractor coordination
6. ✅ **Landscaping** - Lawn care, tree services, garden design, irrigation, seasonal maintenance
7. ✅ **Painting** - Interior/exterior painting, color consultations, surface prep, commercial painting
8. ✅ **Roofing** - Roof repairs, replacements, inspections, weather damage, gutter cleaning
9. ✅ **Pools** - Pool installation, repair, maintenance, opening/closing, equipment repair
10. ✅ **Hot tub & Spa** - Hot tub sales, installation, repair, maintenance, water care
11. ✅ **Sauna & Icebath** - Sauna installation, repair, maintenance, cold plunge installation
12. ✅ **Insulation & Foam Spray** - Attic insulation, spray foam, air sealing, energy efficiency

## Files Updated

- `src/lib/n8n-templates/electrician_template.json` - Electrician-specific template
- `src/lib/n8n-templates/hvac_template.json` - HVAC-specific template  
- `src/lib/n8n-templates/pools_spas_generic_template.json` - Pools & spas template
- `src/lib/n8n-templates/hot_tub_base_template.json` - Hot tub-specific template
- `src/lib/n8n-templates/plumber_template.json` - **NEW** Plumber-specific template
- `src/lib/n8n-templates/flooring_template.json` - **NEW** Flooring-specific template
- `src/lib/n8n-templates/construction_template.json` - **NEW** Construction-specific template
- `src/lib/n8n-templates/landscaping_template.json` - **NEW** Landscaping-specific template
- `src/lib/n8n-templates/painting_template.json` - **NEW** Painting-specific template
- `src/lib/n8n-templates/roofing_template.json` - **NEW** Roofing-specific template
- `src/lib/enhancedWorkflowDeployer.js` - Updated template selection logic
- `src/lib/compositeTemplateBuilder.js` - Updated template mapping
- `supabase/functions/deploy-n8n/index.ts` - Updated Edge Function template loading

## Testing

Each template should be tested with:
1. **Industry-specific emails** to verify proper classification
2. **Emergency scenarios** to ensure urgent routing works
3. **Multi-business scenarios** to test template aggregation
4. **Edge cases** with mixed terminology from different industries
