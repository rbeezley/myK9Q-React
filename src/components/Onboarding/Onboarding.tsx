import React, { useState } from 'react';
import { Heart, CheckCircle, Bell, Clock, ChevronRight } from 'lucide-react';
import './Onboarding.css';

interface OnboardingProps {
  onComplete: () => void;
}

interface OnboardingScreen {
  id: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}

const screens: OnboardingScreen[] = [
  {
    id: 1,
    icon: Heart,
    title: 'Favorite Your Dogs',
    description: 'Mark your dog as a favorite to find them easily and receive run order notifications.',
    color: '#ef4444'
  },
  {
    id: 2,
    icon: CheckCircle,
    title: 'Self Check-In',
    description: 'Check in your dog and view results in real-time without waiting in line.',
    color: '#10b981'
  },
  {
    id: 3,
    icon: Bell,
    title: 'Stay Updated',
    description: 'Receive important announcements and updates throughout the event.',
    color: '#3b82f6'
  },
  {
    id: 4,
    icon: Clock,
    title: 'Track Class Status',
    description: 'Monitor class progress with real-time status updates for briefings, breaks, and start times.',
    color: '#f59e0b'
  }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    }
    if (isRightSwipe && currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    onComplete();
  };

  const screen = screens[currentScreen];
  const IconComponent = screen.icon;
  const isLastScreen = currentScreen === screens.length - 1;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">
        {/* Skip Button */}
        <button className="onboarding-skip" onClick={handleComplete}>
          Skip
        </button>

        {/* Screen Content */}
        <div
          className="onboarding-content"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Logo */}
          <div className="onboarding-logo-container">
            <div
              className="onboarding-logo"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              }}
            >
              <img
                src="/myK9Q-logo-white.png"
                alt="myK9Q Logo"
                className="onboarding-logo-img"
              />
            </div>
          </div>

          {/* Icon */}
          <div
            className="onboarding-icon"
            style={{ backgroundColor: screen.color }}
          >
            <IconComponent className="onboarding-icon-svg" />
          </div>

          {/* Title & Description */}
          <h2 className="onboarding-title">{screen.title}</h2>
          <p className="onboarding-description">{screen.description}</p>

          {/* Progress Dots */}
          <div className="onboarding-dots">
            {screens.map((_, index) => (
              <button
                key={index}
                className={`onboarding-dot ${index === currentScreen ? 'active' : ''}`}
                onClick={() => setCurrentScreen(index)}
                aria-label={`Go to screen ${index + 1}`}
              />
            ))}
          </div>

          {/* Next/Get Started Button */}
          <button className="onboarding-button" onClick={handleNext}>
            {isLastScreen ? (
              <>Get Started</>
            ) : (
              <>
                Next
                <ChevronRight className="onboarding-button-icon" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
