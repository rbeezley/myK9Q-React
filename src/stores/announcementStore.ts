import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { serviceWorkerManager } from '../utils/serviceWorkerUtils';
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
  isInitializing: boolean; // Lock to prevent concurrent initialization

  // Actions
  setLicenseKey: (licenseKey: string, showName?: string) => void;
  fetchAnnouncements: (licenseKey?: string, forceRefresh?: boolean) => Promise<void>;
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
  reset: () => void;
  cleanup: () => void; // NEW: Explicit cleanup for component unmount
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

// Announcement cache helpers
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

interface AnnouncementCache {
  data: Announcement[];
  timestamp: number;
  licenseKey: string;
}

const getCachedAnnouncements = (licenseKey: string): Announcement[] | null => {
  try {
    const cached = localStorage.getItem(`announcements_cache_${licenseKey}`);
    if (!cached) return null;

    const cache: AnnouncementCache = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still fresh
    if (now - cache.timestamp < CACHE_TTL && cache.licenseKey === licenseKey) {
      console.log('📦 Using cached announcements (age:', Math.round((now - cache.timestamp) / 1000), 'seconds)');
      return cache.data;
    }

    console.log('📦 Cache expired (age:', Math.round((now - cache.timestamp) / 1000), 'seconds)');
    return null;
  } catch (error) {
    console.error('Error reading announcement cache:', error);
    return null;
  }
};

const setCachedAnnouncements = (licenseKey: string, data: Announcement[]): void => {
  try {
    const cache: AnnouncementCache = {
      data,
      timestamp: Date.now(),
      licenseKey
    };
    localStorage.setItem(`announcements_cache_${licenseKey}`, JSON.stringify(cache));
    console.log('📦 Cached', data.length, 'announcements');
  } catch (error) {
    console.error('Error caching announcements:', error);
  }
};

const clearAnnouncementCache = (licenseKey: string): void => {
  try {
    localStorage.removeItem(`announcements_cache_${licenseKey}`);
    console.log('📦 Cleared announcement cache');
  } catch (error) {
    console.error('Error clearing announcement cache:', error);
  }
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
      isInitializing: false,

      setLicenseKey: (licenseKey: string, showName?: string) => {
        const current = get();

        console.log('🔑 setLicenseKey called with:', { licenseKey, showName, currentLicenseKey: current.currentLicenseKey, isInitializing: current.isInitializing, isLoading: current.isLoading });

        // Guard: Don't refetch if license key hasn't changed
        if (current.currentLicenseKey === licenseKey) {
          console.log('✋ License key unchanged, skipping fetch');
          return;
        }

        // Guard: Don't allow concurrent calls
        if (current.isLoading) {
          console.log('✋ Already loading announcements, skipping duplicate call');
          return;
        }

        // Guard: Prevent concurrent initialization
        if (current.isInitializing) {
          console.log('✋ Already initializing announcements, skipping duplicate call');
          return;
        }

        // Guard: If we have an active channel for this license, we're already set up
        if (current.realtimeChannel && current.isConnected) {
          const _channelName = `announcements-${licenseKey}`;
          // Check if the existing channel matches the requested license key
          if (current.realtimeChannel.topic.includes(licenseKey)) {
            console.log('✋ Already connected to announcement channel for this license key, skipping');
            return;
          }
        }

        console.log('✅ Proceeding with setLicenseKey');

        // Set initialization lock AND license key synchronously to prevent race conditions
        set({
          isInitializing: true,
          currentLicenseKey: licenseKey,
          currentShowName: showName || null
        });

        // If switching to different license key, clean up
        if (current.currentLicenseKey && current.currentLicenseKey !== licenseKey) {
          current.disableRealtime();
          set({ announcements: [], unreadCount: 0 });
        }

        // Store in localStorage for persistence
        localStorage.setItem('current_show_license', licenseKey);
        if (showName) {
          localStorage.setItem('current_show_name', showName);
        }

        // Update service worker with license key for tenant isolation
        serviceWorkerManager.updateLicenseKey(licenseKey);

        // Auto-fetch announcements for new license
        Promise.all([
          get().fetchAnnouncements(licenseKey),
          get().enableRealtime(licenseKey)
        ]).finally(() => {
          // Clear initialization lock after both operations complete
          set({ isInitializing: false });
        });
      },

      fetchAnnouncements: async (licenseKey?: string, forceRefresh = false) => {
        const targetLicenseKey = licenseKey || get().currentLicenseKey;
        if (!targetLicenseKey) {
          set({ error: 'No license key provided' });
          return;
        }

        // Check cache first unless force refresh
        if (!forceRefresh) {
          const cached = getCachedAnnouncements(targetLicenseKey);
          if (cached) {
            // Still need to get read status for current user
            const userIdentifier = generateUserIdentifier();
            const { data: reads } = await supabase
              .from('announcement_reads')
              .select('announcement_id')
              .eq('user_identifier', userIdentifier)
              .eq('license_key', targetLicenseKey);

            const readIds = new Set(reads?.map(r => r.announcement_id) || []);

            // Mark announcements as read/unread
            const announcementsWithReadStatus = cached.map(announcement => ({
              ...announcement,
              is_read: readIds.has(announcement.id)
            }));

            // Calculate unread count
            const unreadCount = announcementsWithReadStatus.filter(a => !a.is_read).length;

            set({
              announcements: announcementsWithReadStatus,
              unreadCount,
              isLoading: false
            });
            return;
          }
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

          // Cache the raw announcements
          if (announcements) {
            setCachedAnnouncements(targetLicenseKey, announcements);
          }

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

          // Invalidate cache
          clearAnnouncementCache(currentLicenseKey);

          // Add to local state
          set(state => ({
            announcements: [{ ...data, is_read: false }, ...state.announcements],
            unreadCount: state.unreadCount + 1
          }));

          // Push notification is now handled by database trigger (Migration 019)
          // No need to send manually from client

        } catch (error) {
          console.error('Error creating announcement:', error);
          throw error;
        }
      },

      updateAnnouncement: async (id, updates) => {
        const { currentLicenseKey } = get();

        try {
          const { data, error } = await supabase
            .from('announcements')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          // Invalidate cache
          if (currentLicenseKey) {
            clearAnnouncementCache(currentLicenseKey);
          }

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
        const { currentLicenseKey } = get();

        try {
          const { error } = await supabase
            .from('announcements')
            .update({ is_active: false })
            .eq('id', id);

          if (error) throw error;

          // Invalidate cache
          if (currentLicenseKey) {
            clearAnnouncementCache(currentLicenseKey);
          }

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

                // Push notification is handled by database trigger (Migration 019)
                // Real-time subscription only updates UI state
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
      },

      cleanup: () => {
        // Explicit cleanup method for component unmount
        // Only disables realtime, doesn't clear data (for navigation)
        const { realtimeChannel } = get();

        if (realtimeChannel) {
          console.log('🧹 Cleaning up announcement subscriptions');
          get().disableRealtime();
        }

        // Clear initialization lock if stuck
        if (get().isInitializing) {
          console.log('🧹 Clearing stuck initialization lock');
          set({ isInitializing: false });
        }
      }
    }),
    {
      name: 'announcement-store',
    }
  )
);