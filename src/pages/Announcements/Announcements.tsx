import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { useAnnouncementStore } from '../../stores/announcementStore';
import type { Announcement } from '../../stores/announcementStore';
import { HamburgerMenu, PullToRefresh } from '../../components/ui';
import { useSettingsStore } from '@/stores/settingsStore';
import { AnnouncementCard } from '../../components/announcements/AnnouncementCard';
import { CreateAnnouncementModal } from '../../components/announcements/CreateAnnouncementModal';
import { AnnouncementFilters } from '../../components/announcements/AnnouncementFilters';
import { DeleteConfirmationModal } from '../../components/announcements/DeleteConfirmationModal';
import { NotificationSettings } from '../../components/announcements/NotificationSettings';
import {
  Plus,
  Search,
  X,
  Bell,
  RefreshCw,
  Filter,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings
} from 'lucide-react';
import './Announcements.css';
import '../../components/announcements/AnnouncementComponents.css';

export const Announcements: React.FC = () => {
  const { showContext, role } = useAuth();
  const { hasRole } = usePermission();
  const { settings } = useSettingsStore();
  const {
    announcements,
    unreadCount,
    isLoading,
    error,
    currentLicenseKey,
    currentShowName,
    filters,
    setLicenseKey,
    fetchAnnouncements,
    markAllAsRead,
    updateLastVisit,
    setFilters,
    clearFilters,
    getFilteredAnnouncements,
    enableRealtime: _enableRealtime,
    isConnected,
    deleteAnnouncement
  } = useAnnouncementStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; announcement: Announcement | null }>({ isOpen: false, announcement: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Can create announcements if admin, judge, or steward
  const canCreateAnnouncements = hasRole(['admin', 'judge', 'steward']);

  // Initialize with current show context
  useEffect(() => {
    if (showContext?.licenseKey && currentLicenseKey !== showContext.licenseKey) {
      setLicenseKey(showContext.licenseKey, showContext.showName);
    }
  }, [showContext, currentLicenseKey, setLicenseKey]);

  // Update last visit when component mounts
  useEffect(() => {
    updateLastVisit();
  }, [updateLastVisit]);

  // Handle search term changes
  useEffect(() => {
    setFilters({ searchTerm });
  }, [searchTerm, setFilters]);

  const handleRefresh = async () => {
    if (!currentLicenseKey) return;

    setIsRefreshing(true);
    try {
      await fetchAnnouncements(currentLicenseKey);
    } catch (error) {
      console.error('Failed to refresh announcements:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const filteredAnnouncements = getFilteredAnnouncements();

  // Show context banner
  const showContextBanner = currentShowName || currentLicenseKey;

  return (
    <div className="announcements-container app-container">
      {/* Header with Hamburger Menu, Title, and Actions */}
      <header className="page-header announcements-header">
        <HamburgerMenu currentPage="announcements" />

        <div className="header-center">
          <div className="header-title">
            <Bell className="header-icon" />
            <h1>Announcements</h1>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
        </div>

        <div className="header-actions">
          {/* Notification Settings */}
          <button
            onClick={() => setShowNotificationSettings(!showNotificationSettings)}
            className={`action-btn settings-btn ${showNotificationSettings ? 'active' : ''}`}
            title="Notification settings"
          >
            <Settings />
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`action-btn refresh-btn ${isRefreshing ? 'loading' : ''}`}
            title="Refresh announcements"
          >
            <RefreshCw className={isRefreshing ? 'spinning' : ''} />
          </button>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`action-btn filter-btn ${showFilters ? 'active' : ''}`}
            title="Filter announcements"
          >
            <Filter />
          </button>

          {/* Mark All Read */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="action-btn mark-read-btn"
              title="Mark all as read"
            >
              <CheckCircle />
            </button>
          )}

          {/* Create Announcement */}
          {canCreateAnnouncements && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="action-btn create-btn primary"
              title="Create announcement"
            >
              <Plus />
            </button>
          )}
        </div>
      </header>

      {/* Show Context Banner */}
      {showContextBanner && (
        <div className="show-context-banner">
          <div className="context-info">
            <span className="context-label">📍 Connected to:</span>
            <span className="context-name">{currentShowName || 'Current Show'}</span>
            {currentLicenseKey && (
              <span className="context-license">{currentLicenseKey.slice(0, 8)}...</span>
            )}
          </div>
          <div className="context-status">
            {isConnected ? (
              <span className="status-connected">
                <span className="status-dot"></span>
                Live updates
              </span>
            ) : (
              <span className="status-disconnected">
                <span className="status-dot offline"></span>
                Offline
              </span>
            )}
          </div>
        </div>
      )}

      {/* Notification Settings */}
      {showNotificationSettings && (
        <NotificationSettings />
      )}

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-input-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="clear-search-btn"
            >
              <X />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <AnnouncementFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={clearFilters}
        />
      )}

      {/* Content with Pull to Refresh */}
      <PullToRefresh
        onRefresh={handleRefresh}
        enabled={settings.pullToRefresh}
        threshold={settings.pullSensitivity === 'easy' ? 60 : settings.pullSensitivity === 'firm' ? 100 : 80}
      >
      <div className="announcements-content">
        {error && (
          <div className="error-banner">
            <AlertTriangle />
            <span>Failed to load announcements: {error}</span>
            <button onClick={handleRefresh} className="retry-btn">
              Retry
            </button>
          </div>
        )}

        {isLoading && announcements.length === 0 ? (
          <div className="loading-state">
            <RefreshCw className="spinning" />
            <span>Loading announcements...</span>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="empty-state">
            {searchTerm || Object.keys(filters).length > 1 ? (
              <>
                <Search className="empty-icon" />
                <h3>No announcements found</h3>
                <p>Try adjusting your search or filters</p>
                <button onClick={() => {
                  setSearchTerm('');
                  clearFilters();
                }} className="clear-filters-btn">
                  Clear all filters
                </button>
              </>
            ) : (
              <>
                <Bell className="empty-icon" />
                <h3>No announcements yet</h3>
                <p>Check back later for updates from event staff</p>
                {canCreateAnnouncements && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="create-first-btn"
                  >
                    <Plus />
                    Create first announcement
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="announcements-list">
            {filteredAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                currentUserRole={role || undefined}
                onEdit={() => {
                  setEditingAnnouncement(announcement);
                  setShowCreateModal(true);
                }}
                onDelete={() => {
                  setDeleteConfirmation({ isOpen: true, announcement });
                }}
              />
            ))}
          </div>
        )}
      </div>
      </PullToRefresh>

      {/* Active Filters Summary */}
      {(searchTerm || Object.keys(filters).some(key => key !== 'searchTerm' && filters[key as keyof typeof filters])) && (
        <div className="active-filters-summary">
          <Info className="info-icon" />
          <span>
            Showing {filteredAnnouncements.length} of {announcements.length} announcements
          </span>
          <button onClick={() => {
            setSearchTerm('');
            clearFilters();
          }} className="clear-all-btn">
            Clear all
          </button>
        </div>
      )}

      {/* Create/Edit Announcement Modal */}
      {showCreateModal && (
        <CreateAnnouncementModal
          licenseKey={currentLicenseKey || ''}
          userRole={role || undefined}
          editingAnnouncement={editingAnnouncement || undefined}
          onClose={() => {
            setShowCreateModal(false);
            setEditingAnnouncement(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingAnnouncement(null);
            handleRefresh();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        announcement={deleteConfirmation.announcement}
        isDeleting={isDeleting}
        onConfirm={async () => {
          if (!deleteConfirmation.announcement) return;

          setIsDeleting(true);
          try {
            await deleteAnnouncement(deleteConfirmation.announcement.id);
            setDeleteConfirmation({ isOpen: false, announcement: null });
          } catch (error) {
            console.error('Failed to delete announcement:', error);
            alert('Failed to delete announcement. Please try again.');
          } finally {
            setIsDeleting(false);
          }
        }}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteConfirmation({ isOpen: false, announcement: null });
          }
        }}
      />
    </div>
  );
};