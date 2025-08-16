# myK9Q - Mobile Scoring Application

## Overview
myK9Q is the mobile companion app to myK9Show, designed specifically for judges to score dog show competitions at ringside. This documentation serves as the blueprint for converting the existing Flutter scoring app to React Native while maintaining integration with myK9Show.

## Documentation Status
⚠️ **Note**: These documents are initial specifications based on myK9Show's architecture and best practices for scoring interfaces. They will be updated after reviewing the existing Flutter app to:
- Preserve valuable UI/UX patterns from the Flutter version
- Maintain familiar workflows that judges already know
- Incorporate Flutter app's proven features
- Address any specific requirements discovered

## Current Documentation
- `myK9Q-development-plan.md` - Overall project plan with progress tracking
- `scoring-interface-spec.md` - Detailed UI/UX specifications (to be refined)
- `api-integration.md` - Backend integration guide (in progress)
- `shared-components.md` - Reusable component library (pending)

## Next Steps
1. **Review Flutter App** - Analyze existing scoring workflows and features
2. **Update Specifications** - Refine documents based on Flutter app insights
3. **Preserve Best Features** - Ensure valuable Flutter features are retained
4. **Begin Implementation** - Start with proven patterns from Flutter app

## Integration with myK9Show
The myK9Q app will share:
- Database schema (Supabase)
- Authentication system
- Business logic and validation rules
- Scoring algorithms
- UI/UX patterns (adapted for mobile)

## Folder Structure
```
/docs/myK9Q/
├── README.md (this file)
├── myK9Q-development-plan.md
├── scoring-interface-spec.md
├── api-integration.md (in progress)
├── shared-components.md (pending)
└── ui-components/
    └── (component specifications)
```

## How to Use This Documentation
1. Start with `myK9Q-development-plan.md` for the overall roadmap
2. Reference `scoring-interface-spec.md` for UI implementation details
3. Use checkbox tracking in the development plan to monitor progress
4. Update documents as you learn from the Flutter app analysis

## Important Notes
- These specifications prioritize consistency between web and mobile
- The Flutter app's existing workflows should guide final implementation
- All changes should maintain backward compatibility with myK9Show
- Offline capability is a critical requirement

Last Updated: 2025-08-12