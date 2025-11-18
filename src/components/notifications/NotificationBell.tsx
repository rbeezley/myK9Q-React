import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import './NotificationBell.css';

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const { unreadCount, togglePanel } = useNotifications();

  return (
    <button
      onClick={togglePanel}
      className={`notification-bell ${className}`}
      title={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      aria-label={`Open notifications ${unreadCount > 0 ? `- ${unreadCount} unread` : ''}`}
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="notification-bell-badge">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};
