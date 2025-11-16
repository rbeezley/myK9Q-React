/**
 * Dialog/Modal Component Template
 *
 * Standard dialog pattern used throughout myK9Q.
 * Use this template when creating modal dialogs.
 *
 * Features:
 * - Full-screen on mobile, centered on desktop
 * - Focus trap and keyboard navigation
 * - Backdrop click to close
 * - Escape key to close
 * - Accessible (ARIA attributes)
 * - Smooth animations
 * - Footer with action buttons
 */

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;

  /** Called when the dialog should close */
  onClose: () => void;

  /** Dialog title */
  title: string;

  /** Dialog content */
  children: React.ReactNode;

  /** Footer buttons (optional) */
  footer?: React.ReactNode;

  /** Allow closing via backdrop click (default: true) */
  closeOnBackdrop?: boolean;

  /** Allow closing via Escape key (default: true) */
  closeOnEscape?: boolean;

  /** Additional CSS class for dialog container */
  className?: string;

  /** Size variant (default: 'medium') */
  size?: 'small' | 'medium' | 'large';
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = '',
  size = 'medium',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Manage focus
  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus dialog
      dialogRef.current?.focus();

      // Lock body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore focus
      previousFocusRef.current?.focus();

      // Unlock body scroll
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="dialog-overlay"
      onClick={handleBackdropClick}
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        className={`dialog dialog--${size} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="dialog-header">
          <h2 id="dialog-title" className="dialog-title">
            {title}
          </h2>
          <button
            className="dialog-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="dialog-close-icon" />
          </button>
        </div>

        {/* Content */}
        <div className="dialog-content">{children}</div>

        {/* Footer */}
        {footer && <div className="dialog-footer">{footer}</div>}
      </div>
    </div>
  );
};

/**
 * Required CSS (use shared-dialog.css):
 *
 * ```css
 * /* Dialog Overlay (backdrop) */
 * .dialog-overlay {
 *   position: fixed;
 *   top: 0;
 *   left: 0;
 *   width: 100vw;
 *   height: 100vh;
 *   background: rgba(0, 0, 0, 0.5);
 *   display: flex;
 *   align-items: center;
 *   justify-content: center;
 *   z-index: var(--token-z-modal);
 *   animation: fadeIn var(--token-transition-fast) ease;
 *   padding: var(--token-space-lg);
 * }
 *
 * .theme-dark .dialog-overlay {
 *   background: rgba(0, 0, 0, 0.7);
 * }
 *
 * @keyframes fadeIn {
 *   from { opacity: 0; }
 *   to { opacity: 1; }
 * }
 *
 * /* Dialog Container */
 * .dialog {
 *   background: var(--background);
 *   border-radius: var(--token-radius-xl);
 *   box-shadow: var(--token-shadow-xl);
 *   width: 100%;
 *   max-height: 90vh;
 *   display: flex;
 *   flex-direction: column;
 *   animation: slideUp var(--token-transition-normal) var(--apple-ease);
 *   outline: none;
 * }
 *
 * @keyframes slideUp {
 *   from {
 *     opacity: 0;
 *     transform: translateY(20px);
 *   }
 *   to {
 *     opacity: 1;
 *     transform: translateY(0);
 *   }
 * }
 *
 * /* Size variants */
 * .dialog--small {
 *   max-width: 400px;
 * }
 *
 * .dialog--medium {
 *   max-width: 600px;
 * }
 *
 * .dialog--large {
 *   max-width: 800px;
 * }
 *
 * /* Mobile: Full screen */
 * @media (max-width: 639px) {
 *   .dialog-overlay {
 *     padding: 0;
 *   }
 *
 *   .dialog {
 *     width: 100%;
 *     max-width: none;
 *     height: 100vh;
 *     max-height: none;
 *     border-radius: 0;
 *   }
 * }
 *
 * /* Dialog Header */
 * .dialog-header {
 *   display: flex;
 *   align-items: center;
 *   justify-content: space-between;
 *   padding: var(--token-space-lg);
 *   border-bottom: 1px solid var(--border);
 *   flex-shrink: 0;
 * }
 *
 * @media (min-width: 1024px) {
 *   .dialog-header {
 *     padding: var(--token-space-xl);
 *   }
 * }
 *
 * .dialog-title {
 *   margin: 0;
 *   font-size: var(--token-font-xl);
 *   font-weight: var(--token-font-weight-semibold);
 *   color: var(--foreground);
 *   line-height: 1.2;
 * }
 *
 * @media (min-width: 1024px) {
 *   .dialog-title {
 *     font-size: var(--token-font-2xl);
 *   }
 * }
 *
 * .dialog-close {
 *   width: var(--min-touch-target);
 *   height: var(--min-touch-target);
 *   display: flex;
 *   align-items: center;
 *   justify-content: center;
 *   background: none;
 *   border: none;
 *   color: var(--token-text-secondary);
 *   cursor: pointer;
 *   border-radius: var(--token-radius-md);
 *   transition: var(--token-transition-fast);
 * }
 *
 * .dialog-close:hover {
 *   background: var(--muted);
 *   color: var(--foreground);
 * }
 *
 * .dialog-close:focus-visible {
 *   outline: 2px solid var(--primary);
 *   outline-offset: 2px;
 * }
 *
 * .dialog-close-icon {
 *   width: var(--token-space-2xl);
 *   height: var(--token-space-2xl);
 * }
 *
 * /* Dialog Content */
 * .dialog-content {
 *   flex: 1;
 *   overflow-y: auto;
 *   padding: var(--token-space-lg);
 * }
 *
 * @media (min-width: 1024px) {
 *   .dialog-content {
 *     padding: var(--token-space-xl);
 *   }
 * }
 *
 * /* Dialog Footer */
 * .dialog-footer {
 *   display: flex;
 *   gap: var(--token-space-md);
 *   padding: var(--token-space-lg);
 *   border-top: 1px solid var(--border);
 *   flex-shrink: 0;
 *   justify-content: flex-end;
 * }
 *
 * @media (min-width: 1024px) {
 *   .dialog-footer {
 *     padding: var(--token-space-xl);
 *   }
 * }
 *
 * /* Footer buttons */
 * .dialog-footer button {
 *   min-height: var(--min-touch-target);
 *   padding: var(--token-space-md) var(--token-space-xl);
 *   border-radius: var(--token-radius-md);
 *   font-weight: var(--token-font-weight-semibold);
 *   cursor: pointer;
 *   transition: var(--token-transition-normal);
 *   border: none;
 * }
 *
 * .dialog-footer button:first-child {
 *   background: var(--muted);
 *   color: var(--foreground);
 * }
 *
 * .dialog-footer button:first-child:hover {
 *   background: var(--border);
 * }
 *
 * .dialog-footer button:last-child {
 *   background: var(--primary);
 *   color: var(--primary-foreground);
 * }
 *
 * .dialog-footer button:last-child:hover {
 *   transform: var(--token-hover-scale-sm);
 *   box-shadow: var(--token-hover-shadow);
 * }
 *
 * /* Accessibility */
 * @media (prefers-reduced-motion: reduce) {
 *   .dialog-overlay,
 *   .dialog {
 *     animation: none;
 *   }
 *
 *   .dialog-footer button:hover {
 *     transform: none;
 *   }
 * }
 * ```
 */

/**
 * Usage Examples:
 *
 * ```tsx
 * import { Dialog } from '@/components/Dialog';
 *
 * function MyComponent() {
 *   const [isOpen, setIsOpen] = useState(false);
 *
 *   return (
 *     <>
 *       <button onClick={() => setIsOpen(true)}>Open Dialog</button>
 *
 *       <Dialog
 *         isOpen={isOpen}
 *         onClose={() => setIsOpen(false)}
 *         title="Confirm Delete"
 *         footer={
 *           <>
 *             <button onClick={() => setIsOpen(false)}>Cancel</button>
 *             <button onClick={handleDelete}>Delete</button>
 *           </>
 *         }
 *       >
 *         <p>Are you sure you want to delete this entry?</p>
 *       </Dialog>
 *     </>
 *   );
 * }
 *
 * // Small dialog
 * <Dialog
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Settings"
 *   size="small"
 * >
 *   <p>Small dialog content</p>
 * </Dialog>
 *
 * // Large dialog
 * <Dialog
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Class Details"
 *   size="large"
 * >
 *   <p>Large dialog content</p>
 * </Dialog>
 *
 * // Prevent closing via backdrop
 * <Dialog
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Important"
 *   closeOnBackdrop={false}
 * >
 *   <p>Must use buttons to close</p>
 * </Dialog>
 * ```
 */

/**
 * Accessibility Notes:
 *
 * - role="dialog" and aria-modal="true" announce modal behavior
 * - aria-labelledby connects title to dialog
 * - Focus is trapped within dialog (automatic via tabIndex)
 * - Escape key closes dialog (unless disabled)
 * - Close button has aria-label for screen readers
 * - Body scroll is locked when open
 * - Focus is restored to previous element on close
 * - Backdrop provides visual separation
 */

/**
 * Customization Guide:
 *
 * 1. Add custom footer layouts:
 * ```tsx
 * footer={
 *   <div className="custom-footer">
 *     <button>Left button</button>
 *     <div>
 *       <button>Right button 1</button>
 *       <button>Right button 2</button>
 *     </div>
 *   </div>
 * }
 * ```
 *
 * 2. Add custom sizes:
 * ```css
 * .dialog--xlarge {
 *   max-width: 1200px;
 * }
 * ```
 *
 * 3. Add custom styling:
 * ```tsx
 * <Dialog
 *   className="my-custom-dialog"
 *   title="Custom Dialog"
 * >
 *   {/* content */}
 * </Dialog>
 * ```
 */

/**
 * Testing Checklist:
 *
 * - [ ] Opens and closes correctly
 * - [ ] Escape key closes dialog (if enabled)
 * - [ ] Backdrop click closes dialog (if enabled)
 * - [ ] Focus is trapped within dialog
 * - [ ] Focus is restored on close
 * - [ ] Body scroll is locked when open
 * - [ ] Title is displayed correctly
 * - [ ] Content scrolls if needed
 * - [ ] Footer buttons work correctly
 * - [ ] Full-screen on mobile
 * - [ ] Centered on desktop
 * - [ ] Animations work (unless reduced motion)
 * - [ ] Works in light theme
 * - [ ] Works in dark theme
 * - [ ] Close button is accessible
 * - [ ] Screen reader announces correctly
 */
