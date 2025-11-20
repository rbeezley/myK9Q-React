import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Users, Award, Shield,
  Cloud, ChevronRight, Timer, Bell, Settings, Wifi, Zap, UserCheck,
  BookOpen, Video, ExternalLink, ArrowRight
} from 'lucide-react';
import './Landing.css';

export function Landing() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="landing-page">
      {/* Hero Section with Diagonal Energy */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-diagonal"></div>
          <div className="hero-grid"></div>
        </div>

        <div className="hero-container">
          <div className="hero-layout">
            {/* Left Side - Content with Kinetic Typography */}
            <div className={`hero-content ${isVisible ? 'visible' : ''}`}>
              <div className="hero-badge">
                <Trophy className="badge-icon" />
                <span>2025 AKC Nationals</span>
              </div>

              <div className="hero-logo-section">
                <div className="logo-frame">
                  <img
                    src="/myK9Q-teal-192.png"
                    alt="myK9Q"
                    className="hero-logo"
                  />
                </div>
                <h1 className="hero-brand">myK9Q</h1>
              </div>

              {/* Kinetic Typography - Queue to Qualify */}
              <div className="hero-kinetic">
                <div className="kinetic-line">
                  <span className="kinetic-queue">Queue</span>
                  <div className="kinetic-arrow">
                    <ArrowRight className="arrow-icon" />
                  </div>
                  <span className="kinetic-qualify">Qualify</span>
                </div>
                <div className="kinetic-underline"></div>
              </div>

              <p className="hero-tagline">
                Precision scoring at ring side.<br />
                Real-time sync. Offline reliability.
              </p>

              <div className="hero-stats">
                <div className="stat-item">
                  <div className="stat-number">100+</div>
                  <div className="stat-label">Clubs</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <div className="stat-number">1000+</div>
                  <div className="stat-label">Events</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <div className="stat-number">99.9%</div>
                  <div className="stat-label">Uptime</div>
                </div>
              </div>

              <div className="hero-actions">
                <button onClick={handleGetStarted} className="btn-primary">
                  <span>Get Started</span>
                  <ChevronRight className="btn-icon" />
                </button>
              </div>

              <div className="hero-features-compact">
                <div className="feature-compact">
                  <UserCheck className="feature-icon-compact" />
                  <span>Self Check-in</span>
                </div>
                <div className="feature-compact">
                  <Zap className="feature-icon-compact" />
                  <span>Auto-Calculate</span>
                </div>
                <div className="feature-compact">
                  <Cloud className="feature-icon-compact" />
                  <span>Real-time</span>
                </div>
              </div>
            </div>

            {/* Right Side - Phone Mockup with Depth */}
            <div className={`hero-visual ${isVisible ? 'visible' : ''}`}>
              <div className="phone-frame">
                <div className="phone-screen">
                  <img
                    src="/home-page-screenshot.png"
                    alt="myK9Q App"
                    className="phone-screenshot"
                  />
                </div>
                <div className="phone-reflection"></div>
              </div>
              <div className="visual-accent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Section - Asymmetric Grid */}
      <section className="roles-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Built for every role</h2>
            <div className="title-accent"></div>
          </div>

          <div className="roles-grid">
            <div className="role-card role-large">
              <div className="role-number">01</div>
              <div className="role-icon-wrapper">
                <Award className="role-icon" />
              </div>
              <h3 className="role-title">Judges</h3>
              <ul className="role-features">
                <li>Multi-timer precision system</li>
                <li>Digital scoresheets (AKC/UKC)</li>
                <li>Quick fault marking</li>
                <li>Auto placement calculation</li>
              </ul>
            </div>

            <div className="role-card">
              <div className="role-number">02</div>
              <div className="role-icon-wrapper">
                <Users className="role-icon" />
              </div>
              <h3 className="role-title">Exhibitors</h3>
              <ul className="role-features">
                <li>Real-time results</li>
                <li>Push notifications</li>
                <li>Performance tracking</li>
                <li>Self check-in</li>
              </ul>
            </div>

            <div className="role-card">
              <div className="role-number">03</div>
              <div className="role-icon-wrapper">
                <Settings className="role-icon" />
              </div>
              <h3 className="role-title">Secretaries</h3>
              <ul className="role-features">
                <li>Complete show management</li>
                <li>Auto synchronization</li>
                <li>Instant exports</li>
                <li>Access control</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities - Icon Grid */}
      <section className="capabilities-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Enterprise-grade reliability</h2>
            <div className="title-accent"></div>
          </div>

          <div className="capabilities-grid">
            <div className="capability-card">
              <div className="capability-icon-bg">
                <Wifi className="capability-icon" />
              </div>
              <h4 className="capability-title">Offline First</h4>
              <p className="capability-desc">Works perfectly without internet. Syncs when connected.</p>
            </div>

            <div className="capability-card">
              <Cloud className="capability-icon" />
              <h4 className="capability-title">Cloud Sync</h4>
              <p className="capability-desc">Real-time synchronization across all devices.</p>
            </div>

            <div className="capability-card">
              <Timer className="capability-icon" />
              <h4 className="capability-title">Multi-Timer</h4>
              <p className="capability-desc">Precision timing with concurrent timers.</p>
            </div>

            <div className="capability-card">
              <Bell className="capability-icon" />
              <h4 className="capability-title">Notifications</h4>
              <p className="capability-desc">Instant alerts for class changes and results.</p>
            </div>

            <div className="capability-card">
              <Trophy className="capability-icon" />
              <h4 className="capability-title">AKC & UKC</h4>
              <p className="capability-desc">All major organization formats supported.</p>
            </div>

            <div className="capability-card">
              <Shield className="capability-icon" />
              <h4 className="capability-title">Secure</h4>
              <p className="capability-desc">Role-based permissions and authentication.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="resources-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Learn myK9Q</h2>
            <div className="title-accent"></div>
          </div>

          <div className="resources-grid">
            <a
              href="https://myk9t.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="resource-card"
            >
              <div className="resource-icon-frame">
                <BookOpen className="resource-icon" />
              </div>
              <div className="resource-content">
                <h3 className="resource-title">User Guide</h3>
                <p className="resource-desc">
                  Complete documentation and tutorials
                </p>
              </div>
              <ExternalLink className="resource-arrow" />
            </a>

            <a
              href="https://www.youtube.com/watch?v=WRaKZnFPtmI&list=PL6PN3duVGm8-WDKvOobppaZC7Mc_13Xdj"
              target="_blank"
              rel="noopener noreferrer"
              className="resource-card"
            >
              <div className="resource-icon-frame">
                <Video className="resource-icon" />
              </div>
              <div className="resource-content">
                <h3 className="resource-title">Video Tutorials</h3>
                <p className="resource-desc">
                  Step-by-step explainer videos
                </p>
              </div>
              <ExternalLink className="resource-arrow" />
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to transform your scoring?</h2>
            <p className="cta-subtitle">
              Join hundreds of clubs using myK9Q for faster, more accurate events.
            </p>
            <button onClick={handleGetStarted} className="btn-cta">
              <span>Get Started Now</span>
              <ChevronRight className="btn-icon" />
            </button>
          </div>
          <div className="cta-decoration"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <img src="/myK9Q-teal-96.png" alt="myK9Q" className="footer-logo" />
              <span className="footer-title">myK9Q</span>
            </div>
            <p className="footer-copyright">
              © 2025 myK9Q. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
