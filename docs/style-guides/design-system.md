# MyK9Show Apple-Inspired Design System

## Overview

This design system document serves as the comprehensive guide for maintaining visual consistency across all pages and components in the MyK9Show application. The design follows Apple's Human Interface Guidelines, adapted for web and the dog show management domain.

### Quick Links
- [Color System](#color-system) - Primary, semantic, and theme colors
- [Typography](#typography) - Font scales and usage
- [Layout Patterns](#layout-patterns) - Page templates for different use cases
- [Component Patterns](#component-patterns) - Reusable UI components
- [Tab Bars](#tab-bars) - Premium navigation with gradient backgrounds
- [State Patterns](#state-patterns) - Loading, empty, and error states
- [Advanced Components](#advanced-component-patterns) - Data viz, search, filters
- [Implementation Guidelines](#implementation-guidelines) - Development workflow

### Version History
- **v2.0** (Current) - Enhanced with comprehensive page layouts, state patterns, and advanced components
- **v1.0** - Initial design system with basic components

## Design Principles

### 1. **Clarity**
- Every element serves a purpose
- Clear visual hierarchy with proper contrast
- Readable typography at all sizes

### 2. **Deference**
- The interface doesn't compete with content
- Subtle animations and transitions
- Clean, uncluttered layouts

### 3. **Depth**
- Visual depth through layering and shadows
- Proper use of blur and transparency
- Contextual overlays and modals

## Color System

### Primary Palette
```css
/* Primary Colors */
--primary-blue: #007AFF;
--secondary-purple: #5856D6;
--gradient-primary: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);

/* Semantic Colors */
--success-green: #34C759;
--success-light: #30D158;
--warning-orange: #FF9500;
--warning-light: #FF6200;
--error-red: #FF3B30;
--error-light: #FF375F;
--premium-gold: #FFD700;
--premium-orange: #FFA500;
```

### Theme Variables
```css
:root {
  /* Light Theme */
  --background: 210 40% 98%;
  --foreground: 222.2 47.4% 11.2%;
  --card: #ffffff;
  --card-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --border: #e5e7eb;
  --input: 214.3 31.8% 91.4%;
  --primary: #2563eb;
  --primary-foreground: 210 40% 98%;
  --secondary: 220 14.3% 95.9%;
  --secondary-foreground: 220.9 39.3% 11%;
  --radius: 0.5rem;
}

.dark {
  /* Dark Theme */
  --background: #1a1d23;
  --foreground: #f8fafc;
  --card: #1f2229;
  --card-foreground: #f8fafc;
  --muted: #2a2d35;
  --muted-foreground: #9ca3af;
  --border: #374151;
  --input: #2a2d35;
  --primary: #3b82f6;
  --primary-foreground: #ffffff;
  --secondary: #2a2d35;
  --secondary-foreground: #f8fafc;
}
```

### Usage Guidelines
- **Primary Blue**: CTAs, links, active states
- **Semantic Colors**: Status indicators, alerts, badges
- **Neutral Grays**: Text, borders, backgrounds
- **Premium Colors**: Special features, awards, achievements

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif;
```

### Type Scale
```css
/* Headlines */
.text-4xl { font-size: 2.25rem; font-weight: 700; line-height: 1.15; } /* 36px */
.text-3xl { font-size: 1.875rem; font-weight: 650; line-height: 1.2; } /* 30px */
.text-2xl { font-size: 1.5rem; font-weight: 590; line-height: 1.25; } /* 24px */
.text-xl { font-size: 1.25rem; font-weight: 590; line-height: 1.3; } /* 20px */

/* Body Text */
.text-lg { font-size: 1.125rem; font-weight: 500; line-height: 1.4; } /* 18px */
.text-base { font-size: 1rem; font-weight: 400; line-height: 1.5; } /* 16px */
.text-sm { font-size: 0.875rem; font-weight: 500; line-height: 1.4; } /* 14px */

/* Labels and Captions */
.text-xs { font-size: 0.75rem; font-weight: 590; line-height: 1.3; } /* 12px */
.label-text { 
  font-size: 0.8125rem; /* 13px */
  font-weight: 590; 
  text-transform: uppercase; 
  letter-spacing: 0.02em; 
}
```

### Font Weight System
- **700**: Main headlines and critical information
- **650**: Section headers and emphasis
- **590**: Subheadings, labels, and metadata
- **500**: Regular emphasized text
- **400**: Standard body text

### Typography Usage
```tsx
// Component Examples
<h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
<h2 className="text-xl font-semibold">Section Header</h2>
<p className="text-base text-muted-foreground">Body text</p>
<span className="label-text text-muted-foreground">Field Label</span>
```

## Spacing System

### 8px Grid System
```css
/* Base spacing scale (8px increments) */
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem;  /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem;    /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem;  /* 24px */
--space-8: 2rem;    /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem;   /* 48px */
--space-16: 4rem;   /* 64px */
--space-20: 5rem;   /* 80px */
```

### Layout Spacing
- **Page padding**: 80px top/bottom (accounting for fixed header)
- **Section gaps**: 32-48px between major sections
- **Component padding**: 20-32px for cards and containers
- **Grid gaps**: 16-24px for standard layouts, 4-6px for tight layouts
- **Form field spacing**: 16px between fields, 24px between sections

## Border Radius System

```css
/* Border radius scale */
--radius-sm: 0.5rem;  /* 8px - Small components */
--radius-md: 0.75rem; /* 12px - Buttons, inputs */
--radius-lg: 1rem;    /* 16px - Cards */
--radius-xl: 1.25rem; /* 20px - Dialogs, major containers */
--radius-full: 9999px; /* Fully rounded - Pills, badges */
```

## Component Patterns

### Cards

MyK9Show cards use **premium styling** with subtle borders, enhanced gradients, and sophisticated hover effects that provide both definition and engaging interactions.

```tsx
// Standard Card - Premium styling for all cards throughout the app
const CardComponent = () => (
  <Card className="group relative overflow-hidden bg-gradient-to-br from-card to-card/80 
                   border border-border rounded-2xl p-6 shadow-sm backdrop-blur-xl 
                   transition-all duration-500 hover:shadow-xl hover:-translate-y-2">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent 
                     opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative">
      {/* Card content */}
    </div>
  </Card>
);

// Feature Card - Enhanced version for marketing and landing sections
const FeatureCard = () => (
  <Card className="group relative overflow-hidden bg-gradient-to-br from-card to-card/80 
                   border border-border rounded-2xl p-8 shadow-sm backdrop-blur-xl 
                   transition-all duration-500 hover:shadow-xl hover:-translate-y-2">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent 
                     opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative">
      <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl 
                       flex items-center justify-center mb-6 shadow-sm group-hover:shadow-xl 
                       group-hover:scale-110 transition-all duration-300">
        {/* Icon content */}
      </div>
      {/* Enhanced content */}
    </div>
  </Card>
);
```

#### Card Guidelines
- **Always use `border border-border`** for subtle definition that complements the gradient
- **Use `rounded-2xl`** for enhanced, modern appearance 
- **Include `backdrop-blur-xl`** for sophisticated depth and layering
- **The `border-border` color** automatically adjusts for light/dark themes
- **Hover states** use enhanced shadows (`hover:shadow-xl`) and transform (`hover:-translate-y-2`)
- **Gradient overlays** provide subtle interactive feedback on hover

#### Card Variants
- **Standard Card**: Premium styling with gradients and enhanced hover effects for all use cases
- **Feature Card**: Enhanced version with icon containers for marketing and landing sections
- **Stats Card**: Compact metrics cards using the same premium pattern
- **Show Card**: Specialized cards with image scaling and enhanced visual effects

### Tab Bars

MyK9Show uses **premium tab bars** with gradient backgrounds, rounded pill containers, and sophisticated active states that provide clear navigation while maintaining Apple-inspired aesthetics.

```tsx
// Standard Tab Bar - Premium styling for all tab navigation
const TabBarComponent = ({ tabCount }: { tabCount: number }) => (
  <Tabs defaultValue="tab1" className="w-full">
    <TabsList className={cn(
      "grid w-full bg-gradient-to-r from-muted/50 to-muted/30 border border-border/30 rounded-xl p-1",
      `grid-cols-${tabCount}`
    )}>
      <TabsTrigger 
        value="tab1"
        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all duration-300"
      >
        Tab 1
      </TabsTrigger>
      <TabsTrigger 
        value="tab2"
        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all duration-300"
      >
        Tab 2
      </TabsTrigger>
    </TabsList>
    <TabsContent value="tab1">
      {/* Tab content */}
    </TabsContent>
  </Tabs>
);

// Dynamic Tab Bar - For variable tab counts
const DynamicTabBar = ({ tabs }: { tabs: Array<{id: string, label: string}> }) => (
  <Tabs defaultValue={tabs[0]?.id} className="w-full">
    <TabsList 
      className="grid w-full bg-gradient-to-r from-muted/50 to-muted/30 border border-border/30 rounded-xl p-1"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab) => (
        <TabsTrigger 
          key={tab.id}
          value={tab.id}
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all duration-300"
        >
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
);

// Tab Bar with Badges - For showing counts or status indicators
const TabBarWithBadges = () => (
  <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-muted/50 to-muted/30 border border-border/30 rounded-xl p-1">
    <TabsTrigger 
      value="all"
      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all duration-300"
    >
      <span className="flex items-center gap-2">
        All Shows
        <Badge variant="secondary" className="text-xs px-1.5 py-0.5 min-w-[20px] justify-center">
          12
        </Badge>
      </span>
    </TabsTrigger>
  </TabsList>
);

// Tab Bar with Premium Features - For disabled states and premium indicators
const PremiumTabBar = () => (
  <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-muted/50 to-muted/30 border border-border/30 rounded-xl p-1">
    <TabsTrigger 
      value="basic"
      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all duration-300"
    >
      Basic
    </TabsTrigger>
    <TabsTrigger 
      value="premium"
      disabled={!isPremium}
      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all duration-300 data-[state=disabled]:opacity-50"
    >
      <Crown className="mr-2 h-4 w-4" />
      Premium
    </TabsTrigger>
  </TabsList>
);
```

#### Tab Bar Guidelines
- **Container**: Always use `bg-gradient-to-r from-muted/50 to-muted/30` for the gradient background
- **Borders**: Use `border border-border/30` for subtle definition that works in light/dark themes
- **Border Radius**: Use `rounded-xl` for the container and `rounded-lg` for individual triggers
- **Active States**: Use gradient backgrounds `data-[state=active]:from-primary/10 data-[state=active]:to-primary/5`
- **Transitions**: Use `transition-all duration-300` for smooth state changes
- **Grid Layout**: Use CSS Grid with appropriate column counts for equal spacing
- **Dynamic Grids**: Use inline styles with `gridTemplateColumns` for variable tab counts

#### Tab Bar Variants
- **Standard Tab Bar**: Fixed number of tabs with consistent spacing
- **Dynamic Tab Bar**: Variable number of tabs with calculated grid columns
- **Tab Bar with Badges**: Include count indicators or status badges
- **Premium Tab Bar**: Support disabled states and premium feature indicators
- **Responsive Tab Bar**: Horizontal scrolling for narrow viewports (use `overflow-x-auto`)

#### Common Patterns
```css
/* Fixed 2-column tabs */
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }

/* Fixed 3-column tabs */
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }

/* Fixed 4-column tabs */
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

/* Fixed 5-column tabs */
.grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }

/* Fixed 6-column tabs */
.grid-cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }

/* Dynamic columns (use inline style) */
style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}
```

### Buttons
```tsx
// Primary Button - Enhanced with premium effects
<Button className="bg-gradient-to-r from-primary to-secondary 
                   text-primary-foreground hover:shadow-xl 
                   hover:-translate-y-1 hover:scale-[1.02] 
                   transition-all duration-300 shadow-sm">
  Action
</Button>

// Secondary Button - Enhanced hover states
<Button variant="outline" className="border-primary/20 text-primary 
                                    hover:bg-primary/5 hover:border-primary/40 
                                    hover:-translate-y-0.5 transition-all duration-300 
                                    shadow-sm rounded-full">
  Secondary
</Button>

// Ghost Button - Subtle enhancements
<Button variant="ghost" className="text-primary hover:bg-primary/10 
                                  hover:-translate-y-0.5 transition-all duration-300">
  Ghost
</Button>
```

#### Button Sizes
- **Small**: `h-8 px-3 text-xs` - For compact spaces
- **Default**: `h-9 px-4 text-sm` - Standard size
- **Large**: `h-10 px-6 text-base` - Prominent actions

### Dialogs

Dialogs follow a different pattern than cards - they use **no borders** and rely on shadows and backdrop blur for definition.

```tsx
const DialogComponent = () => (
  <DialogContent className="bg-card/95 backdrop-blur-xl border-0 
                           shadow-2xl rounded-2xl p-8 max-w-md w-[90vw]">
    <DialogHeader>
      <DialogTitle className="text-xl font-semibold">Dialog Title</DialogTitle>
      <DialogDescription className="text-muted-foreground">
        Dialog description text
      </DialogDescription>
    </DialogHeader>
    {/* Dialog content */}
    <DialogFooter className="pt-6">
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
);
```

#### Dialog vs Card Borders
- **Dialogs**: Use `border-0` with strong shadows and backdrop blur
- **Cards**: Use `border border-border` for subtle definition
- **Reason**: Dialogs float above content and need stronger visual separation through shadows

### Border Treatment Guidelines

Consistent border treatment is critical for visual hierarchy and Apple-inspired aesthetics.

#### Border Prominence Control
- **Too Prominent**: Using `border-2`, heavy opacity, or strong colors creates visual noise
- **Subtle & Refined**: Use `border border-border` for clean definition that adapts to light/dark themes
- **Visual Reference**: Compare against Data Lifecycle page styling for the gold standard

```tsx
// ❌ Avoid: Prominent borders that compete with content
<div className="border-2 border-primary/50 p-6">
  
// ❌ Avoid: Heavy border treatments
<div className="border-border/30 shadow-lg border-2">

// ✅ Preferred: Subtle borders for definition
<div className="border border-border p-6 bg-muted/50 rounded-xl">
  
// ✅ Preferred: Consistent with design system
<Card className="border border-border rounded-2xl">
```

#### Section Consistency Rules
- **All major content sections** should have consistent border treatment
- **Current status sections** (like "Current Mode") should use `border border-border`
- **Configuration options** should use `border border-border` for visual consistency
- **Statistical cards** should use `border border-border` to match the overall page aesthetic

### Detail Page Field Styling Standards

Consistent field styling is essential for Apple-inspired detail pages (Dog Details, User Details, Show Details, etc.).

#### Apple Subtle Border Classes
Use these predefined CSS classes for consistent styling:

```css
/* Card borders - subtle definition */
.apple-subtle-card-border {
  border: 0.5px solid var(--border) !important;
}

/* Field separators - even more subtle with opacity */
.apple-subtle-field-separator {
  border-bottom: 0.5px solid var(--border) !important;
  opacity: 0.3;
}
```

#### ⚠️ CSS Specificity Issue Fix
**Problem**: The `apple-subtle-field-separator` class can cause text color inheritance issues due to the `opacity: 0.3` affecting child elements.

**Solution**: For field rows between content, use inline styles to bypass CSS cascade issues:

```tsx
// ✅ CORRECT - Use inline styles for field separators (works in both light and dark modes)
<div className="flex items-center justify-between py-3" style={{ borderBottom: '0.5px solid rgba(128, 128, 128, 0.2)' }}>
  <span className="text-xs font-medium text-muted-foreground/80 tracking-wide uppercase">
    Field Label
  </span>
  <span className="text-sm font-medium text-foreground">
    Field Value
  </span>
</div>

// ❌ AVOID - This affects text colors due to opacity cascade
<div className="flex items-center justify-between py-3 apple-subtle-field-separator">
  <!-- content inherits opacity -->
</div>

// ❌ AVOID - Tailwind border classes can be overridden
<div className="flex items-center justify-between py-3 border-b border-border/20">
  <!-- may resolve to bright white borders -->
</div>
```

#### Theme-Aware Border Colors

For borders that need to work in both light and dark modes:

```tsx
// ✅ RECOMMENDED - Universal subtle borders for field separators
style={{ borderBottom: '0.5px solid rgba(128, 128, 128, 0.2)' }}

// ✅ ALTERNATIVE - CSS custom properties for card borders  
style={{ border: '0.5px solid hsl(var(--border))' }}

// ❌ AVOID - Fixed colors that only work in one theme
style={{ borderBottom: '0.5px solid rgba(255, 255, 255, 0.1)' }}  // Only visible in dark mode
style={{ borderBottom: '0.5px solid rgba(0, 0, 0, 0.1)' }}      // Only visible in light mode
```

**Color Explanation**:
- `rgba(128, 128, 128, 0.2)`: Neutral gray with 20% opacity
  - **Light mode**: Appears as subtle dark line against light background
  - **Dark mode**: Appears as subtle light line against dark background
  - **Benefit**: Single solution that adapts to any background

**When to use each approach**:
- **Inline styles with rgba(128,128,128,0.2)**: For field separators between content rows
- **CSS classes with custom properties**: For card borders and container elements  
- **Tailwind classes**: For spacing, typography, and non-border styling

#### Text Color Hierarchy for Detail Pages
Follow this exact pattern for field labels and values:

```tsx
// ✅ Correct: Field with proper label/value colors
<div className="flex items-center justify-between py-3 border-b border-border/30">
  <span className="text-xs font-medium text-muted-foreground/80 tracking-wide uppercase">
    Field Label
  </span>
  <span className="text-sm font-medium text-foreground">
    Field Value
  </span>
</div>
```

#### Critical CSS Import Requirement
The Apple subtle border classes are defined in `apple-user-details.css`. **This file MUST be imported in `src/index.css`**:

```css
/* Import custom styles */
@import './styles/apple-user-details.css';
```

#### Common CSS Specificity Pitfalls

**❌ Problem: Using CSS classes that override text colors**
```tsx
// This can cause ALL text to be affected by CSS cascade issues
<div className="apple-subtle-field-separator">
  <span className="text-muted-foreground">Label</span>
  <span className="text-foreground">Value</span>
</div>
```

**✅ Solution: Use direct border classes when text color issues arise**
```tsx
// Use direct Tailwind classes to avoid CSS cascade conflicts
<div className="flex items-center justify-between py-3 border-b border-border/30">
  <span className="text-xs font-medium text-muted-foreground/80 tracking-wide uppercase">
    Label
  </span>
  <span className="text-sm font-medium text-foreground">
    Value
  </span>
</div>
```

#### Detail Page Component Pattern
Use this exact structure for all detail page information cards:

```tsx
const DetailCard = ({ title, icon: Icon, children }) => (
  <Card className="group bg-gradient-to-br from-card/95 to-card/80 apple-subtle-card-border 
                   rounded-2xl p-6 shadow-md backdrop-blur-xl transition-all duration-500 
                   hover:shadow-xl hover:-translate-y-1 hover:border-primary/20">
    {/* Gradient hover effect */}
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-transparent 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl" />
    
    <div className="relative space-y-6">
      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
      </div>
      
      {/* Field rows */}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  </Card>
);

// Field Row Component
const FieldRow = ({ label, value, isLast = false }) => (
  <div className={`flex items-center justify-between py-3 ${!isLast ? 'border-b border-border/30' : ''}`}>
    <span className="text-xs font-medium text-muted-foreground/80 tracking-wide uppercase">
      {label}
    </span>
    <span className="text-sm font-medium text-foreground">
      {value}
    </span>
  </div>
);
```

#### Troubleshooting Field Colors

**Issue**: Field labels and values are both white in dark mode
**Cause**: CSS specificity conflicts or missing imports
**Solutions**:
1. Ensure `apple-user-details.css` is imported in `index.css`
2. Replace `apple-subtle-field-separator` class with direct Tailwind: `border-b border-border/30`
3. Avoid applying `opacity` to field containers (it affects child text)
4. Use `text-muted-foreground/80 tracking-wide uppercase` for labels
5. Use `text-foreground` for values (not `!text-gray-900 dark:!text-white`)

**Issue**: Borders not appearing
**Cause**: CSS file not imported or class conflicts
**Solution**: Import the CSS file and use `apple-subtle-card-border` for cards

#### Field Styling Checklist
- [ ] Card uses `apple-subtle-card-border` class
- [ ] Labels use `text-xs font-medium text-muted-foreground/80 tracking-wide uppercase`
- [ ] Values use `text-sm font-medium text-foreground`
- [ ] Field separators use `border-b border-border/30` (not opacity on container)
- [ ] Last field row has no bottom border
- [ ] `apple-user-details.css` is imported in `index.css`
- [ ] Tested in both light and dark themes

### Forms
```tsx
const FormComponent = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Label className="label-text text-foreground">Field Label</Label>
      <Input className="h-10 bg-background border-border/50 
                        focus:border-primary focus:ring-2 
                        focus:ring-primary/20 rounded-lg" />
      <p className="text-xs text-muted-foreground">Helper text</p>
    </div>
  </div>
);
```

### Navigation Tabs
```tsx
const TabsComponent = () => (
  <Tabs defaultValue="tab1" className="space-y-6">
    <TabsList className="bg-muted/50 backdrop-blur-sm border-b border-border/50">
      <TabsTrigger value="tab1" className="data-[state=active]:bg-transparent 
                                          data-[state=active]:text-primary 
                                          data-[state=active]:border-b-2 
                                          data-[state=active]:border-primary">
        Tab 1
      </TabsTrigger>
    </TabsList>
    <TabsContent value="tab1">
      {/* Tab content */}
    </TabsContent>
  </Tabs>
);
```

## Status and Feedback

### Status Badges
```tsx
const StatusBadge = ({ status, children }) => {
  const variants = {
    success: "bg-success-green/10 text-success-green border-success-green/20",
    warning: "bg-warning-orange/10 text-warning-orange border-warning-orange/20",
    error: "bg-error-red/10 text-error-red border-error-red/20",
    default: "bg-muted text-muted-foreground border-border"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full 
                      text-xs font-medium border ${variants[status] || variants.default}`}>
      {children}
    </span>
  );
};
```

### Progress Indicators
```tsx
const ProgressBar = ({ value, max = 100 }) => (
  <div className="bg-muted rounded-full h-2 overflow-hidden">
    <div 
      className="bg-gradient-to-r from-primary to-secondary h-full 
                 rounded-full transition-all duration-500"
      style={{ width: `${(value / max) * 100}%` }}
    />
  </div>
);
```

## Animation and Transitions

### Standard Easing
```css
/* Apple's preferred easing function */
--ease-apple: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### Animation Scope Control

Control animation scope to prevent overwhelming the user with too many moving elements.

#### Container vs Individual Element Animations
- **Main containers**: Avoid hover animations on large containers when child elements also animate
- **Individual elements**: Apply hover effects to specific interactive components
- **Progressive enhancement**: Start subtle, add effects only where they enhance usability

```tsx
// ❌ Avoid: Both container and children animating simultaneously
<Card className="hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
  <Button className="hover:-translate-y-1 transition-all duration-300">Option 1</Button>
  <Button className="hover:-translate-y-1 transition-all duration-300">Option 2</Button>
</Card>

// ✅ Preferred: Stationary container with animated children
<Card className="border border-border rounded-2xl">
  <Button className="hover:-translate-y-1 transition-all duration-300">Option 1</Button>
  <Button className="hover:-translate-y-1 transition-all duration-300">Option 2</Button>
</Card>

// ✅ Alternative: Container animation only for cards without interactive children
<Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
  <div>Static content only</div>
</Card>
```

### Common Animations
```css
/* Enhanced Card Hover Effect */
.card-hover {
  transition: all 0.5s var(--ease-apple);
}
.card-hover:hover {
  transform: translateY(-8px);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.15);
}

/* Enhanced Button Hover Effect */
.button-hover {
  transition: all 0.3s var(--ease-apple);
}
.button-hover:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 32px rgba(37, 99, 235, 0.3);
}

/* Dialog Enter Animation */
@keyframes dialog-enter {
  0% { 
    opacity: 0; 
    transform: translate(-50%, -50%) scale(0.95); 
  }
  80% { 
    opacity: 1; 
    transform: translate(-50%, -50%) scale(1.02); 
  }
  100% { 
    opacity: 1; 
    transform: translate(-50%, -50%) scale(1); 
  }
}
```

### Framer Motion Variants
```tsx
// Common animation variants
export const fadeInUp = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
};

export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.1 }
  }
};

