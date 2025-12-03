/**
 * ShowDetails Page
 *
 * Displays show information with actionable contact links.
 * Accessible from hamburger menu as "Show Info".
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { replicatedShowsTable, type Show } from '@/services/replication';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import {
  ShowDetailsHeader,
  ShowDetailsLoading,
  ShowDetailsError,
  EventDetailsCard,
  LocationCard,
  ContactCard,
  NotesCard
} from './ShowDetailsComponents';
import { getSecretaryInfo, getChairmanInfo } from './showDetailsUtils';
import './ShowDetails.css';

export function ShowDetails() {
  const { licenseKey } = useParams<{ licenseKey: string }>();
  const navigate = useNavigate();
  const { showContext } = useAuth();

  const [show, setShow] = useState<Show | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load show data
  const loadShowData = async () => {
    try {
      setError(null);
      const keyToUse = licenseKey || showContext?.licenseKey;

      if (!keyToUse) {
        setError('No show selected');
        setIsLoading(false);
        return;
      }

      // Get all cached shows and find by license key
      const allShows = await replicatedShowsTable.getAllShows();
      const matchingShow = allShows.find(s => s.license_key === keyToUse);

      if (matchingShow) {
        setShow(matchingShow);
      } else {
        // Try syncing to get fresh data
        logger.log('[ShowDetails] Show not in cache, triggering sync');
        await replicatedShowsTable.sync(keyToUse);
        const updatedShows = await replicatedShowsTable.getAllShows();
        const syncedShow = updatedShows.find(s => s.license_key === keyToUse);

        if (syncedShow) {
          setShow(syncedShow);
        } else {
          setError('Show information not available');
        }
      }
    } catch (err) {
      logger.error('[ShowDetails] Failed to load show:', err);
      setError('Failed to load show information');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShowData();
  }, [licenseKey, showContext?.licenseKey]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const keyToUse = licenseKey || showContext?.licenseKey;
      if (keyToUse) {
        await replicatedShowsTable.sync(keyToUse);
        await loadShowData();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

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
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        showRefreshButton
      />

      <main className="show-details-content">
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
      </main>
    </div>
  );
}

export default ShowDetails;
