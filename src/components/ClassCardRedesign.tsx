import React from 'react';
import { MoreHorizontal, Heart, Clock, User } from 'lucide-react';
import './ClassCardRedesign.css';

interface ClassCardProps {
    className?: string;
    status?: 'pending' | 'in-progress' | 'completed';
}

export const ClassCardRedesign: React.FC<ClassCardProps> = ({ className, status: _status = 'in-progress' }) => {
    return (
        <div className={`class-card-redesign ${className || ''}`}>
            {/* Glow Effect */}
            <div className="glow-effect" />

            <div className="card-content">
                {/* Header Row */}
                <div className="card-header">
                    <div className="title-section">
                        <div className="title-row">
                            <h3 className="card-title">Container Advanced</h3>
                            {/* Status Pill */}
                            <span className="status-pill">
                                <span className="status-dot"></span>
                                In Progress
                            </span>
                        </div>
                        <p className="sub-title">Class #202 • Ring 1</p>
                    </div>

                    {/* Actions */}
                    <div className="card-actions">
                        <button className="icon-btn">
                            <Heart size={16} />
                        </button>
                        <button className="icon-btn">
                            <MoreHorizontal size={16} />
                        </button>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="info-grid">
                    <div className="info-item">
                        <div className="info-icon-box">
                            <User size={16} color="#60a5fa" />
                        </div>
                        <div className="info-text">
                            <span className="info-label">Judge</span>
                            <span className="info-value">Richard Beezley</span>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon-box">
                            <Clock size={16} color="#fb923c" />
                        </div>
                        <div className="info-text">
                            <span className="info-label">Max Time</span>
                            <span className="info-value">02:00</span>
                        </div>
                    </div>
                </div>

                {/* Badges & Chips */}
                <div className="badge-row">
                    <span className="badge">STA</span>
                    <span className="badge">SLF</span>
                </div>

                {/* Divider */}
                <div className="divider" />

                {/* Footer / Progress */}
                <div className="footer-section">
                    <div className="next-up-row">
                        <span className="next-up-label">Next Up:</span>
                        <div className="chips-container">
                            {[155, 151, 159].map((num) => (
                                <span key={num} className="chip">
                                    #{num}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="progress-section">
                        <div className="progress-labels">
                            <span>Progress</span>
                            <span>7 of 16 remaining</span>
                        </div>
                        <div className="progress-track">
                            <div className="progress-fill" style={{ width: '45%' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