export const scaleOnHover = {
  whileHover: { scale: 1.02, y: -2 },
  transition: { type: "spring", stiffness: 400, damping: 17 }
};
```

## Layout Patterns

### Information Architecture Principles

#### Content Hierarchy
- **Critical information first**: Performance statistics, system status
- **Configuration below status**: User controls after current state display  
- **Grouping related functionality**: Settings grouped logically
- **Progressive disclosure**: Advanced options in clearly marked sections

```tsx
// ✅ Preferred: Information hierarchy
<Page>
  {/* 1. Current system status */}
  <PerformanceStatistics />
  
  {/* 2. Current configuration state */}
  <CurrentModeSection />
  
  {/* 3. Configuration options */}
  <StorageModeSelection />
  
  {/* 4. Advanced settings */}
  <AdvancedSettings />
</Page>
```

#### Status-First Design Pattern
- **Performance metrics at top**: Users need to see current system state before making changes
- **Individual stat card borders**: Use `border border-border` for consistency with page aesthetic
- **Logical flow**: Status → Current Settings → Configuration Options → Advanced Settings

```tsx
// ✅ Status-first layout with consistent borders
<div className="space-y-6">
  {/* Performance metrics with bordered cards */}
  <div className="grid gap-6 md:grid-cols-3">
    <div className="p-6 bg-muted/50 rounded-2xl border border-border">
      <h4 className="text-sm text-muted-foreground uppercase">Storage Adapter</h4>
      <p className="text-2xl font-bold">{stats.storage.type}</p>
    </div>
    {/* More stat cards... */}
  </div>
  
  {/* Configuration sections below */}
  <ConfigurationSections />
