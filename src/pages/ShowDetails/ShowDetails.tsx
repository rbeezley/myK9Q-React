/**
 * ShowDetails Page (Show Dashboard)
 *
 * Streamlined dashboard displaying:
 * - Stats row (tappable counts for announcements, favorites, active classes, progress)
 * - Class overview table with tabs (Pending / Completed)
 * - Show contact information
 *
 * Accessible from hamburger menu as "Show Info".
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Activity, Info } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useAuth } from '@/contexts/AuthContext';
import { useAnnouncementStore } from '@/stores/announcementStore';
import { TabBar, Tab } from '@/components/ui';
import {
  ShowDetailsHeader,
  ShowDetailsLoading,
  ShowDetailsError,
  ContactCard,
  NotesCard,
  LocationCard,
  EventDetailsCard
} from './ShowDetailsComponents';
import { getSecretaryInfo, getChairmanInfo } from './showDetailsUtils';
import { useDashboardData } from './hooks/useDashboardData';
import { StatsRow } from './components/StatsRow';
import { ClassTable } from './components/ClassTable';
import './ShowDetails.css';

type PageTab = 'live' | 'info';

export function ShowDetails() {
  const { licenseKey: urlLicenseKey } = useParams<{ licenseKey: string }>();
  const navigate = useNavigate();
  const { showContext } = useAuth();
  const hapticFeedback = useHapticFeedback();
  const [activeTab, setActiveTab] = useState<PageTab>('live');

  // Use URL param or auth context
  const licenseKey = urlLicenseKey || showContext?.licenseKey;
  const showId = showContext?.showId;

  // Initialize announcement store with current license key
  const { setLicenseKey } = useAnnouncementStore();

  useEffect(() => {
    if (licenseKey) {
      setLicenseKey(licenseKey, showContext?.showName);
    }
  }, [licenseKey, showContext?.showName, setLicenseKey]);

  // Use dashboard data hook for all data
  const {
    stats,
    show,
    trials,
    pendingClasses,
    completedClasses,
    isLoading,
    error,
    refetch,
  } = useDashboardData(licenseKey, showId);

  // Get first trial ID for navigation (temporary until we handle multi-trial)
  const firstTrialId = trials.length > 0 ? String(trials[0].id) : undefined;

  // Handle refresh - full refresh when user explicitly taps refresh button
  const handleRefresh = () => {
    refetch({ all: true });
  };

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    hapticFeedback.light();
    setActiveTab(tabId as PageTab);
  };

  // Tab configuration
  const tabs: Tab[] = [
    { id: 'live', label: 'Live', icon: <Activity size={16} /> },
    { id: 'info', label: 'Info', icon: <Info size={16} /> },
  ];

  // Loading state
  if (isLoading) {
    return <ShowDetailsLoading />;
  }

  // Error state
  if (error || !show) {
    return <ShowDetailsError error={error} onBack={() => navigate('/home')} />;
  }

  // Get contact info
  const secretaryInfo = getSecretaryInfo(show);
  const chairmanInfo = getChairmanInfo(show);

  return (
    <div className="show-details-container">
      <ShowDetailsHeader
        subtitle={showContext?.showName || show.show_name}
        isRefreshing={false}
        onRefresh={handleRefresh}
        showRefreshButton
      />

      {/* Page-level tabs */}
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <main className="show-details-content">
        {activeTab === 'live' ? (
          /* Live Tab: Stats + Classes */
          <>
            <StatsRow
              stats={stats}
              licenseKey={licenseKey}
              trialId={firstTrialId}
            />
            <ClassTable
              pendingClasses={pendingClasses}
              completedClasses={completedClasses}
              trialId={firstTrialId}
              licenseKey={licenseKey}
              organization={show.organization}
              onClassUpdate={refetch}
            />
          </>
        ) : (
          /* Info Tab: Location, Event, Contacts, Notes - 2-col grid on desktop */
          <div className="show-details-info-grid">
            <EventDetailsCard show={show} />
            <LocationCard show={show} />
            <ContactCard
              title="Trial Secretary"
              icon={<User />}
              contact={secretaryInfo}
            />
            <ContactCard
              title="Trial Chairman"
              icon={<User />}
              contact={chairmanInfo}
            />
            <NotesCard notes={show.notes} />
          </div>
        )}
      </main>
    </div>
  );
}

export default ShowDetails;
