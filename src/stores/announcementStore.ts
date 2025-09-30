import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { serviceWorkerManager } from '../utils/serviceWorkerUtils';
import { pushNotificationService } from '../utils/pushNotificationService';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Announcement {
  id: number;
  license_key: string;
  title: string;
  content: string;
  priority: 'normal' | 'high' | 'urgent';
  author_role: 'admin' | 'judge' | 'steward';
  author_name?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  is_active: boolean;
  is_read?: boolean;
}

export interface AnnouncementRead {
  id: number;
  announcement_id: number;
  user_identifier: string;
  license_key: string;
  read_at: string;
}

interface AnnouncementFilters {
  priority?: 'normal' | 'high' | 'urgent';
  author_role?: 'admin' | 'judge' | 'steward';
  searchTerm?: string;
  showExpired?: boolean;
}

interface AnnouncementState {
  // Data
  announcements: Announcement[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  lastVisit: string | null;

  // Real-time
  realtimeChannel: RealtimeChannel | null;
  isConnected: boolean;

  // Filters
  filters: AnnouncementFilters;

  // Current context
  currentLicenseKey: string | null;
  currentShowName: string | null;

  // Actions
  setLicenseKey: (licenseKey: string, showName?: string) => void;
  fetchAnnouncements: (licenseKey?: string) => Promise<void>;
  createAnnouncement: (announcement: Omit<Announcement, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateAnnouncement: (id: number, updates: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: number) => Promise<void>;
  markAsRead: (announcementId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;

  // Filters
  setFilters: (filters: Partial<AnnouncementFilters>) => void;
  clearFilters: () => void;

  // Real-time
  enableRealtime: (licenseKey: string) => Promise<void>;
  disableRealtime: () => Promise<void>;

  // Utility
  getFilteredAnnouncements: () => Announcement[];
  updateLastVisit: () => void;
  triggerNotification: (announcement: Announcement) => void;
  reset: () => void;
}

// Generate user identifier for read tracking
const generateUserIdentifier = (): string => {
  // Use session storage for temporary identifier within session
  let identifier = sessionStorage.getItem('user_session_id');
  if (!identifier) {
    identifier = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('user_session_id', identifier);
  }
  return identifier;
};

export const useAnnouncementStore = create<AnnouncementState>()(
  devtools(
    (set, get) => ({
      // Initial state
      announcements: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      lastVisit: localStorage.getItem('announcements_last_visit'),
      realtimeChannel: null,
      isConnected: false,
      filters: {},
      currentLicenseKey: null,
      currentShowName: null,

      setLicenseKey: (licenseKey: string, showName?: string) => {
        const current = get();

        // If switching to different license key, clean up
        if (current.currentLicenseKey && current.currentLicenseKey !== licenseKey) {
          current.disableRealtime();
          set({ announcements: [], unreadCount: 0 });
        }

        set({
          currentLicenseKey: licenseKey,
          currentShowName: showName || null
        });

        // Store in localStorage for persistence
        localStorage.setItem('current_show_license', licenseKey);
        if (showName) {
          localStorage.setItem('current_show_name', showName);
        }

        // Update service worker with license key for tenant isolation
        serviceWorkerManager.updateLicenseKey(licenseKey);

        // Auto-fetch announcements for new license
        get().fetchAnnouncements(licenseKey);
        get().enableRealtime(licenseKey);
      },

      fetchAnnouncements: async (licenseKey?: string) => {
        const targetLicenseKey = licenseKey || get().currentLicenseKey;
        if (!targetLicenseKey) {
          set({ error: 'No license key provided' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // Fetch announcements for specific license key
          const { data: announcements, error } = await supabase
            .from('announcements')
            .select('*')
            .eq('license_key', targetLicenseKey)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (error) throw error;

          // Get read status for current user
          const userIdentifier = generateUserIdentifier();
          const { data: reads } = await supabase
            .from('announcement_reads')
            .select('announcement_id')
            .eq('user_identifier', userIdentifier)
            .eq('license_key', targetLicenseKey);

          const readIds = new Set(reads?.map(r => r.announcement_id) || []);

          // Mark announcements as read/unread
          const announcementsWithReadStatus = announcements?.map(announcement => ({
            ...announcement,
            is_read: readIds.has(announcement.id)
          })) || [];

          // Calculate unread count
          const unreadCount = announcementsWithReadStatus.filter(a => !a.is_read).length;

          set({
            announcements: announcementsWithReadStatus,
            unreadCount,
            isLoading: false
          });

        } catch (error) {
          console.error('Error fetching announcements:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch announcements',
            isLoading: false
          });
        }
      },

      createAnnouncement: async (announcement) => {
        const { currentLicenseKey } = get();
        if (!currentLicenseKey) {
          throw new Error('No license key set');
        }

        try {
          const { data, error } = await supabase
            .from('announcements')
            .insert({
              ...announcement,
              license_key: currentLicenseKey
            })
            .select()
            .single();

          if (error) throw error;

          // Add to local state
          set(state => ({
            announcements: [{ ...data, is_read: false }, ...state.announcements],
            unreadCount: state.unreadCount + 1
          }));

          // Send push notification for new announcement
          try {
            await pushNotificationService.sendAnnouncementNotification(data);
          } catch (pushError) {
            console.warn('Failed to send push notification:', pushError);
            // Don't throw error - announcement was created successfully
          }

        } catch (error) {
          console.error('Error creating announcement:', error);
          throw error;
        }
      },

      updateAnnouncement: async (id, updates) => {
        try {
          const { data, error } = await supabase
            .from('announcements')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          // Update local state
          set(state => ({
            announcements: state.announcements.map(a =>
              a.id === id ? { ...a, ...data } : a
            )
          }));

        } catch (error) {
          console.error('Error updating announcement:', error);
          throw error;
        }
      },

      deleteAnnouncement: async (id) => {
        try {
          const { error } = await supabase
            .from('announcements')
            .update({ is_active: false })
            .eq('id', id);

          if (error) throw error;

          // Remove from local state
          set(state => ({
            announcements: state.announcements.filter(a => a.id !== id),
            unreadCount: state.announcements.find(a => a.id === id && !a.is_read)
              ? state.unreadCount - 1
              : state.unreadCount
          }));

        } catch (error) {
          console.error('Error deleting announcement:', error);
          throw error;
        }
      },

      markAsRead: async (announcementId) => {
        const { currentLicenseKey } = get();
        if (!currentLicenseKey) return;

        const userIdentifier = generateUserIdentifier();

        try {
          // Insert read record (upsert behavior with unique constraint)
          const { error } = await supabase
            .from('announcement_reads')
            .upsert({
              announcement_id: announcementId,
              user_identifier: userIdentifier,
              license_key: currentLicenseKey
            });

          if (error && !error.message.includes('duplicate')) {
            throw error;
          }

          // Update local state
          set(state => {
            const announcement = state.announcements.find(a => a.id === announcementId);
            if (announcement && !announcement.is_read) {
              return {
                announcements: state.announcements.map(a =>
                  a.id === announcementId ? { ...a, is_read: true } : a
                ),
                unreadCount: Math.max(0, state.unreadCount - 1)
              };
            }
            return state;
          });

        } catch (error) {
          console.error('Error marking announcement as read:', error);
        }
      },

      markAllAsRead: async () => {
        const { currentLicenseKey, announcements } = get();
        if (!currentLicenseKey) return;

        const userIdentifier = generateUserIdentifier();
        const unreadAnnouncements = announcements.filter(a => !a.is_read);

        if (unreadAnnouncements.length === 0) return;

        try {
          // Batch insert read records
          const readRecords = unreadAnnouncements.map(a => ({
            announcement_id: a.id,
            user_identifier: userIdentifier,
            license_key: currentLicenseKey
          }));

          const { error } = await supabase
            .from('announcement_reads')
            .upsert(readRecords);

          if (error) throw error;

          // Update local state
          set(state => ({
            announcements: state.announcements.map(a => ({ ...a, is_read: true })),
            unreadCount: 0
          }));

        } catch (error) {
          console.error('Error marking all announcements as read:', error);
        }
      },

      setFilters: (newFilters) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters }
        }));
      },

      clearFilters: () => {
        set({ filters: {} });
      },

      enableRealtime: async (licenseKey) => {
        const { realtimeChannel } = get();

        // Don't create duplicate channels
        if (realtimeChannel) {
          await get().disableRealtime();
        }

        try {
          const channel = supabase.channel(`announcements-${licenseKey}`);

          // Listen for new announcements
          channel
            .on('postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'announcements',
                filter: `license_key=eq.${licenseKey}`
              },
              (payload) => {
                console.log('📢 New announcement received:', payload.new);
                const newAnnouncement: Announcement = { ...(payload.new as Announcement), is_read: false };

                set(state => ({
                  announcements: [newAnnouncement, ...state.announcements],
                  unreadCount: state.unreadCount + 1
                }));

                // Trigger notification if urgent
                if (payload.new.priority === 'urgent') {
                  get().triggerNotification(newAnnouncement);
                }
              }
            )
            .on('postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'announcements',
                filter: `license_key=eq.${licenseKey}`
              },
              (payload) => {
                console.log('📢 Announcement updated:', payload.new);
                set(state => ({
                  announcements: state.announcements.map(a =>
                    a.id === payload.new.id ? { ...a, ...payload.new } : a
                  )
                }));
              }
            )
            .on('postgres_changes',
              {
                event: 'DELETE',
                schema: 'public',
                table: 'announcements',
                filter: `license_key=eq.${licenseKey}`
              },
              (payload) => {
                console.log('📢 Announcement deleted:', payload.old);
                set(state => ({
                  announcements: state.announcements.filter(a => a.id !== payload.old.id),
                  unreadCount: state.announcements.find(a => a.id === payload.old.id && !a.is_read)
                    ? state.unreadCount - 1
                    : state.unreadCount
                }));
              }
            );

          await channel.subscribe();

          set({
            realtimeChannel: channel,
            isConnected: true
          });

          console.log('✅ Announcement real-time updates enabled for license:', licenseKey);

        } catch (error) {
          console.error('Failed to enable real-time updates:', error);
          set({ isConnected: false });
        }
      },

