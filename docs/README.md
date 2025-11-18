# myK9Q Documentation

Complete documentation for the myK9Q React application.

## 📁 Documentation Structure

### [push-notifications/](push-notifications/) ⭐ NEW
Complete push notification system implementation and production readiness.
- **Start here**: [PUSH_NOTIFICATION_COMPLETE.md](push-notifications/PUSH_NOTIFICATION_COMPLETE.md)
- Production status, testing, security fixes
- Browser compatibility, retry system
- PWA notifications, rate limiting

### [performance/](performance/)
Performance optimization documentation and monitoring.
- Critical path optimizations
- Metrics and dashboards
- Home page optimizations
- Performance phases implementation

### [implementation-phases/](implementation-phases/)
Historical phase-by-phase implementation summaries.
- Phase 1-9 completion summaries
- EntryList refactoring
- Settings implementation
- Feature rollout documentation

### [migrations/](migrations/)
Database migration plans and guides.
- Migration planning and testing
- Notification triggers
- Feedback changes

### [architecture/](architecture/)
System architecture and design decisions.
- Prefetching implementation
- Sequential prefetch
- Refactoring plans
- Design patterns

### [features/](features/)
Feature-specific implementation guides.
- Haptic feedback
- User experience enhancements

### [accessibility/](accessibility/)
Accessibility audits and improvements.
- Touch target audits
- WCAG compliance

### [guides/](guides/)
How-to guides and tutorials.
- Flutter auto-login
- Developer guides

### [testing/](testing/)
Testing documentation and status.
- Test status reports
- Theme testing
- Component testing

### [mockups/](mockups/)
HTML mockups and prototypes.
- Placement ribbon mockup
- UI component prototypes

## 🚀 Quick Start for New Developers

1. **Project Overview**: Read [../README.md](../README.md) in project root
2. **Claude Instructions**: [CLAUDE.md](CLAUDE.md) - AI coding guidelines
3. **Database Reference**: [DATABASE_REFERENCE.md](DATABASE_REFERENCE.md) - Complete schema
4. **CSS Architecture**: [CSS-IMPROVEMENT-ROADMAP.md](CSS-IMPROVEMENT-ROADMAP.md) - Design system
5. **Security Audit**: [SECURITY_AUDIT_2025-11-17.md](SECURITY_AUDIT_2025-11-17.md) - Latest security fixes

## 📋 Core Documentation

**Essential References:**
- [CLAUDE.md](CLAUDE.md) - Claude Code AI instructions & project guidelines
- [DATABASE_REFERENCE.md](DATABASE_REFERENCE.md) - Complete database schema (23 tables, 4 views, 43 functions)
- [CSS-IMPROVEMENT-ROADMAP.md](CSS-IMPROVEMENT-ROADMAP.md) - Design system consolidation roadmap
- [DESIGN_SYSTEM_REMEDIATION.md](DESIGN_SYSTEM_REMEDIATION.md) - Recent design system fixes
- [CUSTOMER_PITCH.md](CUSTOMER_PITCH.md) - Marketing & product positioning

**Recent Work:**
- [SECURITY_AUDIT_2025-11-17.md](SECURITY_AUDIT_2025-11-17.md) - RLS policies, function security, performance optimization
- [SECURITY_DEFINER_VIEWS.md](SECURITY_DEFINER_VIEWS.md) - Database view security documentation

## 🗂️ Root Directory Files

Only ONE file remains in project root:
- `README.md` - Main project documentation

All other documentation is organized in this `docs/` folder for cleaner navigation.

## 📊 Database Documentation

- [database-schema.md](database-schema.md) - Complete schema reference
- [database-relationships-diagram.md](database-relationships-diagram.md) - Visual relationships
- [DATABASE_ERD.md](DATABASE_ERD.md) - Entity relationship diagram
- [database-setup.md](database-setup.md) - Setup instructions
- [DATABASE_CLEANUP_COMPLETE.md](DATABASE_CLEANUP_COMPLETE.md) - Cleanup history

## 🎨 Design System

- [design-system-components.md](design-system-components.md) - Component library
- [CSS_ARCHITECTURE.md](CSS_ARCHITECTURE.md) - CSS patterns
- [COMPONENT_TESTING.md](COMPONENT_TESTING.md) - Testing matrix

## 🔗 External Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

## 📝 Contributing

When adding new documentation:
1. Choose the appropriate subfolder
2. Use clear, descriptive filenames
3. Add a summary to this README
4. Update relevant index files
5. Keep active work docs in project root only when necessary
