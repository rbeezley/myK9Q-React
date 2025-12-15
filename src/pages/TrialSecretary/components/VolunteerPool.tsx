/**
 * Volunteer Pool Component
 *
 * Displays available volunteers that can be dragged to assignments.
 */

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Plus, User, Pencil, Trash2 } from 'lucide-react';
import type { Volunteer } from '../types';

interface VolunteerPoolProps {
  volunteers: Volunteer[];
  onAddVolunteer: () => void;
  onEditVolunteer: (volunteer: Volunteer) => void;
  onDeleteVolunteer: (volunteerId: string) => void;
}

export function VolunteerPool({
  volunteers,
  onAddVolunteer,
  onEditVolunteer,
  onDeleteVolunteer,
}: VolunteerPoolProps) {
  return (
    <div className="volunteer-pool">
      <div className="volunteer-pool-header">
        <h3 className="volunteer-pool-title">Available Volunteers</h3>
        <span className="volunteer-pool-count">{volunteers.length}</span>
      </div>

      <div className="volunteer-pool-content">
        {volunteers.map((volunteer) => (
          <DraggableVolunteerCard
            key={volunteer.id}
            volunteer={volunteer}
            onEdit={() => onEditVolunteer(volunteer)}
            onDelete={() => onDeleteVolunteer(volunteer.id)}
          />
        ))}

        <button className="volunteer-add-button" onClick={onAddVolunteer}>
          <Plus size={16} />
          <span>Add Volunteer</span>
        </button>
      </div>
    </div>
  );
}

interface DraggableVolunteerCardProps {
  volunteer: Volunteer;
  onEdit: () => void;
  onDelete: () => void;
}

function DraggableVolunteerCard({
  volunteer,
  onEdit,
  onDelete,
}: DraggableVolunteerCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: volunteer.id,
  });

  const [showActions, setShowActions] = React.useState(false);

  return (
    <div
      ref={setNodeRef}
      className={`volunteer-card ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <User size={16} className="volunteer-card-icon" />
      <span className="volunteer-card-name">{volunteer.name}</span>
      {volunteer.isExhibitor && (
        <span className="volunteer-card-badge">Exhibitor</span>
      )}

      {showActions && (
        <div className="volunteer-card-actions">
          <button
            className="volunteer-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Edit"
          >
            <Pencil size={12} />
          </button>
          <button
            className="volunteer-action-btn delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
