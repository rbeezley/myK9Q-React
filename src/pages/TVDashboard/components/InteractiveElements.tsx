import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, Settings, Maximize2, Minimize2, Volume2, VolumeX, Sun, Moon } from 'lucide-react';

interface InteractiveElementsProps {
  onToggleFullscreen?: () => void;
  onToggleTheme?: () => void;
  onToggleSound?: () => void;
  onToggleDetails?: () => void;
  isFullscreen?: boolean;
  isDarkTheme?: boolean;
  isSoundEnabled?: boolean;
  showDetailedView?: boolean;
  className?: string;
}

export const InteractiveElements: React.FC<InteractiveElementsProps> = ({
  onToggleFullscreen,
  onToggleTheme,
  onToggleSound,
  onToggleDetails,
  isFullscreen = false,
  isDarkTheme = true,
  isSoundEnabled = false,
  showDetailedView = true,
  className = ''
}) => {
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);

  // Auto-hide controls after 3 seconds of inactivity
  const resetHideTimeout = useCallback(() => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }

    const timeout = setTimeout(() => {
      setIsControlsVisible(false);
    }, 3000);

    setHideTimeout(timeout);
  }, [hideTimeout]);

  // Show controls on interaction
  const showControls = useCallback(() => {
    setIsControlsVisible(true);
    resetHideTimeout();
  }, [resetHideTimeout]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'f':
          e.preventDefault();
          onToggleFullscreen?.();
          showControls();
          break;
        case 't':
          e.preventDefault();
          onToggleTheme?.();
          showControls();
          break;
        case 'm':
          e.preventDefault();
          onToggleSound?.();
          showControls();
          break;
        case 'd':
          e.preventDefault();
          onToggleDetails?.();
          showControls();
          break;
        case 'h':
        case '?':
          e.preventDefault();
          showControls();
          break;
        case 'escape':
          setIsControlsVisible(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onToggleFullscreen, onToggleTheme, onToggleSound, onToggleDetails, showControls]);

  // Mouse/touch interactions
  useEffect(() => {
    const handleMouseMove = () => showControls();
    const handleTouchStart = () => showControls();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchstart', handleTouchStart);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, [showControls]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [hideTimeout]);

  const controlButtons = [
    {
      id: 'details',
      icon: showDetailedView ? Eye : EyeOff,
      label: showDetailedView ? 'Hide Details' : 'Show Details',
      shortcut: 'D',
      active: showDetailedView,
      onClick: onToggleDetails
    },
    {
      id: 'sound',
      icon: isSoundEnabled ? Volume2 : VolumeX,
      label: isSoundEnabled ? 'Mute Sound' : 'Enable Sound',
      shortcut: 'M',
      active: isSoundEnabled,
      onClick: onToggleSound
    },
    {
      id: 'theme',
      icon: isDarkTheme ? Sun : Moon,
      label: isDarkTheme ? 'Light Theme' : 'Dark Theme',
      shortcut: 'T',
      active: isDarkTheme,
      onClick: onToggleTheme
    },
    {
      id: 'fullscreen',
      icon: isFullscreen ? Minimize2 : Maximize2,
      label: isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen',
      shortcut: 'F',
      active: isFullscreen,
      onClick: onToggleFullscreen
    }
  ];

  return (
    <div className={`interactive-elements ${className}`}>
      {/* Control Toggle Button */}
      <button
        className={`controls-toggle ${isControlsVisible ? 'active' : ''}`}
        onClick={() => setIsControlsVisible(!isControlsVisible)}
        onMouseEnter={showControls}
        title="Show/Hide Controls (H)"
      >
        <Settings className="settings-icon" />
        {isControlsVisible ? (
          <ChevronUp className="toggle-icon" />
        ) : (
          <ChevronDown className="toggle-icon" />
        )}
      </button>

      {/* Interactive Controls Panel */}
      <div className={`controls-panel ${isControlsVisible ? 'visible' : ''}`}>
        <div className="controls-header">
          <span className="controls-title">Dashboard Controls</span>
          <span className="controls-hint">Press H for shortcuts</span>
        </div>

        <div className="controls-grid">
          {controlButtons.map(button => {
            const IconComponent = button.icon;
            return (
              <button
                key={button.id}
                className={`control-button ${button.active ? 'active' : ''}`}
                onClick={button.onClick}
                onMouseEnter={resetHideTimeout}
                title={`${button.label} (${button.shortcut})`}
                disabled={!button.onClick}
              >
                <IconComponent className="control-icon" />
                <span className="control-label">{button.label}</span>
                <span className="control-shortcut">{button.shortcut}</span>
              </button>
            );
          })}
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="shortcuts-help">
          <div className="help-title">Keyboard Shortcuts:</div>
          <div className="shortcuts-grid">
            <span className="shortcut-key">F</span>
            <span className="shortcut-action">Fullscreen</span>
            <span className="shortcut-key">T</span>
            <span className="shortcut-action">Theme</span>
            <span className="shortcut-key">M</span>
            <span className="shortcut-action">Sound</span>
            <span className="shortcut-key">D</span>
            <span className="shortcut-action">Details</span>
            <span className="shortcut-key">H</span>
            <span className="shortcut-action">Help</span>
            <span className="shortcut-key">ESC</span>
            <span className="shortcut-action">Hide</span>
          </div>
        </div>
      </div>

      {/* Background Overlay */}
      {isControlsVisible && (
        <div
          className="controls-overlay"
          onClick={() => setIsControlsVisible(false)}
        />
      )}
    </div>
  );
};

export default InteractiveElements;