</div>
```

### Role-Based Sidebar Navigation

The Admin Console features an elegant sidebar navigation pattern that should be replicated for other role dashboards (Secretary, Judge, etc.).

#### Sidebar Navigation Component Pattern

```tsx
// Standard Role Sidebar Structure
interface NavGroup {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
}

// Sidebar Component Structure
const RoleSidebar = ({ navigationGroups, roleTitle, roleIcon, onCloseMobile }) => (
  <div className="flex h-full flex-col bg-card">
    {/* Header with role branding */}
    <div className="flex h-16 items-center justify-between border-b border-border px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary shadow-sm">
          <roleIcon className="h-4 w-4 text-primary-foreground" />
        </div>
        <h2 className="text-base font-semibold" style={{ fontWeight: 590 }}>
          {roleTitle}
        </h2>
      </div>
      {/* Mobile close button */}
    </div>

    {/* Navigation Groups */}
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <nav className="space-y-8">
        {navigationGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <h3 className="mb-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.title}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {item.description}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>

    {/* Footer with role status */}
    <div className="border-t border-border p-4">
      <div className="rounded-lg bg-muted/30 p-3">
        <div className="flex items-center gap-2 mb-1">
          <roleIcon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Role Access</span>
        </div>
        <p className="text-xs text-muted-foreground">Role-specific privileges</p>
      </div>
    </div>
  </div>
);
```

#### Sidebar Layout Integration

```tsx
// Layout component for sidebar-based role dashboards
const RoleLayout = ({ children, sidebarComponent: SidebarComponent }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 transform bg-card border-r border-border transition-transform duration-300 ease-in-out md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarComponent onCloseMobile={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-72">
        {/* Mobile header with menu button */}
        <div className="sticky top-16 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur-sm px-4 md:hidden">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto pt-16 md:pt-0">
          <div className="px-6 py-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
```

#### Navigation Patterns by Role

**Secretary Dashboard Navigation Groups:**
```tsx
const secretaryNavigationGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', href: '/secretary/dashboard', icon: LayoutDashboard, description: 'Overview and quick actions' }
    ]
  },
  {
    title: 'Show Management',
    items: [
      { title: 'My Shows', href: '/secretary/shows', icon: Calendar, description: 'Shows you are managing' },
      { title: 'Browse Shows', href: '/browse-shows', icon: Search, description: 'Find and explore shows' },
      { title: 'Create Show', href: '/secretary/create-show', icon: Plus, description: 'Start a new show' }
    ]
  },
  {
    title: 'Entry Management',
    items: [
      { title: 'Entries', href: '/entries', icon: FileText, description: 'Manage show entries' },
      { title: 'Class Creation', href: '/secretary/class-creation', icon: Grid, description: 'Create and manage classes' },
      { title: 'Run Orders', href: '/secretary/run-order', icon: List, description: 'Class scheduling and ordering' }
    ]
  },
  {
    title: 'Participants',
    items: [
      { title: 'People', href: '/people', icon: Users, description: 'Exhibitors and handlers' },
      { title: 'Dogs', href: '/dogs', icon: Heart, description: 'Registered dogs' },
      { title: 'Clubs', href: '/clubs', icon: Building, description: 'Club management' }
    ]
  },
  {
    title: 'Tools',
    items: [
      { title: 'Calendar', href: '/calendar', icon: Calendar, description: 'Event scheduling' },
      { title: 'Alerts', href: '/alerts', icon: Bell, description: 'Notifications and updates' }
    ]
  }
];
```

#### Sidebar Design Guidelines
- **Fixed width**: 288px (w-72) provides optimal content space
- **Header branding**: Role icon + title for clear context
- **Grouped navigation**: Logical grouping with descriptive section headers
- **Active states**: Gradient background + left border + primary color text
- **Hover states**: Subtle background change with smooth transitions
- **Mobile responsive**: Overlay with backdrop blur for mobile devices
- **Footer status**: Role access indicator for security context

#### Implementation for Secretary Dashboard
The Secretary dashboard should replace its current horizontal navigation with this sidebar pattern for:
1. **Better organization** of numerous secretary functions
2. **Consistent UX** with the Admin dashboard
3. **Improved navigation** with grouped, searchable menu items
4. **Professional appearance** matching Apple-inspired design standards

### Page Layout Templates

#### 1. Standard Page Layout (Default)
```tsx
const StandardPageLayout = ({ children, title, subtitle }) => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-6 py-20 max-w-7xl">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground text-lg">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  </div>
);
```

#### 2. Dashboard Layout (Calendar, Secretary Dashboard)
```tsx
const DashboardLayout = ({ children, title, actions, stats }) => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
      
      {/* Stats Cards Row */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats}
        </div>
      )}
      
      {/* Main Content */}
      <div className="space-y-8">
        {children}
      </div>
    </div>
  </div>
);
```

#### 3. Entity Detail Layout (Show Details, Dog Profiles)
```tsx
const EntityDetailLayout = ({ 
  children, 
  title, 
  subtitle, 
  headerActions, 
  breadcrumbs,
  sidebar 
}) => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Breadcrumbs */}
      {breadcrumbs && (
        <nav className="mb-6 text-sm">
          {breadcrumbs}
        </nav>
      )}
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground text-lg">{subtitle}</p>
          )}
        </div>
        {headerActions && (
          <div className="mt-4 lg:mt-0 lg:ml-6 flex-shrink-0">
            {headerActions}
          </div>
        )}
      </div>
      
      {/* Content Layout */}
      <div className={`grid gap-8 ${sidebar ? 'lg:grid-cols-3' : 'grid-cols-1'}`}>
        <div className={sidebar ? 'lg:col-span-2' : 'col-span-1'}>
          {children}
        </div>
        {sidebar && (
          <div className="lg:col-span-1">
            {sidebar}
          </div>
        )}
      </div>
    </div>
  </div>
);
```

#### 4. List/Browse Layout (Browse Shows, My Entries)
```tsx
const ListPageLayout = ({ 
  children, 
  title, 
  filters, 
  viewControls,
  searchBar,
  bulkActions 
}) => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6">{title}</h1>
        
        {/* Search and Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {searchBar && (
            <div className="flex-1">
              {searchBar}
            </div>
          )}
          {viewControls && (
            <div className="flex items-center gap-2">
              {viewControls}
            </div>
          )}
        </div>
        
        {/* Filters */}
        {filters && (
          <div className="mb-6">
            {filters}
          </div>
        )}
        
        {/* Bulk Actions */}
        {bulkActions && (
          <div className="mb-4">
            {bulkActions}
          </div>
        )}
      </div>
      
      {/* Content */}
      {children}
    </div>
  </div>
);
```

### Grid Layouts

#### Responsive Card Grids
```tsx
// Standard 3-column grid (shows, entries)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Card items */}
</div>

