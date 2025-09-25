import React, { useState } from 'react';
import { X, Clock, Play, Coffee, CheckCircle, Settings, Calendar } from 'lucide-react';
import './ClassStatusDialog.css';

interface ClassStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (status: string, timeValue?: string) => void;
  classData: {
    id: number;
    element: string;
    level: string;
    class_name: string;
    class_status: string;
    entry_count: number;
  };
  currentStatus: string;
}

export const ClassStatusDialog: React.FC<ClassStatusDialogProps> = ({
  isOpen,
  onClose,
  onStatusChange,
  classData,
  currentStatus
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [timeValue, setTimeValue] = useState<string>('');

  const statusOptions = [
    {
      id: 'setup',
      label: 'Setup',
      icon: Settings,
      description: 'Preparing the ring and equipment',
      color: '#6b7280',
      needsTime: false
    },
    {
      id: 'briefing',
      label: 'Briefing',
      icon: Calendar,
      description: 'Judge briefing exhibitors',
      color: '#3b82f6',
      needsTime: true,
      timeLabel: 'Briefing time',
      timePlaceholder: '10:00 AM'
    },
    {
      id: 'break',
      label: 'Break',
      icon: Coffee,
      description: 'Class is on break',
      color: '#f59e0b',
      needsTime: true,
      timeLabel: 'Break until',
      timePlaceholder: '2:30 PM'
    },
    {
      id: 'start_time',
      label: 'Start Time',
      icon: Clock,
      description: 'Set class start time',
      color: '#06b6d4',
      needsTime: true,
      timeLabel: 'Start time',
      timePlaceholder: '1:00 PM'
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      icon: Play,
      description: 'Class is actively running',
      color: '#3b82f6',
      needsTime: false
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: CheckCircle,
      description: 'Class has finished',
      color: '#8b5cf6',
      needsTime: false
    }
  ];

  const handleStatusSelect = (statusId: string) => {
    console.log('🔄 ClassStatusDialog: handleStatusSelect called with:', statusId);
    const status = statusOptions.find(s => s.id === statusId);
    if (status?.needsTime) {
      setSelectedStatus(statusId);
      setTimeValue('');
    } else {
      console.log('🔄 ClassStatusDialog: Calling onStatusChange with:', statusId);
      onStatusChange(statusId);
      onClose();
    }
  };

  const handleTimeSubmit = () => {
    if (selectedStatus && timeValue.trim()) {
      onStatusChange(selectedStatus, timeValue.trim());
      onClose();
      setSelectedStatus(null);
      setTimeValue('');
    }
  };

  const handleCancel = () => {
    setSelectedStatus(null);
    setTimeValue('');
  };

  const getDefaultTime = (statusId: string) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (statusId === 'break') {
      // Default break to 30 minutes from now
      const breakTime = new Date(now.getTime() + 30 * 60000);
      return breakTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }

    return timeString;
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-container" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <div className="dialog-title">
            <Clock className="title-icon" />
            <span>Class Status</span>
          </div>
          <button className="close-button" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="dialog-content">
          {/* Class Info Header */}
          <div className="class-info-header">
            <h3 className="class-title">{classData.element} {classData.level}</h3>
            <div className="class-meta">
              <span className="entry-count">
                {classData.entry_count} {classData.entry_count === 1 ? 'Dog' : 'Dogs'}
              </span>
            </div>
          </div>

          {selectedStatus ? (
            /* Time Input Interface */
            <div className="time-input-container">
              {(() => {
                const status = statusOptions.find(s => s.id === selectedStatus);
                const IconComponent = status?.icon || Clock;
                return (
                  <>
                    <div className="time-status-header">
                      <div className="time-status-icon">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="time-status-title">{status?.label}</h4>
                        <p className="time-status-description">{status?.description}</p>
                      </div>
                    </div>

                    <div className="time-input-group">
                      <label className="time-input-label">{status?.timeLabel}</label>
                      <input
                        type="text"
                        className="time-input"
                        value={timeValue}
                        onChange={(e) => setTimeValue(e.target.value)}
                        placeholder={status?.timePlaceholder || getDefaultTime(selectedStatus)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleTimeSubmit();
                          } else if (e.key === 'Escape') {
                            handleCancel();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="time-default-button"
                        onClick={() => setTimeValue(getDefaultTime(selectedStatus))}
                      >
                        Use Current Time
                      </button>
                    </div>

                    <div className="time-actions">
                      <button
                        className="time-action-button time-action-cancel"
                        onClick={handleCancel}
                      >
                        Cancel
                      </button>
                      <button
                        className="time-action-button time-action-submit"
                        onClick={handleTimeSubmit}
                        disabled={!timeValue.trim()}
                      >
                        Set {status?.label}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            /* Status Options Grid */
            <div className="status-grid">
              {statusOptions.map((status) => {
                const IconComponent = status.icon;
                const isSelected = currentStatus === status.id;

                return (
                  <div
                    key={status.id}
                    className={`status-item ${isSelected ? 'status-item-selected' : ''}`}
                    onClick={() => handleStatusSelect(status.id)}
                    role="button"
                    tabIndex={0}
                    style={{ '--status-color': status.color } as React.CSSProperties}
                  >
                    <div className="status-icon">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="status-content">
                      <label className="status-label">{status.label}</label>
                      <div className="status-description">{status.description}</div>
                    </div>
                    {isSelected && (
                      <div className="status-selected-indicator">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};