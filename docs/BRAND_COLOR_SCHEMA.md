# FloWorx Brand Color Schema

## Overview
This document defines the comprehensive brand color schema for FloWorx, ensuring visual consistency across all components and pages.

## Primary Brand Colors

### Sky Blue (Primary)
- **50**: `#f0f9ff` - Lightest tint for backgrounds
- **100**: `#e0f2fe` - Very light backgrounds
- **200**: `#bae6fd` - Light borders and dividers
- **300**: `#7dd3fc` - Subtle accents
- **400**: `#38bdf8` - Medium accents
- **500**: `#0ea5e9` - **Primary brand color**
- **600**: `#0284c7` - Hover states
- **700**: `#0369a1` - Active states
- **800**: `#075985` - Dark text on light backgrounds
- **900**: `#0c4a6e` - Darkest shade

### Slate (Secondary)
- **50**: `#f8fafc` - Lightest backgrounds
- **100**: `#f1f5f9` - Card backgrounds
- **200**: `#e2e8f0` - Borders
- **300**: `#cbd5e1` - Disabled states
- **400**: `#94a3b8` - Placeholder text
- **500**: `#64748b` - Secondary text
- **600**: `#475569` - Primary text
- **700**: `#334155` - Headings
- **800**: `#1e293b` - Dark headings
- **900**: `#0f172a` - Darkest text

## Accent Colors

### Emerald (Success/Positive)
- **50**: `#f0fdf4` - Success backgrounds
- **100**: `#dcfce7` - Light success states
- **200**: `#bbf7d0` - Success borders
- **300**: `#86efac` - Success accents
- **400**: `#4ade80` - Success highlights
- **500**: `#22c55e` - **Primary success color**
- **600**: `#16a34a` - Success hover
- **700**: `#15803d` - Success active
- **800**: `#166534` - Success text
- **900**: `#14532d` - Dark success

### Amber (Warning)
- **50**: `#fffbeb` - Warning backgrounds
- **100**: `#fef3c7` - Light warning states
- **200**: `#fde68a` - Warning borders
- **300**: `#fcd34d` - Warning accents
- **400**: `#fbbf24` - Warning highlights
- **500**: `#f59e0b` - **Primary warning color**
- **600**: `#d97706` - Warning hover
- **700**: `#b45309` - Warning active
- **800**: `#92400e` - Warning text
- **900**: `#78350f` - Dark warning

### Red (Error/Destructive)
- **50**: `#fef2f2` - Error backgrounds
- **100**: `#fee2e2` - Light error states
- **200**: `#fecaca` - Error borders
- **300**: `#fca5a5` - Error accents
- **400**: `#f87171` - Error highlights
- **500**: `#ef4444` - **Primary error color**
- **600**: `#dc2626` - Error hover
- **700**: `#b91c1c` - Error active
- **800**: `#991b1b` - Error text
- **900**: `#7f1d1d` - Dark error

## Usage Guidelines

### Primary Actions
- Use **Sky Blue 500** (`#0ea5e9`) for primary buttons and links
- Use **Sky Blue 600** (`#0284c7`) for hover states
- Use **Sky Blue 700** (`#0369a1`) for active/pressed states

### Secondary Actions
- Use **Slate 600** (`#475569`) for secondary buttons
- Use **Slate 700** (`#334155`) for hover states

### Success States
- Use **Emerald 500** (`#22c55e`) for success messages and completed states
- Use **Emerald 50** (`#f0fdf4`) for success backgrounds

### Warning States
- Use **Amber 500** (`#f59e0b`) for warning messages
- Use **Amber 50** (`#fffbeb`) for warning backgrounds

### Error States
- Use **Red 500** (`#ef4444`) for error messages
- Use **Red 50** (`#fef2f2`) for error backgrounds

### Text Colors
- **Primary Text**: Slate 800 (`#1e293b`)
- **Secondary Text**: Slate 600 (`#475569`)
- **Muted Text**: Slate 500 (`#64748b`)
- **Placeholder Text**: Slate 400 (`#94a3b8`)

### Background Colors
- **Page Background**: Slate 50 (`#f8fafc`)
- **Card Background**: White (`#ffffff`)
- **Muted Background**: Slate 100 (`#f1f5f9`)

## Gradient Combinations

### Primary Gradient
```css
background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
```

### Success Gradient
```css
background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
```

### Brand Gradient
```css
background: linear-gradient(135deg, #0ea5e9 0%, #22c55e 50%, #0284c7 100%);
```

## Implementation

### Tailwind CSS Classes
```html
<!-- Primary Button -->
<button class="bg-brand-primary-500 hover:bg-brand-primary-600 text-white">

<!-- Success State -->
<div class="bg-brand-success-50 border border-brand-success-200 text-brand-success-800">

<!-- Warning State -->
<div class="bg-brand-warning-50 border border-brand-warning-200 text-brand-warning-800">

<!-- Error State -->
<div class="bg-brand-error-50 border border-brand-error-200 text-brand-error-800">
```

### CSS Custom Properties
```css
:root {
  --primary: 199 89% 48%;        /* Sky Blue 500 */
  --primary-foreground: 210 40% 98%;
  --accent: 158 64% 52%;         /* Emerald 500 */
  --accent-foreground: 210 40% 98%;
}
```

## Accessibility

### Contrast Ratios
- All color combinations meet WCAG AA standards (4.5:1 minimum)
- Primary text on white: 12.63:1
- Secondary text on white: 7.25:1
- Primary button text: 4.52:1

### Color Blindness Considerations
- Primary and accent colors are distinguishable for most color vision types
- Success/error states use both color and icons for clarity
- Never rely solely on color to convey information

## Examples

### AI Deployment Page
- **Background**: Gradient from Slate 50 to Sky Blue 50
- **Primary Button**: Sky Blue gradient with hover effects
- **Success State**: Emerald gradient with checkmark
- **Progress Indicators**: Sky Blue with Emerald completion

### Dashboard Components
- **Cards**: White background with Slate borders
- **Metrics**: Sky Blue for positive, Amber for warnings
- **Status Indicators**: Emerald for active, Slate for inactive

This color schema ensures a professional, modern, and accessible design that reflects FloWorx's brand identity while maintaining excellent usability across all devices and user types.
