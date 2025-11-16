/**
 * Page Layout Component Template
 *
 * Standard page structure used throughout myK9Q.
 * Use this template when creating new pages.
 *
 * Features:
 * - Consistent header with title and actions
 * - Proper semantic HTML (main, header, section)
 * - Horizontal alignment (12px mobile, 24px desktop)
 * - Responsive layout
 * - Empty state support
 * - Loading state support
 */

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageLayoutProps {
  /** Page title */
  title: string;

  /** Optional subtitle/description */
  subtitle?: string;

  /** Show back button (default: false) */
  showBackButton?: boolean;

  /** Custom back handler (defaults to navigate(-1)) */
  onBack?: () => void;

  /** Action buttons in header (top right) */
  headerActions?: React.ReactNode;

  /** Page content */
  children: React.ReactNode;

  /** Show loading state */
  loading?: boolean;

  /** Show empty state (no data) */
  empty?: boolean;

  /** Custom empty state message */
  emptyMessage?: string;

  /** Additional CSS class */
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBack,
  headerActions,
  children,
  loading = false,
  empty = false,
  emptyMessage = 'No data available',
  className = '',
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <main className={`page-layout ${className}`}>
      {/* Page Header */}
      <header className="page-header">
        <div className="page-header-content">
          {showBackButton && (
            <button
              className="page-back-button"
              onClick={handleBack}
              aria-label="Go back"
            >
              <ChevronLeft className="page-back-icon" />
            </button>
          )}

          <div className="page-header-text">
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>

          {headerActions && (
            <div className="page-header-actions">{headerActions}</div>
          )}
        </div>
      </header>

      {/* Page Content */}
      <section className="page-content">
        {loading ? (
          <div className="page-loading">
            <div className="loading-spinner" />
            <p className="loading-text">Loading...</p>
          </div>
        ) : empty ? (
          <div className="page-empty">
            <p className="empty-message">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </section>
    </main>
  );
};

/**
 * Required CSS (add to your page CSS file):
 *
 * ```css
 * /* Page Layout */
 * .page-layout {
 *   display: flex;
 *   flex-direction: column;
 *   min-height: 100vh;
 *   background: var(--background);
 * }
 *
 * /* Page Header */
 * .page-header {
 *   background: var(--background);
 *   border-bottom: 1px solid var(--border);
 *   padding: var(--token-space-lg);
 *   flex-shrink: 0;
 * }
 *
 * @media (min-width: 1024px) {
 *   .page-header {
 *     padding: var(--token-space-3xl);
 *   }
 * }
 *
 * .page-header-content {
 *   display: flex;
 *   align-items: center;
 *   gap: var(--token-space-lg);
 * }
 *
 * /* Back Button */
 * .page-back-button {
 *   width: var(--min-touch-target);
 *   height: var(--min-touch-target);
 *   display: flex;
 *   align-items: center;
 *   justify-content: center;
 *   background: var(--muted);
 *   border: 1px solid var(--border);
 *   border-radius: var(--token-radius-md);
 *   color: var(--foreground);
 *   cursor: pointer;
 *   transition: var(--token-transition-normal);
 *   flex-shrink: 0;
 * }
 *
 * .page-back-button:hover {
 *   background: var(--border);
 *   transform: var(--token-hover-scale-sm);
 * }
 *
 * .page-back-button:focus-visible {
 *   outline: 2px solid var(--primary);
 *   outline-offset: 2px;
 * }
 *
 * .page-back-icon {
 *   width: var(--token-space-2xl);
 *   height: var(--token-space-2xl);
 * }
 *
 * /* Header Text */
 * .page-header-text {
 *   flex: 1;
 *   min-width: 0;
 * }
 *
 * .page-title {
 *   margin: 0;
 *   font-size: var(--token-font-2xl);
 *   font-weight: var(--token-font-weight-semibold);
 *   color: var(--foreground);
 *   line-height: 1.2;
 * }
 *
 * @media (min-width: 1024px) {
 *   .page-title {
 *     font-size: var(--token-font-3xl);
 *   }
 * }
 *
 * .page-subtitle {
 *   margin: var(--token-space-xs) 0 0 0;
 *   font-size: var(--token-font-md);
 *   color: var(--token-text-secondary);
 *   line-height: 1.4;
 * }
 *
 * @media (min-width: 1024px) {
 *   .page-subtitle {
 *     font-size: var(--token-font-lg);
 *   }
 * }
 *
 * /* Header Actions */
 * .page-header-actions {
 *   display: flex;
 *   gap: var(--token-space-md);
 *   flex-shrink: 0;
 * }
 *
 * /* Page Content */
 * .page-content {
 *   flex: 1;
 *   padding: var(--token-space-lg);
 *   overflow-y: auto;
 * }
 *
 * @media (min-width: 1024px) {
 *   .page-content {
 *     padding: var(--token-space-3xl);
 *   }
 * }
 *
 * /* Loading State */
 * .page-loading {
 *   display: flex;
 *   flex-direction: column;
 *   align-items: center;
 *   justify-content: center;
 *   min-height: 400px;
 *   gap: var(--token-space-lg);
 * }
 *
 * .loading-spinner {
 *   width: var(--token-space-4xl);
 *   height: var(--token-space-4xl);
 *   border: 3px solid var(--muted);
 *   border-top-color: var(--primary);
 *   border-radius: var(--token-radius-full);
 *   animation: spin 1s linear infinite;
 * }
 *
 * @keyframes spin {
 *   to { transform: rotate(360deg); }
 * }
 *
 * .loading-text {
 *   margin: 0;
 *   font-size: var(--token-font-md);
 *   color: var(--token-text-secondary);
 * }
 *
 * /* Empty State */
 * .page-empty {
 *   display: flex;
 *   flex-direction: column;
 *   align-items: center;
 *   justify-content: center;
 *   min-height: 400px;
 *   padding: var(--token-space-2xl);
 * }
 *
 * .empty-message {
 *   margin: 0;
 *   font-size: var(--token-font-lg);
 *   color: var(--token-text-secondary);
 *   text-align: center;
 * }
 *
 * /* Accessibility */
 * @media (prefers-reduced-motion: reduce) {
 *   .loading-spinner {
 *     animation: none;
 *     border-top-color: var(--muted);
 *   }
 *
 *   .page-back-button:hover {
 *     transform: none;
 *   }
 * }
 * ```
 */

/**
 * Usage Examples:
 *
 * ```tsx
 * import { PageLayout } from '@/components/PageLayout';
 *
 * // Basic page
 * function MyPage() {
 *   return (
 *     <PageLayout title="My Page">
 *       <div>Page content here</div>
 *     </PageLayout>
 *   );
 * }
 *
 * // Page with subtitle
 * <PageLayout
 *   title="Classes"
 *   subtitle="Manage your trial classes"
 * >
 *   <ClassList />
 * </PageLayout>
 *
 * // Page with back button
 * <PageLayout
 *   title="Class Details"
 *   showBackButton
 * >
 *   <ClassDetails />
 * </PageLayout>
 *
 * // Page with header actions
 * <PageLayout
 *   title="Entries"
 *   headerActions={
 *     <>
 *       <button onClick={handleAdd}>Add Entry</button>
 *       <button onClick={handleFilter}>Filter</button>
 *     </>
 *   }
 * >
 *   <EntryList />
 * </PageLayout>
 *
 * // Page with loading state
 * <PageLayout
 *   title="Loading Data"
 *   loading={isLoading}
 * >
 *   <div>This won't show while loading</div>
 * </PageLayout>
 *
 * // Page with empty state
 * <PageLayout
 *   title="No Entries"
 *   empty={entries.length === 0}
 *   emptyMessage="No entries found. Add your first entry to get started."
 * >
 *   <EntryList entries={entries} />
 * </PageLayout>
 *
 * // Custom back handler
 * <PageLayout
 *   title="Settings"
 *   showBackButton
 *   onBack={() => navigate('/home')}
 * >
 *   <Settings />
 * </PageLayout>
 * ```
 */

/**
 * Responsive Behavior:
 *
 * Mobile (< 1024px):
 * - Header padding: 12px
 * - Content padding: 12px
 * - Title: 20px
 * - Subtitle: 14px
 *
 * Desktop (1024px+):
 * - Header padding: 24px
 * - Content padding: 24px
 * - Title: 24px
 * - Subtitle: 16px
 */

/**
 * Accessibility Notes:
 *
 * - Uses semantic HTML (<main>, <header>, <section>)
 * - Heading hierarchy starts with <h1>
 * - Back button has aria-label
 * - Loading state is visible (not just spinner)
 * - Empty state provides context
 * - Focus indicators on interactive elements
 * - Reduced motion support for animations
 */

/**
 * Customization Guide:
 *
 * 1. Add custom header content:
 * ```tsx
 * <PageLayout
 *   title="Custom"
 *   headerActions={
 *     <div className="custom-header-content">
 *       {/* Custom elements */}
 *     </div>
 *   }
 * >
 *   {/* content */}
 * </PageLayout>
 * ```
 *
 * 2. Add custom empty state:
 * ```tsx
 * {empty ? (
 *   <div className="custom-empty-state">
 *     <Icon />
 *     <h3>No Data</h3>
 *     <p>Custom message</p>
 *     <button>Action</button>
 *   </div>
 * ) : (
 *   children
 * )}
 * ```
 *
 * 3. Add tabs/filters in header:
 * ```tsx
 * <PageLayout
 *   title="Entries"
 *   headerActions={
 *     <div className="tabs">
 *       <button>All</button>
 *       <button>Checked In</button>
 *       <button>Done</button>
 *     </div>
 *   }
 * >
 *   {/* content */}
 * </PageLayout>
 * ```
 */

/**
 * Testing Checklist:
 *
 * - [ ] Title displays correctly
 * - [ ] Subtitle displays (if provided)
 * - [ ] Back button appears (if enabled)
 * - [ ] Back button navigates correctly
 * - [ ] Header actions display correctly
 * - [ ] Content renders correctly
 * - [ ] Loading state shows spinner
 * - [ ] Empty state shows message
 * - [ ] Responsive at all breakpoints
 * - [ ] Header padding: 12px mobile, 24px desktop
 * - [ ] Content padding: 12px mobile, 24px desktop
 * - [ ] Title size: 20px mobile, 24px desktop
 * - [ ] Works in light theme
 * - [ ] Works in dark theme
 * - [ ] Back button is keyboard accessible
 * - [ ] Focus indicators visible
 * - [ ] Reduced motion works
 */
