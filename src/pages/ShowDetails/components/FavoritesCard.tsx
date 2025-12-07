/**
 * FavoritesCard Component
 *
 * Displays favorited dogs with their queue status.
 * Shows empty state with prompt to favorite dogs if none exist.
 *
 * Responsive: Compact on mobile, expanded on desktop.
 */

import { useNavigate } from 'react-router-dom';
import { Heart, ChevronRight, CircleDot, Clock } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { FavoriteEntry } from '../hooks/useDashboardData';
import './FavoritesCard.css';

// ============================================================
// TYPES
// ============================================================

interface FavoritesCardProps {
  entries: FavoriteEntry[];
  licenseKey?: string;
  trialId?: string;
  maxItems?: number;
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Individual favorite dog row
 */
function FavoriteRow({
  entry,
  onClick,
}: {
  entry: FavoriteEntry;
  onClick: () => void;
}) {
  const getStatusIndicator = () => {
    if (entry.isInRing) {
      return (
        <span className="favorites-row__status favorites-row__status--in-ring">
          <CircleDot size={12} />
          In ring
        </span>
      );
    }
    if (entry.isPending && entry.queuePosition !== null) {
      return (
        <span className="favorites-row__status favorites-row__status--queued">
          <Clock size={12} />
          {entry.queuePosition} ahead
        </span>
      );
    }
    if (entry.isPending) {
      return (
        <span className="favorites-row__status favorites-row__status--pending">
          <Clock size={12} />
          Pending
        </span>
      );
    }
    return (
      <span className="favorites-row__status favorites-row__status--done">
        Done for today
      </span>
    );
  };

  return (
    <button
      className="favorites-row"
      onClick={onClick}
      aria-label={`${entry.dogName}, ${entry.nextClass || 'no pending classes'}`}
    >
      <div className="favorites-row__info">
        <span className="favorites-row__name">{entry.dogName}</span>
        {entry.nextClass && (
          <span className="favorites-row__class">{entry.nextClass}</span>
        )}
      </div>
      <div className="favorites-row__queue">
        {getStatusIndicator()}
        <ChevronRight size={16} className="favorites-row__chevron" />
      </div>
    </button>
  );
}

/**
 * Empty state when no dogs are favorited
 */
function EmptyState({ onViewAll }: { onViewAll: () => void }) {
  return (
    <div className="favorites-card__empty">
      <Heart size={32} className="favorites-card__empty-icon" />
      <p>Favorite your dogs to track them here</p>
      <button className="favorites-card__empty-action" onClick={onViewAll}>
        Go to Home
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

/**
 * Main FavoritesCard component
 */
export function FavoritesCard({
  entries,
  licenseKey: _licenseKey,
  trialId,
  maxItems = 5,
}: FavoritesCardProps) {
  const navigate = useNavigate();
  const hapticFeedback = useHapticFeedback();

  const handleEntryClick = (entry: FavoriteEntry) => {
    hapticFeedback.light();
    // Navigate to Dog Details page
    if (trialId) {
      navigate(`/trial/${trialId}/dog/${entry.armband}`);
    }
  };

  const handleViewAll = () => {
    hapticFeedback.light();
    navigate('/home');
  };

  // Show only first N entries, filter out any invalid entries
  const displayedEntries = entries
    .filter(entry => entry && entry.dogName)
    .slice(0, maxItems);
  const hasMore = entries.length > maxItems;


  return (
    <div className="favorites-card">
      <div className="favorites-card__header">
        <div className="favorites-card__title">
          <Heart size={18} className="favorites-card__icon" />
          <span>My Favorites</span>
          {entries.length > 0 && (
            <span className="favorites-card__count">{entries.length}</span>
          )}
        </div>
        {entries.length > 0 && (
          <button
            className="favorites-card__view-all"
            onClick={handleViewAll}
          >
            View All
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      <div className="favorites-card__content">
        {entries.length === 0 ? (
          <EmptyState onViewAll={handleViewAll} />
        ) : (
          <>
            <div className="favorites-card__list">
              {displayedEntries.map((entry, index) => (
                <FavoriteRow
                  key={entry.armband ?? `fav-${index}`}
                  entry={entry}
                  onClick={() => handleEntryClick(entry)}
                />
              ))}
            </div>
            {hasMore && (
              <button
                className="favorites-card__more"
                onClick={handleViewAll}
              >
                +{entries.length - maxItems} more favorites
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default FavoritesCard;
