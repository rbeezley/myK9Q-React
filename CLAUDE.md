# MyK9Q React - Dog Show Scoring Application

## Project Overview

This is a React-based dog show scoring application designed to integrate with the main myK9Show platform. The app provides mobile-first scoring interfaces for judges and secretaries during live dog show events.

## Key Project Context

### Purpose
- **Primary Goal**: Create mobile-optimized scoring interfaces for dog show trials
- **Integration Target**: Will eventually integrate into the main myK9Show Flutter application
- **Users**: Judges, secretaries, and show officials using phones/tablets during live events
- **Environment**: Used in real-time during outdoor dog show trials

### Technology Stack
- **Framework**: React 18 with TypeScript and Vite
- **State Management**: Zustand for scoring, entry, timer, and offline queue stores  
- **Database**: Supabase with view-based queries
- **UI Library**: ShadCN UI components with Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router with entry-specific parameters

## Critical Design Requirements

### Must Follow MyK9Show Design System
**Location**: `/docs/style-guides/` contains comprehensive design system documentation:
- `design-system.md` - Complete Apple-inspired component patterns
- `design-tokens.json` - Color palettes, typography, spacing, animation tokens
- `page-templates.md` - Layout templates and responsive patterns

### Apple-Inspired Aesthetic
- **Primary Colors**: #007AFF (blue) to #5856D6 (purple) gradients
- **Typography**: Apple system font stack with specific weights (590, 650, 700)
- **Cards**: Premium styling with `border border-border`, `backdrop-blur-xl`, subtle shadows
- **Animations**: Apple easing curves `cubic-bezier(0.25, 0.46, 0.45, 0.94)`

### Mobile-First Requirements
- **Touch Targets**: Minimum 44px for thumb-friendly operation
- **One-Handed Use**: Large central buttons easily reachable with thumb
- **Responsive Design**: Must work perfectly on phones during outdoor trials
- **Performance**: Fast loading and offline capability for poor network conditions

## Scoring System Architecture

### 4-Tier Scoresheet Selection
Organization → Activity Type → Trial Type → Competition Type
- Each combination routes to specific scoresheet components
- Organization-specific scoresheets: UKC, AKC, ASCA with distinct scoring rules

### Current Scoresheets
- **UKC Obedience**: Multi-exercise scoring with timers
- **AKC Scent Work**: Area-based search timing with element/level configurations
- **Additional**: ASCA, Rally, and other organization scoresheets

### Key Features
- **Dynamic Area Configuration**: Based on element/level combinations (AKC Scent Work)
- **Timer Integration**: Stopwatch functionality with auto-population of time fields
- **Offline Capability**: Queue system for scoring without internet connection
- **Entry Management**: Navigation through class entries with proper identification

## Current Known Issues

### Recent Development Context
The AKC Scent Work scoresheet was recently redesigned for mobile compactness but the result was visually poor. Key issues:
- **Design Consistency**: Not following myK9Show's Apple-inspired patterns
- **Mobile UX**: Poor touch targets and layout for one-handed phone use
- **Visual Hierarchy**: Inadequate armband prominence and information organization
- **Color Scheme**: Using wrong colors that don't match myK9Show design system

### User Feedback Priorities
1. **Armband Prominence**: Must be large and clearly visible (primary dog identification)
2. **Mobile Optimization**: Everything on one screen, no scrolling required
3. **Apple-Inspired Design**: Must match myK9Show's established visual language
4. **Functional UX**: Thumb-friendly controls, logical information flow

## Available Sub-Agents

### UI Designer Agent
**Location**: `.claude/agents/ui-designer`
- Understands myK9Show's Apple-inspired design patterns
- Can implement proper card styling, typography, and color schemes
- References design-tokens.json and design-system.md correctly

### UX Researcher Agent  
**Location**: `.claude/agents/ux-researcher`
- Evaluates mobile usability and touch-friendly patterns
- Validates user flows against established UX conventions
- Ensures one-handed mobile operation during trials

### Usage Guidance
- **Always consult** these agents for design decisions
- **Reference them** before implementing new components
- **Use them** to validate mobile usability and visual consistency

## Development Workflow

### For New Components
1. **Consult UX researcher** for user flow and mobile requirements
2. **Work with UI designer** to ensure design system compliance
3. **Reference style guides** in `/docs/style-guides/` for implementation details
4. **Test on mobile devices** for real-world trial usage

### For Design Issues
1. **Use UI designer agent** to evaluate against myK9Show design standards
2. **Apply design tokens** from design-tokens.json
3. **Follow page templates** from page-templates.md
4. **Validate with UX researcher** for mobile usability

## Integration Goals

### myK9Show Compatibility
- **Design Consistency**: Must look and feel like part of myK9Show
- **Component Reusability**: Create components that can be integrated into Flutter app
- **User Experience**: Seamless transition between React scoring and Flutter app features
- **Data Flow**: Compatible with myK9Show's existing data structures and APIs

### Success Criteria
- Judges can score efficiently on mobile devices during live trials
- Visual design is indistinguishable from myK9Show's quality standards
- Touch interactions are optimized for one-handed operation
- Performance is excellent even with poor network connectivity
- Components can be easily integrated into the main myK9Show application

## Current Priority

The immediate focus is fixing the AKC Scent Work scoresheet to properly follow myK9Show's design system and provide excellent mobile UX for trial scoring. This serves as the foundation for implementing other organization-specific scoresheets with consistent quality.