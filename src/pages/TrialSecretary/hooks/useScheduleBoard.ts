/**
 * Schedule Board Hook
 *
 * Manages steward schedule state with localStorage persistence.
 * Fetches class data from the trial for scheduling context.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import type {
  ScheduleRole,
  Volunteer,
  ClassAssignment,
  GeneralAssignment,
  ScheduleState,
  ClassInfo,
} from '../types';

const STORAGE_KEY_PREFIX = 'myK9Q-schedule-';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useScheduleBoard() {
  const { showContext } = useAuth();
  const storageKey = `${STORAGE_KEY_PREFIX}${showContext?.licenseKey || 'default'}`;

  // Class data from Supabase
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Schedule state (persisted to localStorage)
  const [roles, setRoles] = useState<ScheduleRole[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [classAssignments, setClassAssignments] = useState<ClassAssignment[]>([]);
  const [generalAssignments, setGeneralAssignments] = useState<GeneralAssignment[]>([]);

  // Load schedule state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const state = JSON.parse(stored);
        setRoles(state.roles || getDefaultRoles());
        setVolunteers(state.volunteers || []);
        setClassAssignments(state.classAssignments || []);
        // Migrate old generalAssignments format (volunteerId -> volunteerIds)
        const migratedGeneralAssignments = (state.generalAssignments || []).map((a: any) => {
          if ('volunteerId' in a && !('volunteerIds' in a)) {
            // Old format: convert volunteerId to volunteerIds array
            return {
              id: a.id,
              roleId: a.roleId,
              volunteerIds: a.volunteerId ? [a.volunteerId] : [],
              description: a.description,
              timeRange: a.timeRange,
            } as GeneralAssignment;
          }
          return a as GeneralAssignment;
        });
        setGeneralAssignments(migratedGeneralAssignments);
      } else {
        // Initialize with default roles
        setRoles(getDefaultRoles());
      }
    } catch (error) {
      console.error('[useScheduleBoard] Failed to load from localStorage:', error);
      setRoles(getDefaultRoles());
    }
  }, [storageKey]);

  // Save schedule state to localStorage
  useEffect(() => {
    // Skip initial save before data is loaded
    if (roles.length === 0) return;

    try {
      const state: ScheduleState = {
        roles,
        volunteers,
        classAssignments,
        generalAssignments,
        lastModified: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('[useScheduleBoard] Failed to save to localStorage:', error);
    }
  }, [roles, volunteers, classAssignments, generalAssignments, storageKey]);

  // Fetch class data from Supabase
  useEffect(() => {
    async function fetchClasses() {
      if (!showContext?.licenseKey) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // First get the show ID from license_key
        const { data: showData, error: showError } = await supabase
          .from('shows')
          .select('id')
          .eq('license_key', showContext.licenseKey)
          .single();

        if (showError || !showData) {
          console.error('[useScheduleBoard] Failed to find show:', showError);
          setClasses([]);
          setIsLoading(false);
          return;
        }

        // Get trials for this show
        const { data: trials, error: trialsError } = await supabase
          .from('trials')
          .select('id')
          .eq('show_id', showData.id);

        if (trialsError) throw trialsError;

        if (!trials || trials.length === 0) {
          setClasses([]);
          setIsLoading(false);
          return;
        }

        const trialIds = trials.map(t => t.id);

        // Fetch classes for all trials with trial info
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select(`
            id, element, level, section, judge_name, planned_start_time, class_status, class_order,
            trials!inner(trial_date, trial_number)
          `)
          .in('trial_id', trialIds)
          .order('class_order', { ascending: true });

        if (classesError) throw classesError;

        // Get entry counts for each class
        const classesWithCounts: ClassInfo[] = await Promise.all(
          (classesData || []).map(async (cls) => {
            const { count } = await supabase
              .from('entries')
              .select('*', { count: 'exact', head: true })
              .eq('class_id', cls.id);

            // Extract trial info from the joined data (Supabase returns single object for !inner join)
            const trialInfo = cls.trials as unknown as { trial_date: string; trial_number: number } | null;

            return {
              id: cls.id,
              element: cls.element,
              level: cls.level,
              section: cls.section,
              judge_name: cls.judge_name,
              planned_start_time: cls.planned_start_time,
              entry_count: count || 0,
              class_status: cls.class_status,
              trial_date: trialInfo?.trial_date,
              trial_number: trialInfo?.trial_number,
            };
          })
        );

        setClasses(classesWithCounts);
      } catch (error) {
        console.error('[useScheduleBoard] Failed to fetch classes:', error);
        setClasses([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchClasses();
  }, [showContext?.licenseKey]);

  // Volunteer management
  const addVolunteer = useCallback((data: Omit<Volunteer, 'id'>) => {
    const newVolunteer: Volunteer = {
      ...data,
      id: generateId(),
    };
    setVolunteers(prev => [...prev, newVolunteer]);
  }, []);

  const updateVolunteer = useCallback((id: string, updates: Partial<Volunteer>) => {
    setVolunteers(prev =>
      prev.map(v => (v.id === id ? { ...v, ...updates } : v))
    );
  }, []);

  const deleteVolunteer = useCallback((id: string) => {
    setVolunteers(prev => prev.filter(v => v.id !== id));
    // Also remove from class assignments
    setClassAssignments(prev =>
      prev.map(a => ({
        ...a,
        volunteerIds: a.volunteerIds.filter(vid => vid !== id),
      })).filter(a => a.volunteerIds.length > 0)
    );
    // Also remove from general assignments
    setGeneralAssignments(prev =>
      prev.map(a => ({
        ...a,
        volunteerIds: a.volunteerIds.filter(vid => vid !== id),
      })).filter(a => a.volunteerIds.length > 0)
    );
  }, []);

  // Class assignment management
  const assignToClass = useCallback((volunteerId: string, classId: number, roleId: string) => {
    setClassAssignments(prev => {
      const existing = prev.find(a => a.classId === classId && a.roleId === roleId);

      if (existing) {
        // Add to existing assignment if not already there
        if (existing.volunteerIds.includes(volunteerId)) {
          return prev;
        }
        return prev.map(a =>
          a.id === existing.id
            ? { ...a, volunteerIds: [...a.volunteerIds, volunteerId] }
            : a
        );
      }

      // Create new assignment
      const newAssignment: ClassAssignment = {
        id: generateId(),
        classId,
        roleId,
        volunteerIds: [volunteerId],
      };
      return [...prev, newAssignment];
    });
  }, []);

  const removeFromClass = useCallback((volunteerId: string, classId: number, roleId: string) => {
    setClassAssignments(prev =>
      prev.map(a => {
        if (a.classId === classId && a.roleId === roleId) {
          return {
            ...a,
            volunteerIds: a.volunteerIds.filter(id => id !== volunteerId),
          };
        }
        return a;
      }).filter(a => a.volunteerIds.length > 0)
    );
  }, []);

  // General duty management (similar to class assignments)
  const assignToGeneralDuty = useCallback((volunteerId: string, roleId: string) => {
    setGeneralAssignments(prev => {
      const existing = prev.find(a => a.roleId === roleId);

      if (existing) {
        // Add to existing assignment if not already there
        if (existing.volunteerIds.includes(volunteerId)) {
          return prev;
        }
        return prev.map(a =>
          a.id === existing.id
            ? { ...a, volunteerIds: [...a.volunteerIds, volunteerId] }
            : a
        );
      }

      // Create new assignment
      const newAssignment: GeneralAssignment = {
        id: generateId(),
        roleId,
        volunteerIds: [volunteerId],
      };
      return [...prev, newAssignment];
    });
  }, []);

  const removeFromGeneralDuty = useCallback((volunteerId: string, roleId: string) => {
    setGeneralAssignments(prev =>
      prev.map(a => {
        if (a.roleId === roleId) {
          return {
            ...a,
            volunteerIds: a.volunteerIds.filter(id => id !== volunteerId),
          };
        }
        return a;
      }).filter(a => a.volunteerIds.length > 0)
    );
  }, []);

  // Role management
  const updateRoles = useCallback((newRoles: ScheduleRole[]) => {
    setRoles(newRoles);
  }, []);

  return {
    classes,
    roles,
    volunteers,
    classAssignments,
    generalAssignments,
    isLoading,
    addVolunteer,
    updateVolunteer,
    deleteVolunteer,
    assignToClass,
    removeFromClass,
    assignToGeneralDuty,
    removeFromGeneralDuty,
    updateRoles,
  };
}

function getDefaultRoles(): ScheduleRole[] {
  return [
    { id: 'gate-steward', name: 'Gate Steward', color: '#3b82f6', isRingRole: true, isActive: true },
    { id: 'timer', name: 'Timer', color: '#10b981', isRingRole: true, isActive: true },
    { id: 'ring-steward', name: 'Ring Steward', color: '#8b5cf6', isRingRole: true, isActive: true },
    { id: 'hospitality', name: 'Hospitality', color: '#f59e0b', isRingRole: false, isActive: true },
    { id: 'equipment', name: 'Equipment/Supplies', color: '#ef4444', isRingRole: false, isActive: true },
    { id: 'ring-setup', name: 'Ring Setup', color: '#06b6d4', isRingRole: false, isActive: true },
    { id: 'ribbons', name: 'Ribbons', color: '#ec4899', isRingRole: false, isActive: true },
  ];
}
