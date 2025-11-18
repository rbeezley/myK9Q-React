import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Bell,
  CheckCircle,
  Trash2,
  AlertCircle,
  AlertTriangle,
  Dog,
  ExternalLink
} from 'lucide-react';
import './NotificationCenter.css';

export const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isPanelOpen,
    closePanel,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id);
    if (notification.url) {
      navigate(notification.url);
      closePanel();
    }
  };

  const getIcon = (notification: typeof notifications[0]) => {
    if (notification.type === 'dog-alert') {
      return <Dog className="notif-icon dog-icon" />;
    }

    switch (notification.priority) {
      case 'urgent':
        return <AlertCircle className="notif-icon urgent-icon" />;
      case 'high':
        return <AlertTriangle className="notif-icon high-icon" />;
      default:
        return <Bell className="notif-icon normal-icon" />;
    }
  };

  const getPriorityEmoji = (notification: typeof notifications[0]) => {
    if (notification.type === 'dog-alert') return '🐕';
    switch (notification.priority) {
      case 'urgent':
        return '🚨';
      case 'high':
        return '⚠️';
      default:
        return '📢';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return time.toLocaleDateString();
  };

  if (!isPanelOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="notif-panel-backdrop"
        onClick={closePanel}
        aria-hidden="true"
      />

      {/* Slide-out Panel */}
      <aside
        className="notif-panel"
        role="complementary"
        aria-label="Notification Center"
      >
        {/* Header */}
        <div className="notif-panel-header">
          <div className="notif-panel-title">
            <Bell size={24} />
            <h2>Notifications</h2>
            {unreadCount > 0 && (
              <span className="notif-unread-badge">{unreadCount}</span>
            )}
          </div>
          <button
            onClick={closePanel}
            className="notif-close-btn"
            aria-label="Close notification center"
          >
            <X size={24} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="notif-filter-tabs">
          <button
            onClick={() => setFilter('all')}
            className={`notif-filter-tab ${filter === 'all' ? 'active' : ''}`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`notif-filter-tab ${filter === 'unread' ? 'active' : ''}`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="notif-panel-actions">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="notif-action-btn">
                <CheckCircle size={16} />
                Mark all read
              </button>
            )}
            <button onClick={clearAll} className="notif-action-btn danger">
              <Trash2 size={16} />
              Clear all
            </button>
          </div>
        )}

        {/* Notification List */}
        <div className="notif-panel-content">
          {filteredNotifications.length === 0 ? (
            <div className="notif-empty-state">
              <Bell className="notif-empty-icon" />
              <h3>No notifications</h3>
              <p>
                {filter === 'unread'
                  ? "You're all caught up!"
                  : 'New notifications will appear here'}
              </p>
            </div>
          ) : (
            <div className="notif-list">
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notif-item ${!notification.isRead ? 'notif-item-unread' : ''} notif-item-${notification.priority}`}
                >
                  {/* Icon */}
                  <div className="notif-item-icon">
                    {getIcon(notification)}
                  </div>

                  {/* Content */}
                  <div
                    className="notif-item-content"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notif-item-header">
                      <span className="notif-item-emoji">{getPriorityEmoji(notification)}</span>
                      <h4 className="notif-item-title">{notification.title}</h4>
                    </div>
                    <p className="notif-item-message">{notification.content}</p>
                    <div className="notif-item-meta">
                      <span className="notif-item-time">{formatTimeAgo(notification.timestamp)}</span>
                      {notification.showName && (
                        <>
                          <span className="notif-item-divider">•</span>
                          <span className="notif-item-show">{notification.showName}</span>
                        </>
                      )}
                      {notification.url && (
                        <>
                          <span className="notif-item-divider">•</span>
                          <ExternalLink size={12} className="notif-item-link-icon" />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="notif-item-actions">
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="notif-item-action-btn"
                        title="Mark as read"
                        aria-label="Mark as read"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      className="notif-item-action-btn"
                      title="Remove"
                      aria-label="Remove notification"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
