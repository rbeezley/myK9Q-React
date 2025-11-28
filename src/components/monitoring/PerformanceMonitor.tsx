/**
 * Performance Monitor Component
 *
 * Displays real-time FPS and memory usage for debugging performance issues.
 * Only enabled in development mode.
 */

import React, { useState, useEffect, useRef } from 'react';
import developerModeService from '@/services/developerMode';
import './shared-monitoring.css';

/**
 * Chrome-specific memory info interface
 * This is a non-standard API available only in Chrome
 */
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

export const PerformanceMonitor: React.FC = () => {
  const [fps, setFps] = useState(60);
  const [memory, setMemory] = useState({ used: 0, limit: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const frameCountRef = useRef(0);
  // eslint-disable-next-line react-hooks/purity
  const lastTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const config = developerModeService.getConfig();
    setIsVisible(config.enabled && (config.showFPS || config.showMemory));

    if (!config.enabled) {
      return;
    }

    // FPS Counter
    const measureFPS = () => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;

      // Update FPS every second
      if (elapsed >= 1000) {
        const currentFPS = Math.round((frameCountRef.current * 1000) / elapsed);
        setFps(currentFPS);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(measureFPS);
    };

    if (config.showFPS) {
      animationFrameRef.current = requestAnimationFrame(measureFPS);
    }

    // Memory Monitor
    let memoryInterval: NodeJS.Timeout | undefined;
    if (config.showMemory && 'memory' in performance) {
      const updateMemory = () => {
        const perfWithMemory = performance as PerformanceWithMemory;
        const mem = perfWithMemory.memory;
        if (mem) {
          setMemory({
            used: Math.round(mem.usedJSHeapSize / 1048576), // Convert to MB
            limit: Math.round(mem.jsHeapSizeLimit / 1048576),
          });
        }
      };

      updateMemory();
      memoryInterval = setInterval(updateMemory, 1000);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (memoryInterval) {
        clearInterval(memoryInterval);
      }
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  const config = developerModeService.getConfig();
  const fpsColor = fps >= 55 ? '#10b981' : fps >= 30 ? '#f59e0b' : '#ef4444';
  const memoryPercent = memory.limit > 0 ? (memory.used / memory.limit) * 100 : 0;
  const memoryColor = memoryPercent < 70 ? '#10b981' : memoryPercent < 85 ? '#f59e0b' : '#ef4444';

  return (
    <div className="performance-monitor">
      {config.showFPS && (
        <div className="perf-metric" style={{ borderLeft: `3px solid ${fpsColor}` }}>
          <div className="perf-label">FPS</div>
          <div className="perf-value" style={{ color: fpsColor }}>
            {fps}
          </div>
        </div>
      )}

      {config.showMemory && 'memory' in performance && (
        <div className="perf-metric" style={{ borderLeft: `3px solid ${memoryColor}` }}>
          <div className="perf-label">Memory</div>
          <div className="perf-value" style={{ color: memoryColor }}>
            {memory.used} MB
          </div>
          <div className="perf-sublabel">
            {memoryPercent.toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
};
