/**
 * CompactShowInfoCard Component
 *
 * Condensed view of show information with quick-access contact buttons.
 * Expandable to full details or links to existing detailed cards.
 */

import { MapPin, Phone, Mail, ChevronRight, Calendar, User } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { Show } from '@/services/replication';
import './CompactShowInfoCard.css';

// ============================================================
// TYPES
// ============================================================

interface CompactShowInfoCardProps {
  show: Show;
  onViewMore?: () => void;
}

interface ContactInfo {
  name: string;
  email?: string;
  phone?: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Extract secretary info from show
 */
function getSecretaryInfo(show: Show): ContactInfo | null {
  const name = show.secretary_name || show.show_secretary_name;
  if (!name) return null;

  return {
    name,
    email: show.secretary_email || show.show_secretary_email,
    phone: show.secretary_phone || show.show_secretary_phone,
  };
}

/**
 * Format date range for display
 */
function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate) return '';

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : start;

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };

  if (start.getTime() === end.getTime()) {
    return start.toLocaleDateString('en-US', { ...options, year: 'numeric' });
  }

  // Same month
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.getDate()}, ${end.getFullYear()}`;
  }

  // Different months
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`;
}

/**
 * Format venue for display (city, state)
 */
function formatVenue(show: Show): string {
  const parts: string[] = [];

  if (show.site_name) parts.push(show.site_name);
  if (show.site_city && show.site_state) {
    parts.push(`${show.site_city}, ${show.site_state}`);
  } else if (show.site_city) {
    parts.push(show.site_city);
  } else if (show.site_state) {
    parts.push(show.site_state);
  }

  return parts.join(' • ') || 'Location TBD';
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Quick action button for contact
 */
function ContactButton({
  icon: Icon,
  label,
  href,
  onClick,
}: {
  icon: typeof Phone;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const hapticFeedback = useHapticFeedback();

  const handleClick = (e: React.MouseEvent) => {
    hapticFeedback.light();
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  if (href) {
    return (
      <a
        className="compact-show__contact-btn"
        href={href}
        onClick={handleClick}
        aria-label={label}
      >
        <Icon size={16} />
      </a>
    );
  }

  return (
    <button
      className="compact-show__contact-btn compact-show__contact-btn--disabled"
      disabled
      aria-label={`${label} not available`}
    >
      <Icon size={16} />
    </button>
  );
}

/**
 * Main CompactShowInfoCard component
 */
export function CompactShowInfoCard({ show, onViewMore }: CompactShowInfoCardProps) {
  const hapticFeedback = useHapticFeedback();
  const secretary = getSecretaryInfo(show);
  const dateRange = formatDateRange(show.start_date, show.end_date);
  const venue = formatVenue(show);

  const handleViewMore = () => {
    hapticFeedback.light();
    if (onViewMore) {
      onViewMore();
    }
  };

  return (
    <div className="compact-show-card">
      <div className="compact-show-card__header">
        <div className="compact-show-card__title">
          <MapPin size={18} className="compact-show-card__icon" />
          <span>Show Info</span>
        </div>
        {onViewMore && (
          <button
            className="compact-show-card__view-more"
            onClick={handleViewMore}
          >
            View All
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      <div className="compact-show-card__content">
        {/* Date row */}
        {dateRange && (
          <div className="compact-show__row">
            <Calendar size={14} className="compact-show__row-icon" />
            <span className="compact-show__row-text">{dateRange}</span>
          </div>
        )}

        {/* Venue row */}
        <div className="compact-show__row">
          <MapPin size={14} className="compact-show__row-icon" />
          <span className="compact-show__row-text">{venue}</span>
        </div>

        {/* Secretary row with contact buttons */}
        {secretary && (
          <div className="compact-show__row compact-show__row--contact">
            <User size={14} className="compact-show__row-icon" />
            <div className="compact-show__contact-info">
              <span className="compact-show__contact-label">Secretary:</span>
              <span className="compact-show__contact-name">{secretary.name}</span>
            </div>
            <div className="compact-show__contact-buttons">
              <ContactButton
                icon={Mail}
                label={`Email ${secretary.name}`}
                href={secretary.email ? `mailto:${secretary.email}` : undefined}
              />
              <ContactButton
                icon={Phone}
                label={`Call ${secretary.name}`}
                href={secretary.phone ? `tel:${secretary.phone}` : undefined}
              />
            </div>
          </div>
        )}

        {/* Club name if available */}
        {show.club_name && (
          <div className="compact-show__row compact-show__row--club">
            <span className="compact-show__club">{show.club_name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default CompactShowInfoCard;
