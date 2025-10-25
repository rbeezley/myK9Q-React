import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Users, Award, CheckCircle, Shield,
  Cloud, ChevronRight, Timer, Bell, Settings, Wifi, Zap, UserCheck,
  BookOpen, Video, ExternalLink
} from 'lucide-react';
import './Landing.css';

export function Landing() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            {/* Logo */}
            <div className="hero-logo-container">
              <div className="hero-logo-image">
                <img
                  src="/myK9Q-logo-white.png"
                  alt="myK9Q Logo"
                  className="hero-logo"
                />
              </div>
              <h1 className="hero-brand">myK9Q</h1>
            </div>

            {/* Queue and Qualify Messaging */}
            <h2 className="hero-title">
              <span className="hero-queue">Queue</span>
              <span className="hero-and">&</span>
              <span className="hero-qualify">Qualify</span>
            </h2>

            <p className="hero-tagline">
              Manage run orders and score results in real-time
            </p>

            <p className="hero-description">
              The complete scoring solution for AKC and UKC trials. Built for judges,
              stewards, and exhibitors who demand precision and reliability.
            </p>

            <div className="hero-actions">
              <button onClick={handleGetStarted} className="btn-primary">
                Get Started
                <ChevronRight className="btn-icon" />
              </button>
            </div>

            {/* Nationals Badge */}
            <div className="hero-nationals-badge">
              <Trophy className="nationals-badge-icon" />
              <span>Used at the 2025 AKC Scent Work Nationals</span>
            </div>

            {/* Feature Highlights */}
            <div className="hero-features">
              <div className="hero-feature">
                <UserCheck className="hero-feature-icon" />
                <span>Exhibitor Self Check-in</span>
              </div>
              <div className="hero-feature">
                <Zap className="hero-feature-icon" />
                <span>Auto-Calculate Results</span>
              </div>
              <div className="hero-feature">
                <Cloud className="hero-feature-icon" />
                <span>Real-time Sync</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="features-title">Everything you need to run a show</h2>

          <div className="features-grid">
            {/* Exhibitors */}
            <div className="feature-card">
              <div className="feature-header">
                <Users className="feature-icon-header" />
                <h3>For Exhibitors</h3>
              </div>
              <ul className="feature-list">
                <li>
                  <CheckCircle className="feature-check" />
                  Real-time results and placements
                </li>
                <li>
                  <CheckCircle className="feature-check" />
                  Push notifications for your runs
                </li>
                <li>
                  <CheckCircle className="feature-check" />
                  Track performance across trials
                </li>
                <li>
                  <CheckCircle className="feature-check" />
                  Self check-in when enabled
                </li>
              </ul>
            </div>

            {/* Judges */}
            <div className="feature-card">
              <div className="feature-header">
                <Award className="feature-icon-header" />
                <h3>For Judges</h3>
              </div>
              <ul className="feature-list">
                <li>
                  <CheckCircle className="feature-check" />
                  Precision multi-timer system
                </li>
                <li>
                  <CheckCircle className="feature-check" />
                  Digital scoresheets (AKC, UKC)
                </li>
                <li>
                  <CheckCircle className="feature-check" />
                  Quick fault marking and notes
                </li>
                <li>
                  <CheckCircle className="feature-check" />
                  Automatic placement calculation
                </li>
              </ul>
            </div>

            {/* Secretaries */}
            <div className="feature-card">
              <div className="feature-header">
                <Settings className="feature-icon-header" />
                <h3>For Show Secretaries</h3>
              </div>
              <ul className="feature-list">
                <li>
                  <CheckCircle className="feature-check" />
                  Complete show management
                </li>
                <li>
                  <CheckCircle className="feature-check" />
                  Automatic data synchronization
                </li>
                <li>
                  <CheckCircle className="feature-check" />
                  Export results instantly
                </li>
                <li>
                  <CheckCircle className="feature-check" />
                  Role-based access control
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Resources Section */}
      <section className="resources-section">
        <div className="container">
          <h2 className="resources-title">Learn myK9Q</h2>
          <p className="resources-subtitle">
            Everything you need to get started and master the platform
          </p>

          <div className="resources-grid">
            <a
              href="https://myk9t.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="resource-card"
            >
              <div className="resource-icon-wrapper">
                <BookOpen className="resource-icon" />
              </div>
              <h3 className="resource-title">User Guide</h3>
              <p className="resource-description">
                Helpful guides and instructions to maximize your myK9Q experience
              </p>
              <div className="resource-link">
                View Docs <ExternalLink className="resource-link-icon" />
              </div>
            </a>

            <a
              href="https://www.youtube.com/watch?v=WRaKZnFPtmI&list=PL6PN3duVGm8-WDKvOobppaZC7Mc_13Xdj"
              target="_blank"
              rel="noopener noreferrer"
              className="resource-card"
            >
              <div className="resource-icon-wrapper">
                <Video className="resource-icon" />
              </div>
              <h3 className="resource-title">Video Tutorials</h3>
              <p className="resource-description">
                myK9Q explainer videos - your guide to understanding and using the app
              </p>
              <div className="resource-link">
                Watch Playlist <ExternalLink className="resource-link-icon" />
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="capabilities-section">
        <div className="container">
          <h2 className="capabilities-title">Built for reliability</h2>

          <div className="capabilities-grid">
            <div className="capability-item">
              <Wifi className="capability-icon" />
              <h4>Offline First</h4>
              <p>Works perfectly without internet. Syncs when connected.</p>
            </div>

            <div className="capability-item">
              <Cloud className="capability-icon" />
              <h4>Cloud Sync</h4>
              <p>Real-time synchronization across all devices.</p>
            </div>

            <div className="capability-item">
              <Timer className="capability-icon" />
              <h4>Multi-Timer</h4>
              <p>Precision timing with concurrent timers.</p>
            </div>

            <div className="capability-item">
              <Bell className="capability-icon" />
              <h4>Push Notifications</h4>
              <p>Instant alerts for class changes and results.</p>
            </div>

            <div className="capability-item">
              <Trophy className="capability-icon" />
              <h4>All Organizations</h4>
              <p>AKC and UKC scoring formats supported.</p>
            </div>

            <div className="capability-item">
              <Shield className="capability-icon" />
              <h4>Secure Access</h4>
              <p>Role-based permissions and authentication.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Start scoring smarter</h2>
            <p className="cta-description">
              Join hundreds of clubs using myK9Q for faster, more accurate scoring.
            </p>
            <button onClick={handleGetStarted} className="btn-cta">
              Get Started
              <ChevronRight className="btn-icon" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <img src="/myK9Q-logo-white.png" alt="myK9Q" className="footer-logo" />
              <span className="footer-title">myK9Q</span>
            </div>
            <p className="footer-copyright">
              © 2025 myK9Q Ring Scoring. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}