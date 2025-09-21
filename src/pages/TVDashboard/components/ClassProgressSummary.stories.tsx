import React from 'react';
import { ClassProgressSummary } from './ClassProgressSummary';
import type { ClassInfo } from '../hooks/useTVData';

// Mock data for testing the redesigned class progress cards
const mockClassData: ClassInfo[] = [
  {
    id: 1,
    class_name: 'Master Interior',
    element_type: 'INTERIOR',
    judge_name: 'Dr. Mary Quinn',
    status: 'in-progress',
    level: 'Master',
    entry_total_count: 25,
    entry_completed_count: 18,
    start_time: '2025-09-18T09:00:00Z',
  },
  {
    id: 2,
    class_name: 'Master Container',
    element_type: 'CONTAINER',
    judge_name: 'Silke Satzinger',
    status: 'in-progress',
    level: 'Master',
    entry_total_count: 22,
    entry_completed_count: 3,
    start_time: '2025-09-18T10:30:00Z',
  },
  {
    id: 3,
    class_name: 'Excellent Exterior',
    element_type: 'EXTERIOR',
    judge_name: 'John Smith',
    status: 'in-progress',
    level: 'Excellent',
    entry_total_count: 18,
    entry_completed_count: 18,
    start_time: '2025-09-18T11:00:00Z',
  },
  {
    id: 4,
    class_name: 'Advanced Buried',
    element_type: 'BURIED',
    judge_name: 'Sarah Johnson',
    status: 'in-progress',
    level: 'Advanced',
    entry_total_count: 15,
    entry_completed_count: 7,
    start_time: '2025-09-18T13:00:00Z',
  },
  {
    id: 5,
    class_name: 'Master HD Challenge',
    element_type: 'HD_CHALLENGE',
    judge_name: 'Mike Rodriguez',
    status: 'in-progress',
    level: 'Master',
    entry_total_count: 12,
    entry_completed_count: 1,
    start_time: '2025-09-18T14:30:00Z',
  },
];

const mockEntries = [
  { id: 1, element: 'INTERIOR', checkin_status: 1 },
  { id: 2, element: 'INTERIOR', checkin_status: 1 },
  { id: 3, element: 'INTERIOR', checkin_status: 0 },
  { id: 4, element: 'CONTAINER', checkin_status: 1 },
  { id: 5, element: 'CONTAINER', checkin_status: 1 },
  { id: 6, element: 'CONTAINER', checkin_status: 1 },
  { id: 7, element: 'EXTERIOR', checkin_status: 1 },
  { id: 8, element: 'EXTERIOR', checkin_status: 1 },
  { id: 9, element: 'BURIED', checkin_status: 1 },
  { id: 10, element: 'HD_CHALLENGE', checkin_status: 0 },
];

export default {
  title: 'TV Dashboard/Class Progress Summary',
  component: ClassProgressSummary,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1d23' },
        { name: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
      ]
    }
  }
};

export const WithActiveClasses = () => (
  <div style={{
    height: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '2rem'
  }}>
    <ClassProgressSummary
      inProgressClasses={mockClassData}
      entries={mockEntries}
    />
  </div>
);

export const EmptyState = () => (
  <div style={{
    height: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '2rem'
  }}>
    <ClassProgressSummary
      inProgressClasses={[]}
      entries={[]}
    />
  </div>
);

export const SingleClass = () => (
  <div style={{
    height: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '2rem'
  }}>
    <ClassProgressSummary
      inProgressClasses={[mockClassData[0]]}
      entries={mockEntries.slice(0, 3)}
    />
  </div>
);

export const ManyClasses = () => (
  <div style={{
    height: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '2rem'
  }}>
    <ClassProgressSummary
      inProgressClasses={[...mockClassData, ...mockClassData.map(c => ({ ...c, id: c.id + 10 }))]}
      entries={mockEntries}
    />
  </div>
);