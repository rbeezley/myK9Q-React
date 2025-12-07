/**
 * AnnouncementsCard Component
 *
 * Displays recent announcements with unread indicators.
 * Tapping an announcement navigates to the full announcements page.
 *
 * Shows empty state if no announcements exist.
 */

import { useNavigate } from 'react-router-dom';
import { Megaphone, ChevronRight, Bell, BellDot } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { Announcement } from '@/stores/announcementStore';
import './AnnouncementsCard.css';

// ============================================================
// TYPES
// ============================================================

interface AnnouncementsCardProps {
  announcements: Announcement[];
  unreadCount: number;
  licenseKey?: string;
  maxItems?: number;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Format relative time for announcement
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get priority badge info
 */
function getPriorityInfo(priority: string): { label: string; className: string } | null {
  switch (priority) {
    case 'urgent':
      return { label: 'Urgent', className: 'priority--urgent' };
    case 'high':
      return { label: 'Important', className: 'priority--high' };
    default:
      return null;
  }
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Individual announcement row
 */
function AnnouncementRow({
  announcement,
  onClick,
}: {
  announcement: Announcement;
  onClick: () => void;
}) {
  const priorityInfo = getPriorityInfo(announcement.priority);
  const isUnread = !announcement.is_read;

  return (
    <button
      className={`announcement-row ${isUnread ? 'announcement-row--unread' : ''}`}
      onClick={onClick}
      aria-label={`${isUnread ? 'Unread: ' : ''}${announcement.title}`}
    >
      <div className="announcement-row__indicator">
        {isUnread ? (
          <span className="announcement-row__dot" />
        ) : null}
      </div>
      <div className="announcement-row__content">
        <div className="announcement-row__header">
          <span className="announcement-row__title">{announcement.title}</span>
          {priorityInfo && (
            <span className={`announcement-row__priority ${priorityInfo.className}`}>
              {priorityInfo.label}
            </span>
          )}
        </div>
        <span className="announcement-row__time">
          {formatRelativeTime(announcement.created_at)}
        </span>
      </div>
      <ChevronRight size={16} className="announcement-row__chevron" />
    </button>
  );
}

/**
 * Empty state when no announcements exist
 */
function EmptyState() {
  return (
    <div className="announcements-card__empty">
      <Bell size={32} className="announcements-card__empty-icon" />
      <p>No announcements yet</p>
      <span className="announcements-card__empty-hint">
        Check back later for show updates
      </span>
    </div>
  );
}

/**
 * Main AnnouncementsCard component
 */
export function AnnouncementsCard({
  announcements,
  unreadCount,
  licenseKey: _licenseKey,
  maxItems = 3,
}: AnnouncementsCardProps) {
  const navigate = useNavigate();
  const hapticFeedback = useHapticFeedback();

  const handleAnnouncementClick = (_announcement: Announcement) => {
    hapticFeedback.light();
    // Navigate to announcements page (could add anchor/highlight in future)
    navigate('/announcements');
  };

  const handleViewAll = () => {
    hapticFeedback.light();
    navigate('/announcements');
  };

  // Show only first N announcements, filter out any invalid
  const displayedAnnouncements = announcements
    .filter(a => a && a.title)
    .slice(0, maxItems);
  const hasMore = announcements.length > maxItems;


  // Determine icon based on unread state
  const HeaderIcon = unreadCount > 0 ? BellDot : Megaphone;

  return (
    <div className="announcements-card">
      <div className="announcements-card__header">
        <div className="announcements-card__title">
          <HeaderIcon
            size={18}
            className={`announcements-card__icon ${unreadCount > 0 ? 'announcements-card__icon--unread' : ''}`}
          />
          <span>Announcements</span>
          {unreadCount > 0 && (
            <span className="announcements-card__unread-badge">{unreadCount}</span>
          )}
        </div>
        {announcements.length > 0 && (
          <button
            className="announcements-card__view-all"
            onClick={handleViewAll}
          >
            View All
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      <div className="announcements-card__content">
        {announcements.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="announcements-card__list">
              {displayedAnnouncements.map(announcement => (
                <AnnouncementRow
                  key={announcement.id}
                  announcement={announcement}
                  onClick={() => handleAnnouncementClick(announcement)}
                />
              ))}
            </div>
            {hasMore && (
              <button
                className="announcements-card__more"
                onClick={handleViewAll}
              >
                +{announcements.length - maxItems} more announcements
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AnnouncementsCard;