// Stats cards (4-column on large screens)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Stat cards */}
</div>

// Two-column content
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  {/* Content columns */}
</div>

// Three-column with sidebar
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  <div className="lg:col-span-2">{/* Main content */}</div>
  <div className="lg:col-span-1">{/* Sidebar */}</div>
</div>
```

#### List Layouts
```tsx
// Table-style list
<div className="space-y-1">
  {items.map(item => (
    <div key={item.id} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
      {/* List item content */}
    </div>
  ))}
</div>

// Compact list with dividers
<div className="divide-y divide-border">
  {items.map(item => (
    <div key={item.id} className="py-4 first:pt-0 last:pb-0">
      {/* List item content */}
    </div>
  ))}
</div>
```

## Responsive Design

### Breakpoints
```css
/* Tailwind breakpoints used throughout the app */
sm: 640px   /* Mobile landscape and up */
md: 768px   /* Tablet and up */
lg: 1024px  /* Desktop and up */
xl: 1280px  /* Large desktop and up */
2xl: 1536px /* Extra large desktop and up */
```

### Mobile Adaptations
- Reduce padding: 24px → 16px
- Single column layouts below md breakpoint
- Larger touch targets (minimum 44px)
- Simplified navigation patterns
- Stack form elements vertically

## Common UI Patterns

### Three-Dot Menu Pattern
All ellipsis menus should follow this structure:
1. **View Details** - Primary action
2. **Edit [Item Name]** - Modification action
3. **Separator line**
4. **Delete [Item Name]** - Destructive action (red text)

```tsx
const ThreeDotMenu = ({ item, onView, onEdit, onDelete }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-48">
      <DropdownMenuItem onClick={onView}>
        <Eye className="mr-2 h-4 w-4" />
        View Details
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onEdit}>
        <Edit className="mr-2 h-4 w-4" />
        Edit {item.type}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem 
        onClick={onDelete}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete {item.type}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
