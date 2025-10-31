import React from 'react';
import './TabBar.css';

export interface Tab {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

/**
 * TabBar - Standardized tab navigation component
 *
 * Features:
 * - iOS-style segmented control design
 * - Optional icons and count badges
 * - Theme-aware colors (adapts to blue/green/orange themes)
 * - Mobile-optimized touch targets (min 44px height)
 * - Smooth animations
 *
 * Usage:
 * ```tsx
 * <TabBar
 *   tabs={[
 *     { id: 'pending', label: 'Pending', count: 20, icon: <Clock size={16} /> },
 *     { id: 'completed', label: 'Completed', count: 15, icon: <CheckCircle size={16} /> }
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * />
 * ```
 */
export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}) => {
  return (
    <div className={`tab-bar ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-bar-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          type="button"
        >
          {tab.icon && <span className="tab-icon">{tab.icon}</span>}
          <span className="tab-text">{tab.label}</span>
          {tab.count !== undefined && (
            <span className="tab-count">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
};
