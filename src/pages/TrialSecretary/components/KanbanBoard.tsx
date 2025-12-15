/**
 * Kanban Board Component
 *
 * A drag-and-drop task management board with three columns:
 * - To Do
 * - In Progress
 * - Done
 */

import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Circle, PlayCircle, CheckCircle } from 'lucide-react';
import { useKanbanBoard } from '../hooks/useKanbanBoard';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { TaskDialog } from './TaskDialog';
import type { KanbanTask, KanbanStatus } from '../types';

const COLUMNS: { id: KanbanStatus; title: string; icon: React.ReactNode }[] = [
  { id: 'todo', title: 'To Do', icon: <Circle size={16} /> },
  { id: 'in-progress', title: 'In Progress', icon: <PlayCircle size={16} /> },
  { id: 'done', title: 'Done', icon: <CheckCircle size={16} /> },
];

export function KanbanBoard() {
  const { tasks, addTask, updateTask, deleteTask, moveTask } = useKanbanBoard();
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);

  // Configure sensors for drag detection
  // Matches EntryList patterns: PointerSensor with 8px activation, TouchSensor with 250ms delay
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const targetColumn = COLUMNS.find(col => col.id === overId);
    if (targetColumn) {
      moveTask(activeId, targetColumn.id);
      return;
    }

    // Check if dropped on another task
    const overTask = tasks.find(t => t.id === overId);
    if (overTask) {
      moveTask(activeId, overTask.status);
    }
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleEditTask = (task: KanbanTask) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleSaveTask = (taskData: Partial<KanbanTask>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData as Omit<KanbanTask, 'id' | 'createdAt' | 'updatedAt'>);
    }
    setDialogOpen(false);
    setEditingTask(null);
  };

  const getTasksByStatus = (status: KanbanStatus) =>
    tasks.filter(task => task.status === status);

  return (
    <div className="kanban-container">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {COLUMNS.map(column => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              icon={column.icon}
              count={columnTasks.length}
              onAddTask={column.id === 'todo' ? handleAddTask : undefined}
            >
              <SortableContext
                items={columnTasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {columnTasks.map(task => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    onEdit={() => handleEditTask(task)}
                    onDelete={() => deleteTask(task.id)}
                  />
                ))}
              </SortableContext>
            </KanbanColumn>
          );
        })}

        <DragOverlay>
          {activeTask ? (
            <KanbanCard task={activeTask} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        task={editingTask}
      />
    </div>
  );
}