```

### State Patterns

#### Empty States
```tsx
// Standard Empty State
const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="bg-muted/50 rounded-full p-6 mb-4">
      <Icon className="h-12 w-12 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
    {action}
  </div>
);

// Search Results Empty State
const SearchEmptyState = ({ searchTerm, onClearSearch }) => (
  <div className="text-center py-12">
    <div className="bg-muted/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
      <Search className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold mb-2">No results found</h3>
    <p className="text-muted-foreground mb-4">
      No results found for "{searchTerm}". Try adjusting your search terms.
    </p>
    <Button variant="outline" onClick={onClearSearch}>
      Clear search
    </Button>
  </div>
);

// First-time Empty State (with illustration)
const FirstTimeEmptyState = ({ title, description, primaryAction, secondaryAction }) => (
  <div className="text-center py-16">
    <div className="mb-6">
      {/* Illustration or large icon */}
      <div className="w-32 h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full mx-auto flex items-center justify-center">
        <CalendarDays className="h-16 w-16 text-primary" />
      </div>
    </div>
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-muted-foreground mb-8 max-w-md mx-auto">{description}</p>
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      {primaryAction}
      {secondaryAction}
    </div>
  </div>
);
```

#### Loading States
```tsx
// Page Loading Skeleton
const PageLoadingSkeleton = () => (
  <div className="container mx-auto px-6 py-8 max-w-7xl">
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className="h-8 bg-muted rounded-lg w-64 animate-pulse" />
        <div className="h-4 bg-muted rounded w-96 animate-pulse" />
      </div>
      
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 rounded-xl border bg-card">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-24 animate-pulse" />
              <div className="h-8 bg-muted rounded w-16 animate-pulse" />
              <div className="h-3 bg-muted rounded w-20 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Content Skeleton */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-6 rounded-xl border bg-card">
            <div className="space-y-3">
              <div className="h-5 bg-muted rounded w-48 animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Card Loading Skeleton
const CardSkeleton = () => (
  <div className="p-6 rounded-xl border bg-card">
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-5 bg-muted rounded w-32 animate-pulse" />
          <div className="h-4 bg-muted rounded w-24 animate-pulse" />
        </div>
        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
      </div>
    </div>
  </div>
);
```

#### Error States
```tsx
// Page Error State
const PageError = ({ title, description, onRetry, supportLink }) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-6 max-w-md">
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold mb-2">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        {supportLink && (
          <Button variant="outline" asChild>
            <a href={supportLink}>Contact Support</a>
          </Button>
        )}
      </div>
    </div>
  </div>
);