      disableRealtime: async () => {
        const { realtimeChannel } = get();

        if (realtimeChannel) {
          await supabase.removeChannel(realtimeChannel);
          set({
            realtimeChannel: null,
            isConnected: false
          });
          console.log('🔌 Announcement real-time updates disabled');
        }
      },

      getFilteredAnnouncements: () => {
        const { announcements, filters } = get();

        return announcements.filter(announcement => {
          // Priority filter
          if (filters.priority && announcement.priority !== filters.priority) {
            return false;
          }

          // Author role filter
          if (filters.author_role && announcement.author_role !== filters.author_role) {
            return false;
          }

          // Search term filter
          if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            if (
              !announcement.title.toLowerCase().includes(searchLower) &&
              !announcement.content.toLowerCase().includes(searchLower) &&
              !announcement.author_name?.toLowerCase().includes(searchLower)
            ) {
              return false;
            }
          }

          // Expired filter
          if (!filters.showExpired && announcement.expires_at) {
            const now = new Date();
            const expiresAt = new Date(announcement.expires_at);
            if (now > expiresAt) {
              return false;
            }
          }

          return true;
        });
      },

      updateLastVisit: () => {
        const now = new Date().toISOString();
        set({ lastVisit: now });
        localStorage.setItem('announcements_last_visit', now);
      },

      triggerNotification: (announcement: Announcement) => {
        // Check if notifications are enabled and permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          const notificationPrefs = JSON.parse(
            localStorage.getItem('notification_preferences') || '{}'
          );

          if (notificationPrefs.enabled && notificationPrefs[announcement.priority] !== false) {
            const { currentShowName } = get();

            new Notification(
              `${currentShowName || 'myK9Q'} - ${announcement.priority === 'urgent' ? '🚨 URGENT' : '📢'}`,
              {
                body: announcement.title,
                icon: '/icon-192x192.png',
                tag: `announcement-${announcement.id}`,
                requireInteraction: announcement.priority === 'urgent'
              }
            );
          }
        }
      },

      reset: () => {
        get().disableRealtime();
        set({
          announcements: [],
          unreadCount: 0,
          isLoading: false,
          error: null,
          lastVisit: null,
          realtimeChannel: null,
          isConnected: false,
          filters: {},
          currentLicenseKey: null,
          currentShowName: null
        });

        // Clear localStorage
        localStorage.removeItem('current_show_license');
        localStorage.removeItem('current_show_name');
        localStorage.removeItem('announcements_last_visit');
      }
    }),
    {
      name: 'announcement-store',
    }
  )
);