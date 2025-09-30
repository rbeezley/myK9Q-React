import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight } from 'lucide-react';
import { useAnnouncementStore } from '../../stores/announcementStore';
import { useHapticFeedback } from '../../utils/hapticFeedback';
import './HeaderTicker.css';

export const HeaderTicker: React.FC = () => {
  const navigate = useNavigate();
  const hapticFeedback = useHapticFeedback();
  const { announcements } = useAnnouncementStore();

  // Filter announcements to only show those less than 4 hours old
  const recentAnnouncements = announcements.filter(announcement => {
    const now = new Date();
    const created = new Date(announcement.created_at);
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    return diffHours < 4;
  });

  // Don't render if no recent announcements
  if (recentAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="header-ticker-container">
      <div
        className="header-ticker-background"
        onClick={() => {
          hapticFeedback.impact('light');
          navigate('/announcements');
        }}
      >
        <Bell className="header-ticker-icon" />
        <div className="header-ticker-content">
          <div className="header-ticker-scroll">
            {/* Create seamless loop with just 2 copies */}
            {[...Array(2)].flatMap((_, cycle) =>
              recentAnnouncements.map((announcement, index) => {
                const icon = announcement.priority === 'urgent' ? '🚨' : announcement.priority === 'high' ? '⚠️' : 'ℹ️';
                const timeAgo = (() => {
                  const now = new Date();
                  const created = new Date(announcement.created_at);
                  const diffMs = now.getTime() - created.getTime();
                  const diffMins = Math.floor(diffMs / (1000 * 60));

                  if (diffMins < 60) return `${diffMins}m ago`;
                  const diffHours = Math.floor(diffMins / 60);
                  if (diffHours < 24) return `${diffHours}h ago`;
                  const diffDays = Math.floor(diffHours / 24);
                  return `${diffDays}d ago`;
                })();

                return (
                  <span key={`${announcement.id}-cycle${cycle}-${index}`} className="header-ticker-item">
                    {icon} {announcement.title} <span className="header-ticker-time">({timeAgo})</span>
                    <span className="header-ticker-separator"> • </span>
                  </span>
                );
              })
            )}
          </div>
        </div>
        <ChevronRight size={14} className="header-ticker-arrow" />
      </div>
    </div>
  );
};