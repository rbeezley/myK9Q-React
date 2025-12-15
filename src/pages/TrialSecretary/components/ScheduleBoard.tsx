/**
 * Schedule Board Component
 *
 * A class-based steward scheduling board with:
 * - Class assignments table (ring roles per class)
 * - General duties section (hospitality, equipment, etc.)
 * - Volunteer pool with drag-and-drop
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Users, Briefcase } from 'lucide-react';
import { useScheduleBoard } from '../hooks/useScheduleBoard';
import { VolunteerPool } from './VolunteerPool';
import { VolunteerChip } from './VolunteerChip';
import { VolunteerDialog } from './VolunteerDialog';
import { RoleConfigDialog } from './RoleConfigDialog';
import type { Volunteer, ClassInfo } from '../types';

interface ScheduleBoardProps {
  /** External trigger for actions (from header menu) */
  externalTrigger?: 'add-volunteer' | 'manage-roles' | null;
  /** Callback when trigger has been consumed */
  onTriggerConsumed?: () => void;
}

// Helper to format class name from components
function formatClassName(cls: ClassInfo): string {
  const parts = [cls.level];
  if (cls.section) parts.push(cls.section);
  parts.push(cls.element);
  return parts.join(' ');
}

// Helper to format trial identifier (e.g., "Saturday, September 16th, 2023, Trial 1")
function formatTrialId(cls: ClassInfo): string {
  if (!cls.trial_date) return '';

  const date = new Date(cls.trial_date + 'T00:00:00'); // Ensure consistent parsing
  const day = date.getDate();

  // Add ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
  const ordinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();
  const trialNum = cls.trial_number ? `, Trial ${cls.trial_number}` : '';

  return `${weekday}, ${month} ${ordinal(day)}, ${year}${trialNum}`;
}

