/**
 * StatsRow Component
 *
 * Displays 4 key metrics in a horizontal row:
 * - Unread announcements
 * - Favorite dogs with pending entries
 * - Active classes (in-progress)
 * - Completion percentage
 *
 * Each stat is tappable and navigates to the relevant page.
 */

import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Heart, Clock, BarChart3 } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { DashboardStats } from '../hooks/useDashboardData';
import './StatsRow.css';

// ============================================================
// TYPES
// ============================================================

export type StatType = 'announcements' | 'favorites' | 'active' | 'progress';

interface StatBoxProps {
  icon: ReactNode;
  value: number | string;
  unit?: string;
  label: string;
  onClick: () => void;
  highlight?: boolean;
  'aria-label'?: string;
}

interface StatsRowProps {
  stats: DashboardStats;
  licenseKey?: string;
  trialId?: string;
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Individual stat box
 */
function StatBox({ icon, value, unit, label, onClick, highlight, 'aria-label': ariaLabel }: StatBoxProps) {
  return (
    <button
      className={`stat-box ${highlight ? 'stat-box--highlight' : ''}`}
      onClick={onClick}
      aria-label={ariaLabel || `${value} ${unit || ''} ${label}`.trim()}
    >
      <div className="stat-box__icon">{icon}</div>
      <div className="stat-box__value">
        {value}
        {unit && <span className="stat-box__unit">{unit}</span>}
      </div>
      <div className="stat-box__label">{label}</div>
    </button>
  );
}

/**
 * Stats row showing 4 key metrics
 */
export function StatsRow({ stats, licenseKey: _licenseKey, trialId }: StatsRowProps) {
  const navigate = useNavigate();
  const hapticFeedback = useHapticFeedback();

  const handleStatClick = (stat: StatType) => {
    hapticFeedback.light();

    switch (stat) {
      case 'announcements':
        navigate('/announcements');
        break;
      case 'favorites':
        // Navigate to Home with favorites filter pre-selected
        navigate('/home', { state: { filter: 'favorites' } });
        break;
      case 'active':
        // Navigate to ClassList
        if (trialId) {
          navigate(`/trial/${trialId}/classes`);
        }
        break;
      case 'progress':
        // Navigate to ClassList with completed filter pre-selected
        if (trialId) {
          navigate(`/trial/${trialId}/classes`, { state: { filter: 'completed' } });
        }
        break;
    }
  };

  return (
    <div className="stats-row" role="group" aria-label="Show statistics">
      <StatBox
        icon={<Bell size={20} />}
        value={stats.unreadAnnouncements}
        unit="msgs"
        label="unread"
        onClick={() => handleStatClick('announcements')}
        highlight={stats.unreadAnnouncements > 0}
        aria-label={`${stats.unreadAnnouncements} unread messages`}
      />
      <StatBox
        icon={<Heart size={20} />}
        value={stats.favoritesPending}
        unit="dogs"
        label="favorites"
        onClick={() => handleStatClick('favorites')}
        aria-label={`${stats.favoritesPending} favorite dogs with pending entries`}
      />
      <StatBox
        icon={<Clock size={20} />}
        value={stats.activeClasses}
        unit="classes"
        label="in progress"
        onClick={() => handleStatClick('active')}
        highlight={stats.activeClasses > 0}
        aria-label={`${stats.activeClasses} classes in progress`}
      />
      <StatBox
        icon={<BarChart3 size={20} />}
        value={`${stats.completionPercent}%`}
        unit="classes"
        label="complete"
        onClick={() => handleStatClick('progress')}
        aria-label={`${stats.completionPercent}% of classes completed`}
      />
    </div>
  );
}

export default StatsRow;