// Inline Error State
const InlineError = ({ message, onRetry }) => (
  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
    <div className="flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-destructive">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    </div>
  </div>
);
```

## Advanced Component Patterns

### Data Visualization Components

#### Stats Cards (Calendar/Dashboard Style)
```tsx
const StatsCard = ({ title, value, subtitle, icon: Icon, trend, trendValue }) => (
  <div className="group relative overflow-hidden p-6 rounded-2xl border border-border 
                   bg-gradient-to-br from-card to-card/80 backdrop-blur-xl shadow-sm 
                   hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent 
                     opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold mt-2 group-hover:text-primary transition-colors duration-300">{value}</p>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center mt-2 text-sm ${
            trend === 'up' ? 'text-success-green' : 
            trend === 'down' ? 'text-error-red' : 
            'text-muted-foreground'
          }`}>
            {trend === 'up' && <TrendingUp className="h-4 w-4 mr-1" />}
            {trend === 'down' && <TrendingDown className="h-4 w-4 mr-1" />}
            {trendValue}
          </div>
        )}
      </div>
      {Icon && (
        <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl 
                         shadow-sm group-hover:shadow-xl group-hover:scale-110 
                         transition-all duration-300">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      )}
    </div>
  </div>
);

// Compact Stats Card (for dashboard grids)
const CompactStatsCard = ({ label, value, change, changeType }) => (
  <div className="group relative overflow-hidden p-4 rounded-2xl border border-border 
                   bg-gradient-to-br from-card to-card/80 backdrop-blur-xl shadow-sm 
                   hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent 
                     opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative flex items-center justify-between">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-lg font-semibold group-hover:text-primary transition-colors duration-300">{value}</p>
      </div>
      {change && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full transition-all duration-300 ${
          changeType === 'positive' ? 'bg-success-green/10 text-success-green' :
          changeType === 'negative' ? 'bg-error-red/10 text-error-red' :
          'bg-muted text-muted-foreground'
        }`}>
          {change}
        </span>
      )}
    </div>
  </div>
);
```

#### Progress Tracking Components
```tsx
// Multi-step Progress (Registration/Setup Wizards)
const MultiStepProgress = ({ steps, currentStep }) => (
  <div className="flex items-center justify-between mb-8">
    {steps.map((step, index) => {
      const isActive = index === currentStep;
      const isCompleted = index < currentStep;
      const isLast = index === steps.length - 1;
      
      return (
        <div key={step.id} className="flex items-center flex-1">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              isCompleted ? 'bg-primary text-primary-foreground' :
              isActive ? 'bg-primary/10 text-primary border-2 border-primary' :
              'bg-muted text-muted-foreground'
            }`}>
              {isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              isActive ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {step.title}
            </span>
          </div>
          {!isLast && (
            <div className={`flex-1 h-0.5 mx-4 ${
              isCompleted ? 'bg-primary' : 'bg-muted'
            }`} />
          )}
        </div>
      );
    })}
  </div>
);

// Timeline Component (Activity Feed)
const Timeline = ({ items }) => (
  <div className="space-y-4">
    {items.map((item, index) => (
      <div key={item.id} className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            item.type === 'success' ? 'bg-success-green/10 text-success-green' :
            item.type === 'warning' ? 'bg-warning-orange/10 text-warning-orange' :
            item.type === 'error' ? 'bg-error-red/10 text-error-red' :
            'bg-primary/10 text-primary'
          }`}>
            <item.icon className="h-4 w-4" />
          </div>
          {index < items.length - 1 && (
            <div className="w-0.5 h-8 bg-border mt-2" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
            </div>
            <time className="text-xs text-muted-foreground">{item.timestamp}</time>
          </div>
        </div>
      </div>
    ))}
  </div>
);
```

### Search and Filter Components

#### Advanced Search Bar
```tsx
const AdvancedSearchBar = ({ 
  value, 
  onChange, 
  placeholder, 
  filters,
  onFilterChange,
  suggestions 
}) => (
  <div className="relative">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-12 h-11"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          onClick={() => onChange('')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
    
    {/* Filters Row */}
    {filters && filters.length > 0 && (
      <div className="flex items-center gap-2 mt-3">
        <span className="text-sm text-muted-foreground">Filters:</span>
        {filters.map((filter) => (
          <Badge
            key={filter.key}
            variant="secondary"
            className="cursor-pointer hover:bg-muted"
          >
            {filter.label}: {filter.value}
            <X 
              className="ml-1 h-3 w-3" 
              onClick={() => onFilterChange(filter.key, null)}
            />
          </Badge>
        ))}
      </div>
    )}
    
    {/* Search Suggestions */}
    {suggestions && suggestions.length > 0 && value && (
      <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-50">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="w-full px-3 py-2 text-left text-sm hover:bg-muted first:rounded-t-lg last:rounded-b-lg transition-colors"
            onClick={() => onChange(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    )}
  </div>
);
```

#### Filter Panel
```tsx
const FilterPanel = ({ filters, onFilterChange, onClearAll }) => (
  <div className="p-4 border rounded-lg bg-card">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-medium">Filters</h3>
      <Button variant="ghost" size="sm" onClick={onClearAll}>
        Clear all
      </Button>
    </div>
    
    <div className="space-y-4">
      {filters.map((filter) => (
        <div key={filter.key}>
          <label className="text-sm font-medium mb-2 block">{filter.label}</label>
          
          {filter.type === 'select' && (
            <Select value={filter.value} onValueChange={(value) => onFilterChange(filter.key, value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={filter.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {filter.type === 'checkbox' && (
            <div className="space-y-2">
              {filter.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox 
                    id={option.value}
                    checked={filter.value?.includes(option.value)}
                    onCheckedChange={(checked) => {
                      const currentValues = filter.value || [];
                      const newValues = checked 
                        ? [...currentValues, option.value]
                        : currentValues.filter(v => v !== option.value);
                      onFilterChange(filter.key, newValues);
                    }}
                  />
                  <label htmlFor={option.value} className="text-sm">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          )}
          
          {filter.type === 'range' && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Input 
                  type="number"
                  placeholder="Min"
                  value={filter.value?.min || ''}
                  onChange={(e) => onFilterChange(filter.key, { ...filter.value, min: e.target.value })}
                />
                <span className="text-muted-foreground">-</span>
                <Input 
                  type="number"
                  placeholder="Max"
                  value={filter.value?.max || ''}
                  onChange={(e) => onFilterChange(filter.key, { ...filter.value, max: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);
```

### View Toggle Components

#### List/Grid Toggle (Browse Shows Style)
```tsx
const ViewToggle = ({ view, onViewChange, options }) => (
  <div className="flex items-center bg-muted rounded-lg p-1">
    {options.map((option) => (
      <Button
        key={option.value}
        variant={view === option.value ? "default" : "ghost"}
        size="sm"
        className={`relative ${view === option.value ? 'bg-background shadow-sm' : ''}`}
        onClick={() => onViewChange(option.value)}
      >
        <option.icon className="h-4 w-4 mr-2" />
        {option.label}
      </Button>
    ))}
  </div>
);

// Common view options
const VIEW_OPTIONS = [
  { value: 'grid', label: 'Grid', icon: Grid3X3 },
  { value: 'list', label: 'List', icon: List },
  { value: 'calendar', label: 'Calendar', icon: Calendar }
];
```

### Bulk Action Components

#### Bulk Action Bar
```tsx
const BulkActionBar = ({ selectedCount, actions, onClearSelection }) => (
  <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium">
        {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
      </span>
      <Button variant="outline" size="sm" onClick={onClearSelection}>
        Clear selection
      </Button>
    </div>
    
    <div className="flex items-center gap-2">
      {actions.map((action) => (
        <Button
          key={action.key}
          variant={action.variant || "default"}
          size="sm"
          onClick={action.onClick}
          disabled={action.disabled}
        >
          {action.icon && <action.icon className="h-4 w-4 mr-2" />}
          {action.label}
        </Button>
      ))}
    </div>
  </div>
);
```

## Implementation Guidelines

### New Page Development Workflow

#### 1. Choose the Right Layout Template
```tsx
// Dashboard Page (Calendar, Secretary Dashboard)
<DashboardLayout 
  title="Dashboard" 
  actions={<Button>New Entry</Button>}
  stats={[<StatsCard />, <StatsCard />, ...]}
>
  {/* Dashboard content */}
</DashboardLayout>

// List/Browse Page (Browse Shows, My Entries)
<ListPageLayout 
  title="Browse Shows"
  searchBar={<AdvancedSearchBar />}
  filters={<FilterPanel />}
  viewControls={<ViewToggle />}
>
  {/* List content */}
</ListPageLayout>

// Detail Page (Show Details, Dog Profile)
<EntityDetailLayout
  title="Show Details"
  subtitle="AKC Conformation Show"
  headerActions={<Button>Edit Show</Button>}
  breadcrumbs={<Breadcrumbs />}
  sidebar={<Sidebar />}
>
  {/* Detail content */}
</EntityDetailLayout>

// Standard Page (Forms, Settings)
<StandardPageLayout title="Settings" subtitle="Manage your preferences">
  {/* Standard content */}
</StandardPageLayout>
```

#### 2. New Page Checklist
- [ ] **Choose correct layout template** based on page type
- [ ] **Apply consistent spacing** with 8px grid system
- [ ] **Use semantic color system** for status and actions
- [ ] **Implement proper typography hierarchy** (h1 → text-3xl, h2 → text-xl)
- [ ] **Add hover effects and transitions** using Apple easing
- [ ] **Ensure responsive design** across all breakpoints
- [ ] **Follow three-dot menu pattern** for item actions
- [ ] **Include comprehensive state handling**:
  - [ ] Loading states (skeleton loaders)
  - [ ] Empty states (first-time and search)
  - [ ] Error states (page and inline errors)
- [ ] **Test in both light and dark themes**
- [ ] **Add proper animations** using Framer Motion variants
- [ ] **Implement accessibility** (ARIA labels, keyboard navigation)

#### 3. Page Template Examples

**Dashboard Page Template:**
```tsx
export default function DashboardPage() {
  return (
    <DashboardLayout
      title="Dashboard"
      actions={
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-primary/20 text-primary 
                                            hover:bg-primary/5 hover:border-primary/40 
                                            hover:-translate-y-0.5 transition-all duration-300 
                                            shadow-sm rounded-full">
            Export
          </Button>
          <Button className="bg-gradient-to-r from-primary to-secondary 
                           text-primary-foreground hover:shadow-xl 
                           hover:-translate-y-1 hover:scale-[1.02] 
                           transition-all duration-300 shadow-sm">
            New Entry
          </Button>
        </div>
      }
      stats={[
        <StatsCard title="Total Shows" value="24" trend="up" trendValue="+12%" />,
        <StatsCard title="Upcoming Events" value="8" />,
        <StatsCard title="Entries" value="156" trend="up" trendValue="+23%" />,
        <StatsCard title="Success Rate" value="89%" />
      ]}
    >
      <div className="grid gap-8">
        <Card className="group relative overflow-hidden bg-gradient-to-br from-card to-card/80 
                         border border-border rounded-2xl shadow-sm backdrop-blur-xl 
                         transition-all duration-500 hover:shadow-xl hover:-translate-y-2">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent 
                           opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="relative">
            <CardTitle className="group-hover:text-primary transition-colors duration-300">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <Timeline items={recentActivity} />
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden bg-gradient-to-br from-card to-card/80 
                         border border-border rounded-2xl shadow-sm backdrop-blur-xl 
                         transition-all duration-500 hover:shadow-xl hover:-translate-y-2">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent 
                           opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="relative">
            <CardTitle className="group-hover:text-primary transition-colors duration-300">
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {/* Event list */}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

**List Page Template:**
```tsx
export default function BrowseShowsPage() {
  const [view, setView] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState([]);

  return (
    <ListPageLayout
      title="Browse Shows"
      searchBar={
        <AdvancedSearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search shows..."
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      }
      filters={<FilterPanel filters={availableFilters} onFilterChange={handleFilterChange} />}
      viewControls={<ViewToggle view={view} onViewChange={setView} options={VIEW_OPTIONS} />}
    >
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : shows.length === 0 ? (
        searchTerm ? (
          <SearchEmptyState searchTerm={searchTerm} onClearSearch={() => setSearchTerm('')} />
        ) : (
          <FirstTimeEmptyState
            title="No shows yet"
            description="Start by creating your first show or browsing available events."
            primaryAction={<Button>Create Show</Button>}
            secondaryAction={<Button variant="outline">Learn More</Button>}
          />
        )
      ) : (
        <div className={view === 'grid' ? 
          'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 
          'space-y-4'
        }>
          {shows.map(show => (
            <ShowCard key={show.id} show={show} view={view} />
          ))}
        </div>
      )}
    </ListPageLayout>
  );
}
```

#### 4. Component Selection Guide

**Use StatsCard when:**
- Displaying key metrics or KPIs
- Dashboard overview cards
- Progress indicators with numbers

**Use Timeline when:**
- Activity feeds
- Progress tracking
- Event history

**Use AdvancedSearchBar when:**
- Complex search with filters
- Auto-suggestions needed
- Filter badges display

**Use FilterPanel when:**
- Multiple filter types
- Advanced filtering options
- Persistent filter state

**Use ViewToggle when:**
- Multiple view modes (grid/list/calendar)
- User preference storage
- Different data representations

#### 5. Design Validation Process

**Before finalizing any page design:**
1. **Border prominence check**: Compare against Data Lifecycle page - borders should be subtle, not competing with content
2. **Animation scope review**: Ensure container and child animations don't conflict or overwhelm
3. **Information hierarchy validation**: Critical status information should appear before configuration options
4. **Visual consistency audit**: All content sections should use consistent border and background treatments
5. **Cross-page comparison**: New pages should feel cohesive with existing high-quality implementations

**Red flags to avoid:**
- Borders that are visually "too prominent" compared to reference pages
- Multiple overlapping hover animations in the same area
- Configuration options appearing before system status information
- Inconsistent border treatments across sections on the same page

### Component Development
1. Start with ShadCN UI base components
2. Apply Apple-inspired styling modifications
3. Use CSS custom properties for theming
4. Implement consistent hover and focus states
5. Add proper TypeScript types
6. Include accessibility attributes
7. Test responsive behavior

### Code Standards
```tsx
// Good: Consistent class ordering
<div className="flex items-center justify-between p-6 bg-card 
                border border-border/50 rounded-xl shadow-sm
                hover:shadow-md transition-all duration-300">

// Good: Semantic class names
<Button className="bg-gradient-primary text-white hover:shadow-lg">

// Good: Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

## Implementation Workflow

### Pre-Development Checklist
1. **Requirements Analysis**
   - [ ] Identify page type (Dashboard/List/Detail/Standard)
   - [ ] List required data states (loading/empty/error)
   - [ ] Define user interactions and flows
   - [ ] Map responsive breakpoint needs

2. **Design Planning**
   - [ ] Review [page-templates.md](./page-templates.md) for template selection
   - [ ] Check [design-tokens.json](./design-tokens.json) for available tokens
   - [ ] Identify reusable components vs. custom implementations
   - [ ] Plan accessibility requirements

### Development Workflow
1. **Setup Phase**
   ```bash
   # Ensure design system dependencies
   npm install @radix-ui/react-* lucide-react framer-motion
   ```

2. **Component Development**
   ```tsx
   // 1. Import design system components
   import { Button } from '@/components/ui/button';
   import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
   
   // 2. Use design tokens
   const MyComponent = () => (
     <Card className="bg-card border-border/50 rounded-xl p-6">
       <CardHeader>
         <CardTitle className="text-xl font-semibold">Title</CardTitle>
       </CardHeader>
       <CardContent>
         <Button className="bg-gradient-to-r from-primary to-secondary">
           Action
         </Button>
       </CardContent>
     </Card>
   );
   ```

3. **Quality Assurance**
   ```bash
   # Run type checking
   npm run build
   
   # Run linting
   npm run lint
   
   # Test responsiveness
   # - Check mobile (375px)
   # - Check tablet (768px) 
   # - Check desktop (1024px+)
   
   # Accessibility testing
   # - Tab navigation
   # - Screen reader compatibility
   # - Color contrast validation
   ```

### Post-Development Validation
- [ ] Passes TypeScript compilation
- [ ] Follows established patterns from this guide
- [ ] Responsive across all breakpoints
- [ ] Accessible (WCAG 2.1 AA compliant)
- [ ] Performance optimized (lazy loading, etc.)
- [ ] Dark mode compatible
- [ ] Consistent with existing pages

### Maintenance Guidelines
1. **Regular Updates**
   - Review design tokens quarterly
   - Update component patterns based on user feedback
   - Sync with Apple HIG updates

2. **Documentation**
   - Update this guide when adding new patterns
   - Document custom components in Storybook
   - Maintain component usage examples

3. **Performance Monitoring**
   - Track page load times
   - Monitor bundle size impact
   - Optimize heavy components

## Troubleshooting Guide

### Common Issues and Solutions

#### TypeScript Errors
```bash
# Missing type definitions
npm install @types/react @types/react-dom

# Conflicting imports
# Check that all UI components are imported from @/components/ui/
```

#### Styling Issues
```tsx
// Wrong: Hardcoded colors
<div className="bg-blue-500 text-white">

// Right: Using design tokens
<div className="bg-primary text-primary-foreground">

// Wrong: Inconsistent spacing
<div className="p-3 m-5">

// Right: 8px grid system
<div className="p-6 mb-8">
```

#### Responsive Problems
```tsx
// Wrong: Desktop-first approach
<div className="grid-cols-3 md:grid-cols-1">

// Right: Mobile-first approach
<div className="grid-cols-1 md:grid-cols-3">

// Wrong: Fixed heights on mobile
<div className="h-96">

// Right: Flexible heights
<div className="min-h-96 md:h-96">
```

#### Accessibility Issues
```tsx
// Wrong: Missing semantic structure
<div onClick={handleClick}>Button</div>

// Right: Proper semantic elements
<Button onClick={handleClick}>Button</Button>

// Wrong: Missing labels
<Input placeholder="Email" />

// Right: Explicit labels
<Label htmlFor="email">Email</Label>
<Input id="email" />
```

### Performance Optimization
```tsx
// Lazy load heavy components
const HeavyChart = lazy(() => import('./HeavyChart'));

// Memoize expensive calculations
const memoizedValue = useMemo(() => expensiveCalculation(data), [data]);

// Optimize re-renders
const MemoizedComponent = memo(Component);

// Use React Query for data fetching
const { data, isLoading, error } = useQuery(['key'], fetchData);
```

This design system ensures consistency across the MyK9Show application while maintaining the clean, modern aesthetic inspired by Apple's design principles. All new pages and components should reference this guide to maintain visual harmony throughout the application.