export function ScheduleBoard({ externalTrigger, onTriggerConsumed }: ScheduleBoardProps) {
  const {
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
  } = useScheduleBoard();

  const [activeVolunteer, setActiveVolunteer] = useState<Volunteer | null>(null);
  const [volunteerDialogOpen, setVolunteerDialogOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [roleConfigOpen, setRoleConfigOpen] = useState(false);

  // Handle external triggers from header menu - intentional setState in effect
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (externalTrigger === 'add-volunteer') {
      setEditingVolunteer(null);
      setVolunteerDialogOpen(true);
      onTriggerConsumed?.();
    } else if (externalTrigger === 'manage-roles') {
      setRoleConfigOpen(true);
      onTriggerConsumed?.();
    }
  }, [externalTrigger, onTriggerConsumed]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Filter roles by type
  const ringRoles = useMemo(
    () => roles.filter(r => r.isRingRole && r.isActive),
    [roles]
  );
  const generalRoles = useMemo(
    () => roles.filter(r => !r.isRingRole && r.isActive),
    [roles]
  );

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const volunteer = volunteers.find(v => v.id === active.id);
    if (volunteer) {
      setActiveVolunteer(volunteer);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveVolunteer(null);

    if (!over) return;

    const volunteerId = active.id as string;
    const dropTarget = over.id as string;

    // Parse drop target: format is "class-{classId}-role-{roleId}" for class assignments
    const classMatch = dropTarget.match(/^class-(\d+)-role-(.+)$/);
    if (classMatch) {
      const classId = parseInt(classMatch[1], 10);
      const roleId = classMatch[2];
      assignToClass(volunteerId, classId, roleId);
      return;
    }

    // Parse drop target: format is "general-role-{roleId}" for general duties
    const generalMatch = dropTarget.match(/^general-role-(.+)$/);
    if (generalMatch) {
      const roleId = generalMatch[1];
      assignToGeneralDuty(volunteerId, roleId);
    }
  };

  // Check if volunteer has conflict with a class
  const hasConflict = (volunteer: Volunteer, classId: number): boolean => {
    return volunteer.enteredClassIds.includes(classId);
  };

  // Get volunteers assigned to a specific class/role
  const getAssignedVolunteers = (classId: number, roleId: string): Volunteer[] => {
    const assignment = classAssignments.find(
      a => a.classId === classId && a.roleId === roleId
    );
    if (!assignment) return [];
    return assignment.volunteerIds
      .map(id => volunteers.find(v => v.id === id))
      .filter((v): v is Volunteer => v !== undefined);
  };

  // Get volunteers assigned to a specific general duty role
  const getGeneralDutyVolunteers = (roleId: string): Volunteer[] => {
    const assignment = generalAssignments.find(a => a.roleId === roleId);
    if (!assignment) return [];
    return assignment.volunteerIds
      .map(id => volunteers.find(v => v.id === id))
      .filter((v): v is Volunteer => v !== undefined);
  };

  // Format planned start time
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return 'TBD';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <div className="schedule-container">
        <div className="empty-state">
          <p>Loading class data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-container">
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Volunteer Pool - Sticky at top */}
        <div className="volunteer-pool-sticky">
          <VolunteerPool
            volunteers={volunteers}
            onAddVolunteer={() => {
              setEditingVolunteer(null);
              setVolunteerDialogOpen(true);
            }}
            onEditVolunteer={(volunteer) => {
              setEditingVolunteer(volunteer);
              setVolunteerDialogOpen(true);
            }}
            onDeleteVolunteer={deleteVolunteer}
          />
        </div>

        {/* Scrollable content area */}
        <div className="schedule-scrollable-content">
          {/* General Duties Section */}
          <div className="schedule-table-wrapper general-duties-wrapper">
            <div className="schedule-section-header">
              <Briefcase size={18} />
              <span>General Duties</span>
            </div>

            {generalRoles.length === 0 ? (
              <div className="empty-state">
                <p>No general duty roles configured. Go to Manage Roles to add some.</p>
              </div>
            ) : (
              <table className="general-duties-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Assigned Volunteers</th>
                  </tr>
                </thead>
                <tbody>
                  {generalRoles.map(role => {
                    const assigned = getGeneralDutyVolunteers(role.id);
                    return (
                      <tr key={role.id} className="general-duty-row">
                        <td className="general-duty-role-name">
                          <span
                            className="role-color-dot"
                            style={{ backgroundColor: role.color }}
                          />
                          {role.name}
                        </td>
                        <td>
                          <DroppableCell
                            id={`general-role-${role.id}`}
                            classId={0}
                            roleId={role.id}
                          >
                            {assigned.map(volunteer => (
                              <VolunteerChip
                                key={volunteer.id}
                                volunteer={volunteer}
                                onRemove={() => removeFromGeneralDuty(volunteer.id, role.id)}
                              />
                            ))}
                          </DroppableCell>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Class Assignments Table */}
          <div className="schedule-table-wrapper">
            <div className="schedule-section-header">
              <Users size={18} />
              <span>Class Assignments</span>
            </div>

            {classes.length === 0 ? (
              <div className="empty-state">
                <p>No classes found for this trial.</p>
              </div>
            ) : (
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Judge</th>
                    {ringRoles.map(role => (
                      <th key={role.id}>{role.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classes.map(cls => (
                    <tr key={cls.id}>
                      <td>
                        <div className="schedule-class-info">
                          <span className="schedule-class-name">{formatClassName(cls)}</span>
                          <span className="schedule-class-meta">
                            <span className="schedule-trial-id">{formatTrialId(cls)}</span>
                            {cls.planned_start_time && (
                              <span className="schedule-class-time">{formatTime(cls.planned_start_time)}</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td>{cls.judge_name}</td>
                      {ringRoles.map(role => {
                        const assigned = getAssignedVolunteers(cls.id, role.id);
                        return (
                          <td key={role.id}>
                            <DroppableCell
                              id={`class-${cls.id}-role-${role.id}`}
                              classId={cls.id}
                              roleId={role.id}
                            >
                              {assigned.map(volunteer => (
                                <VolunteerChip
                                  key={volunteer.id}
                                  volunteer={volunteer}
                                  hasConflict={hasConflict(volunteer, cls.id)}
                                  onRemove={() => removeFromClass(volunteer.id, cls.id, role.id)}
                                />
                              ))}
                            </DroppableCell>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <DragOverlay modifiers={[snapCenterToCursor]}>
          {activeVolunteer ? (
            <VolunteerChip volunteer={activeVolunteer} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Dialogs */}
      <VolunteerDialog
        isOpen={volunteerDialogOpen}
        onClose={() => {
          setVolunteerDialogOpen(false);
          setEditingVolunteer(null);
        }}
        onSave={(data) => {
          if (editingVolunteer) {
            updateVolunteer(editingVolunteer.id, data);
          } else {
            addVolunteer(data);
          }
          setVolunteerDialogOpen(false);
          setEditingVolunteer(null);
        }}
        volunteer={editingVolunteer}
      />

      <RoleConfigDialog
        isOpen={roleConfigOpen}
        onClose={() => setRoleConfigOpen(false)}
        roles={roles}
        onSave={updateRoles}
      />
    </div>
  );
}

// Droppable Cell Component
import { useDroppable } from '@dnd-kit/core';

interface DroppableCellProps {
  id: string;
  classId: number;
  roleId: string;
  children: React.ReactNode;
}

function DroppableCell({ id, children }: DroppableCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`schedule-role-cell ${isOver ? 'drop-target' : ''}`}
    >
      {children}
    </div>
  );
}
