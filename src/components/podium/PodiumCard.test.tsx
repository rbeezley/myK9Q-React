// src/components/podium/PodiumCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PodiumCard } from './PodiumCard';

describe('PodiumCard', () => {
  const defaultProps = {
    className: 'Container Novice A',
    element: 'Container',
    level: 'Novice',
    section: 'A',
    placements: [
      { placement: 1 as const, handlerName: 'Sarah', dogName: 'Biscuit', breed: 'Golden' },
      { placement: 2 as const, handlerName: 'Tom', dogName: 'Pepper', breed: 'Border Collie' },
      { placement: 3 as const, handlerName: 'Linda', dogName: 'Mochi', breed: 'Shiba' },
      { placement: 4 as const, handlerName: 'David', dogName: 'Bruno', breed: 'GSD' },
    ],
  };

  it('renders class name in header', () => {
    render(<PodiumCard {...defaultProps} />);
    expect(screen.getByText('Container Novice A')).toBeInTheDocument();
  });

  it('renders element icon', () => {
    render(<PodiumCard {...defaultProps} />);
    // Container element should show box icon
    expect(screen.getByText('📦')).toBeInTheDocument();
  });

  it('renders all four placements', () => {
    render(<PodiumCard {...defaultProps} />);
    expect(screen.getByText('1st')).toBeInTheDocument();
    expect(screen.getByText('2nd')).toBeInTheDocument();
    expect(screen.getByText('3rd')).toBeInTheDocument();
    expect(screen.getByText('4th')).toBeInTheDocument();
  });

  it('renders all handler names', () => {
    render(<PodiumCard {...defaultProps} />);
    expect(screen.getByText('Sarah')).toBeInTheDocument();
    expect(screen.getByText('Tom')).toBeInTheDocument();
    expect(screen.getByText('Linda')).toBeInTheDocument();
    expect(screen.getByText('David')).toBeInTheDocument();
  });

  it('handles missing placements gracefully', () => {
    const props = {
      ...defaultProps,
      placements: [
        { placement: 1 as const, handlerName: 'Sarah', dogName: 'Biscuit', breed: 'Golden' },
      ],
    };
    render(<PodiumCard {...props} />);
    expect(screen.getByText('1st')).toBeInTheDocument();
    expect(screen.queryByText('2nd')).not.toBeInTheDocument();
  });

  it('renders Interior element icon', () => {
    render(<PodiumCard {...defaultProps} element="Interior" />);
    expect(screen.getByText('🏠')).toBeInTheDocument();
  });

  it('renders Exterior element icon', () => {
    render(<PodiumCard {...defaultProps} element="Exterior" />);
    expect(screen.getByText('🌲')).toBeInTheDocument();
  });

  it('renders Buried element icon', () => {
    render(<PodiumCard {...defaultProps} element="Buried" />);
    expect(screen.getByText('🦴')).toBeInTheDocument();
  });

  it('renders Handler Discrimination element icon', () => {
    render(<PodiumCard {...defaultProps} element="Handler Discrimination" />);
    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  describe('animation', () => {
    it('does not apply animate class by default', () => {
      const { container } = render(<PodiumCard {...defaultProps} />);
      expect(container.querySelector('.podium-card--animate')).not.toBeInTheDocument();
    });

    it('applies animate class when animate prop is true', () => {
      const { container } = render(<PodiumCard {...defaultProps} animate={true} />);
      expect(container.querySelector('.podium-card--animate')).toBeInTheDocument();
    });

    it('passes animate prop to child PodiumPosition components', () => {
      const { container } = render(<PodiumCard {...defaultProps} animate={true} />);
      const positions = container.querySelectorAll('.podium-position--animate');
      expect(positions.length).toBe(4);
    });

    it('does not animate children when animate is false', () => {
      const { container } = render(<PodiumCard {...defaultProps} animate={false} />);
      const positions = container.querySelectorAll('.podium-position--animate');
      expect(positions.length).toBe(0);
    });
  });
});
