/**
 * Pull to Refresh Component
 *
 * Native iOS/Android style pull-to-refresh interaction.
 * Works on both touch and desktop (drag).
 */

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import './PullToRefresh.css';

export interface PullToRefreshProps {
  /** Content to wrap */
  children: ReactNode;

  /** Callback when refresh is triggered */
  onRefresh: () => Promise<void>;

  /** Distance to pull before triggering (px) */
  threshold?: number;

  /** Maximum pull distance (px) */
  maxPullDistance?: number;

  /** Enable pull-to-refresh */
  enabled?: boolean;

  /** Custom refresh indicator */
  renderIndicator?: (state: PullState) => ReactNode;

  /** Container className */
  className?: string;
}

export type PullState = 'idle' | 'pulling' | 'ready' | 'refreshing' | 'complete';

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  maxPullDistance = 120,
  enabled = true,
  renderIndicator,
  className = '',
}: PullToRefreshProps) {
  const [pullState, setPullState] = useState<PullState>('idle');
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const isPullingRef = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container) return;

    // Only start if at top of scroll
    if (container.scrollTop > 0) return;

    startYRef.current = e.touches[0].pageY;
    currentYRef.current = startYRef.current;
    isPullingRef.current = true;
    setPullState('pulling');
  }, [enabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !isPullingRef.current || isRefreshing) return;

    const container = containerRef.current;
    if (!container) return;

    currentYRef.current = e.touches[0].pageY;
    const deltaY = currentYRef.current - startYRef.current;

    // Only pull down (positive deltaY)
    if (deltaY <= 0) {
      setPullState('idle');
      setPullDistance(0);
      return;
    }

    // Prevent default scroll when pulling
    if (container.scrollTop === 0 && deltaY > 0) {
      e.preventDefault();
    }

    // Apply resistance (harder to pull as you go further)
    const resistance = 0.5;
    const distance = Math.min(deltaY * resistance, maxPullDistance);

    setPullDistance(distance);

    // Update state based on distance
    if (distance >= threshold) {
      setPullState('ready');
    } else {
      setPullState('pulling');
    }
  }, [enabled, threshold, maxPullDistance, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || !isPullingRef.current || isRefreshing) return;

    isPullingRef.current = false;

    if (pullState === 'ready') {
      // Trigger refresh
      setPullState('refreshing');
      setPullDistance(threshold); // Lock at threshold
      setIsRefreshing(true);

      try {
        await onRefresh();
        setPullState('complete');

        // Show complete state briefly
        setTimeout(() => {
          setPullState('idle');
          setPullDistance(0);
          setIsRefreshing(false);
        }, 500);
      } catch (error) {
        console.error('[PullToRefresh] Refresh failed:', error);
        setPullState('idle');
        setPullDistance(0);
        setIsRefreshing(false);
      }
    } else {
      // Snap back
      setPullState('idle');
      setPullDistance(0);
    }
  }, [enabled, pullState, threshold, onRefresh, isRefreshing]);

  // Mouse events for desktop testing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    startYRef.current = e.pageY;
    currentYRef.current = startYRef.current;
    isPullingRef.current = true;
    setPullState('pulling');
  }, [enabled, isRefreshing]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!enabled || !isPullingRef.current || isRefreshing) return;

    currentYRef.current = e.pageY;
    const deltaY = currentYRef.current - startYRef.current;

    if (deltaY <= 0) {
      setPullState('idle');
      setPullDistance(0);
      return;
    }

    const resistance = 0.5;
    const distance = Math.min(deltaY * resistance, maxPullDistance);

    setPullDistance(distance);

    if (distance >= threshold) {
      setPullState('ready');
    } else {
      setPullState('pulling');
    }
  }, [enabled, threshold, maxPullDistance, isRefreshing]);

  const handleMouseUp = useCallback(async () => {
    if (!enabled || !isPullingRef.current || isRefreshing) return;

    isPullingRef.current = false;

    if (pullState === 'ready') {
      setPullState('refreshing');
      setPullDistance(threshold);
      setIsRefreshing(true);

      try {
        await onRefresh();
        setPullState('complete');

        setTimeout(() => {
          setPullState('idle');
          setPullDistance(0);
          setIsRefreshing(false);
        }, 500);
      } catch (error) {
        console.error('[PullToRefresh] Refresh failed:', error);
        setPullState('idle');
        setPullDistance(0);
        setIsRefreshing(false);
      }
    } else {
      setPullState('idle');
      setPullDistance(0);
    }
  }, [enabled, pullState, threshold, onRefresh, isRefreshing]);

  // Set up touch event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div
      ref={containerRef}
      className={`pull-to-refresh ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className={`pull-to-refresh-indicator ${pullState}`}
        style={{
          transform: `translateY(${pullDistance}px)`,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
      >
        {renderIndicator ? (
          renderIndicator(pullState)
        ) : (
          <DefaultRefreshIndicator state={pullState} distance={pullDistance} threshold={threshold} />
        )}
      </div>

      <div
        className="pull-to-refresh-content"
        style={{
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Default refresh indicator
 */
function DefaultRefreshIndicator({
  state,
  distance,
  threshold,
}: {
  state: PullState;
  distance: number;
  threshold: number;
}) {
  const progress = Math.min(distance / threshold, 1);
  const rotation = progress * 360;

  return (
    <div className="default-refresh-indicator">
      {state === 'refreshing' ? (
        <div className="spinner" />
      ) : state === 'complete' ? (
        <svg className="checkmark" viewBox="0 0 24 24">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className="arrow"
          viewBox="0 0 24 24"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 5v14M5 12l7 7 7-7"
          />
        </svg>
      )}

      <div className="refresh-text">
        {state === 'pulling' && 'Pull to refresh'}
        {state === 'ready' && 'Release to refresh'}
        {state === 'refreshing' && 'Refreshing...'}
        {state === 'complete' && 'Complete!'}
      </div>
    </div>
  );
}
