import React, { useState, useEffect } from 'react';
import './ChampionshipChase.css';

interface ChampionshipEntry {
  id: number;
  rank: number;
  armband: string;
  call_name: string;
  breed: string;
  handler: string;
  state: string;
  combined_score: number;
  day1_score: number;
  day2_score: number;
  status: 'qualified' | 'competing' | 'completed' | 'eliminated';
  elements_completed: number;
  total_elements: number;
}

interface ChampionshipChaseProps {
  licenseKey: string;
  showCount?: number;
}

export const ChampionshipChase: React.FC<ChampionshipChaseProps> = ({
  licenseKey,
  showCount = 20
}) => {
  const [topQualifiers, setTopQualifiers] = useState<ChampionshipEntry[]>([]);
  const [currentLeader, setCurrentLeader] = useState<ChampionshipEntry | null>(null);
  const [totalQualified, setTotalQualified] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'leaderboard' | 'bracket' | 'progress'>('leaderboard');

  useEffect(() => {
    // Simulate championship data for Day 3 finals
    const generateChampionshipData = (): ChampionshipEntry[] => {
      const breeds = ['Border Collie', 'German Shepherd', 'Golden Retriever', 'Labrador Retriever', 'Belgian Malinois', 'Australian Cattle Dog', 'Dutch Shepherd', 'Working Kelpie'];
      const states = ['TX', 'CA', 'FL', 'NY', 'OH', 'IL', 'PA', 'MI', 'NC', 'GA', 'WA', 'OR'];
      const handlers = [
        'Sarah Johnson', 'Mike Wilson', 'Jennifer Davis', 'Robert Brown', 'Lisa Anderson',
        'David Miller', 'Emily White', 'James Garcia', 'Michelle Taylor', 'Christopher Lee',
        'Amanda Clark', 'Matthew Rodriguez', 'Jessica Martinez', 'Daniel Lewis', 'Ashley Walker'
      ];

      const entries: ChampionshipEntry[] = [];
      
      for (let i = 1; i <= 100; i++) {
        const day1 = Math.floor(Math.random() * 30) + 85; // 85-115
        const day2 = Math.floor(Math.random() * 30) + 85; // 85-115
        const combined = day1 + day2;
        
        // Determine status based on position and time
        let status: ChampionshipEntry['status'] = 'qualified';
        let elementsCompleted = 0;
        const totalElements = 4;
        
        if (i <= 10) {
          status = Math.random() > 0.3 ? 'competing' : 'completed';
          elementsCompleted = status === 'completed' ? totalElements : Math.floor(Math.random() * totalElements) + 1;
        } else if (i <= 50) {
          status = Math.random() > 0.7 ? 'competing' : 'qualified';
          elementsCompleted = status === 'competing' ? Math.floor(Math.random() * totalElements) + 1 : 0;
        }

        entries.push({
          id: i,
          rank: i,
          armband: String(100 + i),
          call_name: `Dog${i}`,
          breed: breeds[Math.floor(Math.random() * breeds.length)],
          handler: handlers[Math.floor(Math.random() * handlers.length)],
          state: states[Math.floor(Math.random() * states.length)],
          combined_score: combined,
          day1_score: day1,
          day2_score: day2,
          status,
          elements_completed: elementsCompleted,
          total_elements: totalElements
        });
      }

      // Sort by combined score descending
      entries.sort((a, b) => b.combined_score - a.combined_score);
      
      // Update ranks
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return entries;
    };

    const data = generateChampionshipData();
    setTopQualifiers(data.slice(0, showCount));
    setCurrentLeader(data[0]);
    setTotalQualified(100);
    setLoading(false);
  }, [licenseKey, showCount]);

  // Cycle through view modes every 20 seconds
  useEffect(() => {
    const modes: typeof viewMode[] = ['leaderboard', 'bracket', 'progress'];
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % modes.length;
      setViewMode(modes[currentIndex]);
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: ChampionshipEntry['status']): string => {
    switch (status) {
      case 'completed': return '#34C759';
      case 'competing': return '#FF9500';
      case 'qualified': return '#007AFF';
      case 'eliminated': return '#FF3B30';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: ChampionshipEntry['status']): string => {
    switch (status) {
      case 'completed': return 'FINISHED';
      case 'competing': return 'RUNNING';
      case 'qualified': return 'READY';
      case 'eliminated': return 'OUT';
      default: return 'PENDING';
    }
  };

  if (loading) {
    return (
      <div className="championship-chase loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading Championship Data...</div>
      </div>
    );
  }

  return (
    <div className="championship-chase">
      <div className="championship-header">
        <div className="championship-title">
          <h2>🏆 CHAMPIONSHIP CHASE</h2>
          <div className="championship-subtitle">Path to SWNC Title • Day 3 Finals</div>
        </div>
        <div className="championship-stats">
          <div className="stat-item">
            <div className="stat-value">{totalQualified}</div>
            <div className="stat-label">Qualified</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{topQualifiers.filter(q => q.status === 'competing').length}</div>
            <div className="stat-label">Running</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{topQualifiers.filter(q => q.status === 'completed').length}</div>
            <div className="stat-label">Finished</div>
          </div>
        </div>
      </div>

      {/* Current Leader Spotlight */}
      {currentLeader && (
        <div className="current-leader">
          <div className="leader-badge">👑 CURRENT LEADER</div>
          <div className="leader-info">
            <div className="leader-primary">
              <span className="leader-armband">#{currentLeader.armband}</span>
              <span className="leader-name">{currentLeader.call_name}</span>
              <span className="leader-breed">{currentLeader.breed}</span>
            </div>
            <div className="leader-secondary">
              <span className="leader-handler">{currentLeader.handler}, {currentLeader.state}</span>
              <span className="leader-score">{currentLeader.combined_score} pts</span>
            </div>
          </div>
          <div className="leader-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${(currentLeader.elements_completed / currentLeader.total_elements) * 100}%`,
                  backgroundColor: getStatusColor(currentLeader.status)
                }}
              />
            </div>
            <div className="progress-text">
              {currentLeader.elements_completed}/{currentLeader.total_elements} Elements • {getStatusText(currentLeader.status)}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Content Based on View Mode */}
      <div className="championship-content">
        {viewMode === 'leaderboard' && (
          <div className="leaderboard-view">
            <div className="view-header">
              <h3>Top {showCount} Qualifiers</h3>
              <div className="view-indicator">Leaderboard</div>
            </div>
            <div className="qualifiers-grid">
              {topQualifiers.map((qualifier) => (
                <div 
                  key={qualifier.id} 
                  className={`qualifier-card ${qualifier.status}`}
                  style={{ '--status-color': getStatusColor(qualifier.status) } as React.CSSProperties}
                >
                  <div className="qualifier-rank">#{qualifier.rank}</div>
                  <div className="qualifier-info">
                    <div className="qualifier-primary">
                      <span className="qualifier-armband">#{qualifier.armband}</span>
                      <span className="qualifier-name">{qualifier.call_name}</span>
                    </div>
                    <div className="qualifier-secondary">
                      <span className="qualifier-breed">{qualifier.breed}</span>
                      <span className="qualifier-handler">{qualifier.handler}</span>
                    </div>
                  </div>
                  <div className="qualifier-scores">
                    <div className="combined-score">{qualifier.combined_score}</div>
                    <div className="daily-scores">
                      <span>D1: {qualifier.day1_score}</span>
                      <span>D2: {qualifier.day2_score}</span>
                    </div>
                  </div>
                  <div className="qualifier-status">
                    <div 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(qualifier.status) }}
                    >
                      {getStatusText(qualifier.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'bracket' && (
          <div className="bracket-view">
            <div className="view-header">
              <h3>Championship Bracket</h3>
              <div className="view-indicator">Elimination Tree</div>
            </div>
            <div className="bracket-container">
              <div className="bracket-round">
                <div className="round-title">Top 16</div>
                <div className="bracket-matches">
                  {topQualifiers.slice(0, 16).map((qualifier, _index) => (
                    <div key={qualifier.id} className="bracket-seed">
                      <span className="seed-number">#{qualifier.rank}</span>
                      <span className="seed-name">{qualifier.call_name}</span>
                      <span className="seed-score">{qualifier.combined_score}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bracket-round">
                <div className="round-title">Elite 8</div>
                <div className="bracket-matches">
                  {topQualifiers.slice(0, 8).map((qualifier, _index) => (
                    <div key={qualifier.id} className="bracket-seed">
                      <span className="seed-number">#{qualifier.rank}</span>
                      <span className="seed-name">{qualifier.call_name}</span>
                      <span className="seed-score">{qualifier.combined_score}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bracket-round">
                <div className="round-title">Final 4</div>
                <div className="bracket-matches">
                  {topQualifiers.slice(0, 4).map((qualifier, _index) => (
                    <div key={qualifier.id} className="bracket-seed">
                      <span className="seed-number">#{qualifier.rank}</span>
                      <span className="seed-name">{qualifier.call_name}</span>
                      <span className="seed-score">{qualifier.combined_score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'progress' && (
          <div className="progress-view">
            <div className="view-header">
              <h3>Live Progress Tracker</h3>
              <div className="view-indicator">Real-time Updates</div>
            </div>
            <div className="progress-grid">
              {topQualifiers.filter(q => q.status === 'competing' || q.status === 'completed').map((qualifier) => (
                <div key={qualifier.id} className="progress-card">
                  <div className="progress-header">
                    <span className="progress-rank">#{qualifier.rank}</span>
                    <span className="progress-name">{qualifier.call_name}</span>
                    <span className="progress-breed">{qualifier.breed}</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${(qualifier.elements_completed / qualifier.total_elements) * 100}%`,
                          backgroundColor: getStatusColor(qualifier.status)
                        }}
                      />
                    </div>
                    <div className="progress-details">
                      <span>{qualifier.elements_completed}/{qualifier.total_elements} Elements</span>
                      <span className="progress-status" style={{ color: getStatusColor(qualifier.status) }}>
                        {getStatusText(qualifier.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Championship Timeline */}
      <div className="championship-timeline">
        <div className="timeline-title">Championship Timeline</div>
        <div className="timeline-items">
          <div className="timeline-item completed">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-time">Day 1-2</div>
              <div className="timeline-text">Qualifying Rounds</div>
            </div>
          </div>
          <div className="timeline-item active">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-time">Day 3</div>
              <div className="timeline-text">Championship Finals</div>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-time">Evening</div>
              <div className="timeline-text">SWNC Crowning</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChampionshipChase;