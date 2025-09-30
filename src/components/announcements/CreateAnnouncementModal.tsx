import React, { useState } from 'react';
import { useAnnouncementStore, type Announcement } from '../../stores/announcementStore';
import { AnnouncementService } from '../../services/announcementService';
import {
  X,
  Send,
  AlertTriangle,
  Calendar,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';

interface CreateAnnouncementModalProps {
  licenseKey: string;
  userRole?: 'admin' | 'judge' | 'steward' | 'exhibitor';
  onClose: () => void;
  onSuccess: () => void;
  editingAnnouncement?: Announcement; // For future edit functionality
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  licenseKey,
  userRole = 'exhibitor',
  onClose,
  onSuccess,
  editingAnnouncement
}) => {
  const { createAnnouncement, updateAnnouncement } = useAnnouncementStore();

  // Form state
  const [title, setTitle] = useState(editingAnnouncement?.title || '');
  const [content, setContent] = useState(editingAnnouncement?.content || '');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>(
    editingAnnouncement?.priority || 'normal'
  );
  const [authorName, setAuthorName] = useState(editingAnnouncement?.author_name || '');
  const [expiresAt, setExpiresAt] = useState(
    editingAnnouncement?.expires_at ?
      new Date(editingAnnouncement.expires_at).toISOString().slice(0, 16) : ''
  );

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const isEditing = !!editingAnnouncement;
  const canCreate = AnnouncementService.canManageAnnouncements(userRole || '');

  if (!canCreate) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content error-modal" onClick={(e) => e.stopPropagation()}>
          <div className="error-content">
            <AlertTriangle className="error-icon" />
            <h3>Access Denied</h3>
            <p>You don't have permission to create announcements.</p>
            <button onClick={onClose} className="btn btn-primary">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    if (title.length > 200) {
      setError('Title must be 200 characters or less');
      return;
    }

    if (content.length > 2000) {
      setError('Content must be 2000 characters or less');
      return;
    }

    setIsSubmitting(true);

    try {
      const announcementData = {
        title: title.trim(),
        content: content.trim(),
        priority,
        author_role: userRole! as 'admin' | 'judge' | 'steward',
        author_name: authorName.trim() || undefined,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        license_key: licenseKey,
        is_active: true
      };

      if (isEditing) {
        await updateAnnouncement(editingAnnouncement!.id, announcementData);
      } else {
        await createAnnouncement(announcementData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving announcement:', error);
      setError(error instanceof Error ? error.message : 'Failed to save announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityOptions = [
    { value: 'normal', label: 'Normal', icon: '📢', description: 'Standard announcement' },
    { value: 'high', label: 'High Priority', icon: '⚠️', description: 'Important information' },
    { value: 'urgent', label: 'Urgent', icon: '🚨', description: 'Critical updates only' }
  ];

  const roleInfo = AnnouncementService.getRoleBadgeInfo(userRole! as 'admin' | 'judge' | 'steward');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-announcement-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-left">
            <h2>{isEditing ? 'Edit Announcement' : 'Create Announcement'}</h2>
            <div className="author-badge">
              <span className="role-icon">{roleInfo.icon}</span>
              <span className="role-label">Posting as {roleInfo.label}</span>
            </div>
          </div>
          <div className="header-right">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`preview-btn ${showPreview ? 'active' : ''}`}
              title={showPreview ? 'Hide preview' : 'Show preview'}
            >
              {showPreview ? <EyeOff /> : <Eye />}
            </button>
            <button onClick={onClose} className="close-btn">
              <X />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="modal-body">
          {showPreview ? (
            // Preview Mode
            <div className="preview-content">
              <div className="preview-header">
                <h3>Preview</h3>
                <div className={`priority-badge ${priority}`}>
                  {priorityOptions.find(p => p.value === priority)?.icon}
                  {priorityOptions.find(p => p.value === priority)?.label}
                </div>
              </div>
              <div className="preview-announcement">
                <h4 className="preview-title">{title || 'Untitled Announcement'}</h4>
                <div className="preview-content-text">
                  {content || 'No content yet...'}
                </div>
                <div className="preview-footer">
                  <div className="preview-author">
                    <span className="role-icon">{roleInfo.icon}</span>
                    <span>{roleInfo.label}</span>
                    {authorName && <span>{authorName}</span>}
                  </div>
                  {expiresAt && (
                    <div className="preview-expiry">
                      <Calendar className="calendar-icon" />
                      <span>Expires {new Date(expiresAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Form Mode
            <form onSubmit={handleSubmit} className="announcement-form">
              {/* Title */}
              <div className="form-group">
                <label htmlFor="title" className="form-label">
                  Title *
                  <span className="char-count">{title.length}/200</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter announcement title..."
                  className="form-input"
                  maxLength={200}
                  required
                />
              </div>

              {/* Priority */}
              <div className="form-group">
                <label className="form-label">Priority *</label>
                <div className="priority-selector">
                  {priorityOptions.map(option => (
                    <label key={option.value} className="priority-option">
                      <input
                        type="radio"
                        name="priority"
                        value={option.value}
                        checked={priority === option.value}
                        onChange={(e) => setPriority(e.target.value as any)}
                      />
                      <div className={`priority-card ${option.value} ${priority === option.value ? 'selected' : ''}`}>
                        <div className="priority-header">
                          <span className="priority-icon">{option.icon}</span>
                          <span className="priority-label">{option.label}</span>
                        </div>
                        <div className="priority-description">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="form-group">
                <label htmlFor="content" className="form-label">
                  Content *
                  <span className="char-count">{content.length}/2000</span>
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter announcement content..."
                  className="form-textarea"
                  rows={6}
                  maxLength={2000}
                  required
                />
              </div>

              {/* Author Name (Optional) */}
              <div className="form-group">
                <label htmlFor="authorName" className="form-label">
                  Your Name (Optional)
                </label>
                <input
                  id="authorName"
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Judge Smith, Ring Steward..."
                  className="form-input"
                  maxLength={100}
                />
                <div className="form-hint">
                  <Info className="info-icon" />
                  <span>This will be displayed with your role. Leave blank to show role only.</span>
                </div>
              </div>

              {/* Expiry Date (Optional) */}
              <div className="form-group">
                <label htmlFor="expiresAt" className="form-label">
                  Expires (Optional)
                </label>
                <input
                  id="expiresAt"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="form-input"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <div className="form-hint">
                  <Info className="info-icon" />
                  <span>Announcement will be hidden after this date/time.</span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="error-message">
                  <AlertTriangle className="error-icon" />
                  <span>{error}</span>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={isSubmitting || !title.trim() || !content.trim()}
          >
            {isSubmitting ? (
              <>
                <div className="spinner" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Send />
                {isEditing ? 'Update' : 'Create'} Announcement
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};