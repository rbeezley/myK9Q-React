/**
 * ShowDetails Page
 *
 * Displays show information with actionable contact links.
 * Accessible from hamburger menu as "Show Info".
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Mail,
  Phone,
  Globe,
  Building2,
  User,
  FileText,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { HamburgerMenu, CompactOfflineIndicator } from '@/components/ui';
import { replicatedShowsTable, type Show } from '@/services/replication';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
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

  // Format date range
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };

    if (startDate === endDate) {
      return start.toLocaleDateString('en-US', options);
    }

    // Check if same month and year - format as "Fri, Sep 15 - Sat 16, 2023"
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      const startStr = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const endStr = `${end.toLocaleDateString('en-US', { weekday: 'short' })} ${end.getDate()}, ${end.getFullYear()}`;
      return `${startStr} - ${endStr}`;
    }

    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  // Format phone number for display (keeps raw for tel: link)
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX for 10-digit numbers
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    // Format as +X (XXX) XXX-XXXX for 11-digit numbers (with country code)
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }

    // Return original if not a standard format
    return phone;
  };

  // Generate Google Maps URL
  const getGoogleMapsUrl = (address: string) => {
    return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
  };

  // Build full site address
  const getFullSiteAddress = () => {
    if (!show) return null;
    const parts = [
      show.site_address,
      show.site_city,
      show.site_state && show.site_zip ? `${show.site_state} ${show.site_zip}` : (show.site_state || show.site_zip)
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  // Get secretary info (new fields with fallback to legacy)
  const secretaryName = show?.secretary_name || show?.show_secretary_name;
  const secretaryEmail = show?.secretary_email || show?.show_secretary_email;
  const secretaryPhone = show?.secretary_phone || show?.show_secretary_phone;

  // Check if sections should be shown
  const hasSecretaryInfo = secretaryName || secretaryEmail || secretaryPhone;
  const hasChairmanInfo = show?.chairman_name || show?.chairman_email || show?.chairman_phone;
  const fullSiteAddress = getFullSiteAddress();
  const hasLocationInfo = fullSiteAddress || show?.location || show?.website || show?.site_name;

  if (isLoading) {
    return (
      <div className="show-details-container">
        <header className="page-header show-details-header">
          <div className="header-left">
            <HamburgerMenu currentPage="show" />
            <CompactOfflineIndicator />
          </div>

          <div className="header-center">
            <h1>
              <Building2 className="title-icon" />
              Show Info
            </h1>
          </div>

          <div className="header-right" />
        </header>
        <div className="show-details-loading">
          <RefreshCw className="spinning" size={24} />
          <span>Loading show information...</span>
        </div>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="show-details-container">
        <header className="page-header show-details-header">
          <div className="header-left">
            <HamburgerMenu currentPage="show" />
            <CompactOfflineIndicator />
          </div>

          <div className="header-center">
            <h1>
              <Building2 className="title-icon" />
              Show Info
            </h1>
          </div>

          <div className="header-right" />
        </header>
        <div className="show-details-error">
          <p>{error || 'Show not found'}</p>
          <button
            className="show-details-back-btn"
            onClick={() => navigate('/home')}
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="show-details-container">
      <header className="page-header show-details-header">
        <div className="header-left">
          <HamburgerMenu currentPage="show" />
          <CompactOfflineIndicator />
        </div>

        <div className="header-center">
          <h1>
            <Building2 className="title-icon" />
            Show Info
          </h1>
          <p className="header-subtitle">{showContext?.showName || show.show_name}</p>
        </div>

        <div className="header-right">
          <button
            className="header-action-button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh"
          >
            <RefreshCw size={20} className={isRefreshing ? 'spinning' : ''} />
          </button>
        </div>
      </header>

      <main className="show-details-content">
        {/* Event Details Card */}
        <section className="show-details-card">
          <h2 className="show-details-card-title">
            <Calendar />
            Event Details
          </h2>

          <div className="show-details-grid">
            <div className="show-detail-inline">
              <span className="detail-label">Club:</span>
              <span className="detail-value">{show.club_name}</span>
            </div>

            <div className="show-detail-inline">
              <span className="detail-label">Event:</span>
              <span className="detail-value">{show.show_name}</span>
            </div>

            <div className="show-detail-inline">
              <span className="detail-label">Organization:</span>
              <span className="detail-value">{show.organization}</span>
            </div>

            <div className="show-detail-inline">
              <span className="detail-label">Dates:</span>
              <span className="detail-value">{formatDateRange(show.start_date, show.end_date)}</span>
            </div>

            {show.show_status && (
              <div className="show-detail-inline">
                <span className="detail-label">Status:</span>
                <span className={`detail-value status-badge status-${show.show_status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {show.show_status}
                </span>
              </div>
            )}

            {show.event_url && (
              <a
                href={show.event_url.startsWith('http') ? show.event_url : `https://${show.event_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="show-detail-row show-detail-link event-details-link"
              >
                <Globe size={16} className="detail-icon" />
                <span className="detail-text">View Event Details</span>
              </a>
            )}
          </div>
        </section>

        {/* Location Card - Only show if has location info */}
        {hasLocationInfo && (
          <section className="show-details-card">
            <h2 className="show-details-card-title">
              <MapPin />
              Location
            </h2>

            <div className="show-details-list">
              {show.site_name && (
                <div className="show-detail-row">
                  <Building2 size={16} className="detail-icon" />
                  <span className="detail-text">{show.site_name}</span>
                </div>
              )}

              {fullSiteAddress && (
                <a
                  href={getGoogleMapsUrl(fullSiteAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="show-detail-row show-detail-link"
                >
                  <MapPin size={16} className="detail-icon" />
                  <span className="detail-text">{fullSiteAddress}</span>
                </a>
              )}

              {/* Legacy location field as fallback */}
              {!fullSiteAddress && show.location && (
                <a
                  href={getGoogleMapsUrl(show.location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="show-detail-row show-detail-link"
                >
                  <MapPin size={16} className="detail-icon" />
                  <span className="detail-text">{show.location}</span>
                </a>
              )}

              {show.website && (
                <a
                  href={show.website.startsWith('http') ? show.website : `https://${show.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="show-detail-row show-detail-link"
                >
                  <Globe size={16} className="detail-icon" />
                  <span className="detail-text">Club Website</span>
                </a>
              )}
            </div>
          </section>
        )}

        {/* Trial Secretary Card */}
        {hasSecretaryInfo && (
          <section className="show-details-card">
            <h2 className="show-details-card-title">
              <User />
              Trial Secretary
            </h2>

            <div className="show-details-list">
              {secretaryName && (
                <div className="show-detail-row">
                  <User size={16} className="detail-icon" />
                  <span className="detail-text">{secretaryName}</span>
                </div>
              )}

              {secretaryEmail && (
                <a
                  href={`mailto:${secretaryEmail}`}
                  className="show-detail-row show-detail-link"
                >
                  <Mail size={16} className="detail-icon" />
                  <span className="detail-text">{secretaryEmail}</span>
                </a>
              )}

              {secretaryPhone && (
                <a
                  href={`tel:${secretaryPhone.replace(/\D/g, '')}`}
                  className="show-detail-row show-detail-link"
                >
                  <Phone size={16} className="detail-icon" />
                  <span className="detail-text">{formatPhoneNumber(secretaryPhone)}</span>
                </a>
              )}
            </div>
          </section>
        )}

        {/* Chairman Card */}
        {hasChairmanInfo && (
          <section className="show-details-card">
            <h2 className="show-details-card-title">
              <User />
              Trial Chairman
            </h2>

            <div className="show-details-list">
              {show.chairman_name && (
                <div className="show-detail-row">
                  <User size={16} className="detail-icon" />
                  <span className="detail-text">{show.chairman_name}</span>
                </div>
              )}

              {show.chairman_email && (
                <a
                  href={`mailto:${show.chairman_email}`}
                  className="show-detail-row show-detail-link"
                >
                  <Mail size={16} className="detail-icon" />
                  <span className="detail-text">{show.chairman_email}</span>
                </a>
              )}

              {show.chairman_phone && (
                <a
                  href={`tel:${show.chairman_phone.replace(/\D/g, '')}`}
                  className="show-detail-row show-detail-link"
                >
                  <Phone size={16} className="detail-icon" />
                  <span className="detail-text">{formatPhoneNumber(show.chairman_phone)}</span>
                </a>
              )}
            </div>
          </section>
        )}

        {/* Notes Card - Only show if has non-empty notes */}
        {show.notes && show.notes.trim() && (
          <section className="show-details-card">
            <h2 className="show-details-card-title">
              <FileText />
              Notes
            </h2>
            <p className="show-notes">{show.notes.trim()}</p>
          </section>
        )}
      </main>
    </div>
  );
}

export default ShowDetails;
