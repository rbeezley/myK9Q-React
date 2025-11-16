/**
 * Status Badge Component Template
 *
 * Standard status badge pattern used throughout myK9Q.
 * Use this template when creating status indicators.
 *
 * Features:
 * - Color-coded status with icon
 * - Text label for accessibility
 * - Inline or standalone display
 * - Compact size (12px font)
 * - Supports all status types
 */

import React from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  PlayCircle,
  Flag,
} from 'lucide-react';

type StatusType =
  | 'checked-in'
  | 'at-gate'
  | 'in-ring'
  | 'done'
  | 'pulled'
  | 'conflict'
  | 'setup'
  | 'briefing'
  | 'in-progress'
  | 'completed'
  | 'qualified'
  | 'nq'
  | 'absent';

interface StatusBadgeProps {
  /** The type of status to display */
  status: StatusType;

  /** Optional custom label (defaults to status-based label) */
  label?: string;

  /** Show icon with text (default: true) */
  showIcon?: boolean;

  /** Inline display (smaller, minimal padding) */
  inline?: boolean;

  /** Additional CSS class */
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  showIcon = true,
  inline = false,
  className = '',
}) => {
  // Map status to icon, color class, and default label
  const getStatusConfig = () => {
    switch (status) {
      // Entry statuses
      case 'checked-in':
        return {
          icon: CheckCircle,
          label: 'Checked In',
          className: 'status-badge--checked-in',
        };
      case 'at-gate':
        return {
          icon: Clock,
          label: 'At Gate',
          className: 'status-badge--at-gate',
        };
      case 'in-ring':
        return {
          icon: PlayCircle,
          label: 'In Ring',
          className: 'status-badge--in-ring',
        };
      case 'done':
        return {
          icon: Flag,
          label: 'Done',
          className: 'status-badge--done',
        };
      case 'pulled':
        return {
          icon: XCircle,
          label: 'Pulled',
          className: 'status-badge--pulled',
        };
      case 'conflict':
        return {
          icon: AlertCircle,
          label: 'Conflict',
          className: 'status-badge--conflict',
        };

      // Class statuses
      case 'setup':
        return {
          icon: Clock,
          label: 'Setup',
          className: 'status-badge--setup',
        };
      case 'briefing':
        return {
          icon: AlertCircle,
          label: 'Briefing',
          className: 'status-badge--briefing',
        };
      case 'in-progress':
        return {
          icon: PlayCircle,
          label: 'In Progress',
          className: 'status-badge--in-progress',
        };
      case 'completed':
        return {
          icon: CheckCircle,
          label: 'Completed',
          className: 'status-badge--completed',
        };

      // Result statuses
      case 'qualified':
        return {
          icon: CheckCircle,
          label: 'Q',
          className: 'status-badge--qualified',
        };
      case 'nq':
        return {
          icon: XCircle,
          label: 'NQ',
          className: 'status-badge--nq',
        };
      case 'absent':
        return {
          icon: Clock,
          label: 'Absent',
          className: 'status-badge--absent',
        };

      default:
        return {
          icon: AlertCircle,
          label: 'Unknown',
          className: 'status-badge--unknown',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const displayLabel = label || config.label;

  return (
    <div
      className={`status-badge ${config.className} ${
        inline ? 'status-badge--inline' : ''
      } ${className}`}
    >
      {showIcon && (
        <Icon
          className="status-badge-icon"
          size={inline ? 12 : 14}
          aria-hidden="true"
        />
      )}
      <span className="status-badge-label">{displayLabel}</span>
    </div>
  );
};

/**
 * Required CSS (add to your component's CSS file):
 *
 * ```css
 * .status-badge {
 *   display: inline-flex;
 *   align-items: center;
 *   gap: var(--token-space-xs);
 *   padding: var(--token-space-sm) var(--token-space-lg);
 *   border-radius: var(--token-radius-lg);
 *   font-size: var(--token-font-sm);
 *   font-weight: var(--token-font-weight-semibold);
 *   white-space: nowrap;
 * }
 *
 * .status-badge--inline {
 *   padding: var(--token-space-xs) var(--token-space-sm);
 *   font-size: var(--token-font-xs);
 *   gap: var(--token-space-xs);
 * }
 *
 * .status-badge-icon {
 *   flex-shrink: 0;
 * }
 *
 * .status-badge-label {
 *   line-height: 1;
 * }
 *
 * /* Entry Status Colors */
 * .status-badge--checked-in {
 *   background: var(--status-checked-in);
 *   color: var(--status-checked-in-text);
 * }
 *
 * .status-badge--at-gate {
 *   background: var(--status-at-gate);
 *   color: var(--status-at-gate-text);
 * }
 *
 * .status-badge--in-ring {
 *   background: var(--status-in-ring);
 *   color: var(--status-in-ring-text);
 * }
 *
 * .status-badge--done {
 *   background: var(--status-completed);
 *   color: var(--status-completed-text);
 * }
 *
 * .status-badge--pulled {
 *   background: var(--status-pulled);
 *   color: var(--status-pulled-text);
 * }
 *
 * .status-badge--conflict {
 *   background: var(--status-conflict);
 *   color: var(--status-conflict-text);
 * }
 *
 * /* Class Status Colors */
 * .status-badge--setup {
 *   background: var(--status-setup);
 *   color: var(--status-setup-text);
 * }
 *
 * .status-badge--briefing {
 *   background: var(--status-briefing);
 *   color: var(--status-briefing-text);
 * }
 *
 * .status-badge--in-progress {
 *   background: var(--status-in-progress);
 *   color: var(--status-in-progress-text);
 * }
 *
 * .status-badge--completed {
 *   background: var(--status-completed);
 *   color: var(--status-completed-text);
 * }
 *
 * /* Result Status Colors */
 * .status-badge--qualified {
 *   background: var(--token-result-qualified);
 *   color: var(--token-result-qualified-text);
 * }
 *
 * .status-badge--nq {
 *   background: var(--token-result-nq);
 *   color: var(--token-result-nq-text);
 * }
 *
 * .status-badge--absent {
 *   background: var(--token-result-absent);
 *   color: var(--token-result-absent-text);
 * }
 *
 * /* Unknown status */
 * .status-badge--unknown {
 *   background: var(--muted);
 *   color: var(--foreground);
 * }
 * ```
 */

/**
 * Usage Examples:
 *
 * ```tsx
 * import { StatusBadge } from '@/components/StatusBadge';
 *
 * // Entry status
 * <StatusBadge status="checked-in" />
 *
 * // Class status
 * <StatusBadge status="in-progress" />
 *
 * // Result status
 * <StatusBadge status="qualified" />
 *
 * // Custom label
 * <StatusBadge status="qualified" label="Qualified - 1st Place" />
 *
 * // Icon only (no text)
 * <StatusBadge status="checked-in" label="" />
 *
 * // Text only (no icon)
 * <StatusBadge status="checked-in" showIcon={false} />
 *
 * // Inline (smaller, minimal padding)
 * <StatusBadge status="nq" inline />
 * ```
 */

/**
 * Accessibility Notes:
 *
 * - Icon is decorative (aria-hidden="true")
 * - Text label provides context for screen readers
 * - Color is NOT the only indicator (icon + text)
 * - Contrast ratios meet WCAG AA standards
 */

/**
 * Customization Guide:
 *
 * 1. Add new status types to StatusType union
 * 2. Add corresponding case in getStatusConfig()
 * 3. Add CSS class with appropriate background/color
 * 4. Ensure design token usage (--status-* variables)
 * 5. Test in light and dark themes
 *
 * Example:
 * ```tsx
 * type StatusType = 'checked-in' | 'custom-status';
 *
 * case 'custom-status':
 *   return {
 *     icon: Star,
 *     label: 'Custom',
 *     className: 'status-badge--custom',
 *   };
 * ```
 *
 * CSS:
 * ```css
 * .status-badge--custom {
 *   background: var(--status-custom);
 *   color: var(--status-custom-text);
 * }
 * ```
 */

/**
 * Testing Checklist:
 *
 * - [ ] All status types render correctly
 * - [ ] Icons display at correct size
 * - [ ] Text labels are readable
 * - [ ] Inline variant is smaller
 * - [ ] Custom labels work
 * - [ ] Icon-only mode works
 * - [ ] Text-only mode works
 * - [ ] Light theme colors correct
 * - [ ] Dark theme colors correct
 * - [ ] Contrast ratios meet WCAG AA
 * - [ ] Screen readers announce status
 */
