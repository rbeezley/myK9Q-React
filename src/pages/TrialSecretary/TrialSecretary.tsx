/**
 * Trial Secretary Tools Page
 *
 * Admin-only page with two main tools:
 * 1. Kanban To-Do Board - Task management with drag-and-drop
 * 2. Steward Scheduler - Class-based volunteer assignment
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { HamburgerMenu, CompactOfflineIndicator, TabBar } from '../../components/ui';
import type { Tab } from '../../components/ui';
import { ClipboardList, Users, AlertTriangle, MoreVertical, Plus, Settings } from 'lucide-react';
import { KanbanBoard } from './components/KanbanBoard';
import { ScheduleBoard } from './components/ScheduleBoard';
import './TrialSecretary.css';

type TabType = 'kanban' | 'schedule';

export function TrialSecretary() {
  const navigate = useNavigate();
  const { role, showContext } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('kanban');
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // External triggers for ScheduleBoard actions
  const [scheduleTrigger, setScheduleTrigger] = useState<'add-volunteer' | 'manage-roles' | null>(null);

  // Tab configuration for TabBar component
  const tabs: Tab[] = useMemo(() => [
    { id: 'kanban', label: 'To-Do Board', icon: <ClipboardList size={16} /> },
    { id: 'schedule', label: 'Steward Schedule', icon: <Users size={16} /> },
  ], []);

  // Clear trigger after it's been consumed
  const clearScheduleTrigger = useCallback(() => {
    setScheduleTrigger(null);
  }, []);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.actions-menu-container')) {
        setShowActionsMenu(false);
      }
    };

    if (showActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActionsMenu]);

  // Admin-only access check
  if (role !== 'admin') {
    return (
      <div className="secretary-access-denied">
        <AlertTriangle size={48} className="warning-icon" />
        <h2>Access Denied</h2>
        <p>Trial Secretary Tools are only available to administrators.</p>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/home')}
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="secretary-page">
      {/* Header - Standard pattern */}
      <header className="page-header secretary-header">
        <HamburgerMenu currentPage="admin" />
        <CompactOfflineIndicator />

        {/* Centered title */}
        <div className="secretary-title">
          <h1>Secretary Tools</h1>
          <span className="secretary-subtitle">{showContext?.showName}</span>
        </div>

        {/* Actions menu (three-dot) - only show on schedule tab */}
        {activeTab === 'schedule' && (
          <div className="header-buttons">
            <div className="actions-menu-container">
              <button
                className="icon-button actions-button"
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                aria-label="Actions menu"
                title="More Actions"
              >
                <MoreVertical className="h-5 w-5" />
              </button>

              {showActionsMenu && (
                <div className="actions-dropdown-menu">
                  <button
                    onClick={() => {
                      setShowActionsMenu(false);
                      setScheduleTrigger('add-volunteer');
                    }}
                    className="action-menu-item"
                  >
                    <Plus className="h-4 w-4" />
                    Add Volunteer
                  </button>
                  <button
                    onClick={() => {
                      setShowActionsMenu(false);
                      setScheduleTrigger('manage-roles');
                    }}
                    className="action-menu-item"
                  >
                    <Settings className="h-4 w-4" />
                    Manage Roles
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Tab Navigation */}
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabType)}
      />

      {/* Tab Content */}
      <div className="secretary-content">
        {activeTab === 'kanban' && <KanbanBoard />}
        {activeTab === 'schedule' && (
          <ScheduleBoard
            externalTrigger={scheduleTrigger}
            onTriggerConsumed={clearScheduleTrigger}
          />
        )}
      </div>
    </div>
  );
}

export default TrialSecretary;
