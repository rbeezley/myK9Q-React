import React, { useState, useEffect } from 'react';
import './StateParticipation.css';

interface StateData {
  state: string;
  stateName: string;
  participantCount: number;
  qualifiedCount: number;
  averageScore: number;
  topPerformer: {
    name: string;
    breed: string;
    score: number;
  };
  region: 'northeast' | 'southeast' | 'midwest' | 'southwest' | 'west';
}

interface RegionSummary {
  region: string;
  totalParticipants: number;
  averageScore: number;
  topState: string;
}

interface StateParticipationProps {
  licenseKey: string;
  showMapView?: boolean;
}

export const StateParticipation: React.FC<StateParticipationProps> = ({
  licenseKey,
  showMapView: _showMapView = true
}) => {
  const [stateData, setStateData] = useState<StateData[]>([]);
  const [regionSummaries, setRegionSummaries] = useState<RegionSummary[]>([]);
  const [selectedState, setSelectedState] = useState<StateData | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'leaderboard' | 'regions'>('map');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate demo state participation data
    const generateStateData = (): StateData[] => {
      const stateInfo = [
        { state: 'TX', name: 'Texas', region: 'southwest' as const },
        { state: 'CA', name: 'California', region: 'west' as const },
        { state: 'FL', name: 'Florida', region: 'southeast' as const },
        { state: 'NY', name: 'New York', region: 'northeast' as const },
        { state: 'OH', name: 'Ohio', region: 'midwest' as const },
        { state: 'IL', name: 'Illinois', region: 'midwest' as const },
        { state: 'PA', name: 'Pennsylvania', region: 'northeast' as const },
        { state: 'MI', name: 'Michigan', region: 'midwest' as const },
        { state: 'NC', name: 'North Carolina', region: 'southeast' as const },
        { state: 'GA', name: 'Georgia', region: 'southeast' as const },
        { state: 'WA', name: 'Washington', region: 'west' as const },
        { state: 'OR', name: 'Oregon', region: 'west' as const },
        { state: 'CO', name: 'Colorado', region: 'west' as const },
        { state: 'AZ', name: 'Arizona', region: 'southwest' as const },
        { state: 'NM', name: 'New Mexico', region: 'southwest' as const },
        { state: 'VA', name: 'Virginia', region: 'southeast' as const },
        { state: 'MD', name: 'Maryland', region: 'northeast' as const },
        { state: 'MN', name: 'Minnesota', region: 'midwest' as const },
        { state: 'WI', name: 'Wisconsin', region: 'midwest' as const },
        { state: 'IN', name: 'Indiana', region: 'midwest' as const }
      ];

      const breeds = ['Border Collie', 'German Shepherd', 'Golden Retriever', 'Labrador Retriever', 'Belgian Malinois'];
      const names = ['Max', 'Bella', 'Charlie', 'Luna', 'Cooper', 'Lucy', 'Rocky', 'Daisy', 'Tucker', 'Molly'];

      return stateInfo.map(info => {
        const participantCount = Math.floor(Math.random() * 15) + 3; // 3-17 participants
        const qualifiedCount = Math.floor(participantCount * (Math.random() * 0.4 + 0.4)); // 40-80% qualification rate
        const averageScore = Math.floor(Math.random() * 30) + 85; // 85-115 average

        return {
          state: info.state,
          stateName: info.name,
          participantCount,
          qualifiedCount,
          averageScore,
          topPerformer: {
            name: names[Math.floor(Math.random() * names.length)],
            breed: breeds[Math.floor(Math.random() * breeds.length)],
            score: averageScore + Math.floor(Math.random() * 20) + 5 // Above average
          },
          region: info.region
        };
      }).sort((a, b) => b.participantCount - a.participantCount);
    };

    const data = generateStateData();
    setStateData(data);

    // Calculate region summaries
    const regions = ['northeast', 'southeast', 'midwest', 'southwest', 'west'];
    const summaries = regions.map(region => {
      const regionStates = data.filter(state => state.region === region);
      const totalParticipants = regionStates.reduce((sum, state) => sum + state.participantCount, 0);
      const averageScore = Math.round(
        regionStates.reduce((sum, state) => sum + state.averageScore, 0) / regionStates.length
      );
      const topState = regionStates.reduce((top, state) => 
        state.participantCount > top.participantCount ? state : top
      );

      return {
        region: region.charAt(0).toUpperCase() + region.slice(1),
        totalParticipants,
        averageScore,
        topState: topState.stateName
      };
    }).sort((a, b) => b.totalParticipants - a.totalParticipants);

    setRegionSummaries(summaries);
    setLoading(false);
  }, [licenseKey]);

  // Cycle through view modes every 25 seconds
  useEffect(() => {
    const modes: typeof viewMode[] = ['map', 'leaderboard', 'regions'];
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % modes.length;
      setViewMode(modes[currentIndex]);
    }, 25000);

    return () => clearInterval(interval);
  }, []);

  const getRegionColor = (region: string): string => {
    const colors = {
      northeast: '#007AFF',
      southeast: '#34C759',
      midwest: '#FF9500',
      southwest: '#FF3B30',
      west: '#AF52DE'
    };
    return colors[region as keyof typeof colors] || '#6B7280';
  };

  const getParticipationLevel = (count: number): 'high' | 'medium' | 'low' => {
    if (count >= 12) return 'high';
    if (count >= 7) return 'medium';
    return 'low';
  };

  if (loading) {
    return (
      <div className="state-participation loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading Geographic Data...</div>
      </div>
    );
  }

  return (
    <div className="state-participation">
      <div className="participation-header">
        <div className="participation-title">
          <h2>🗺️ GEOGRAPHIC PARTICIPATION</h2>
          <div className="participation-subtitle">Handlers from Across America</div>
        </div>
        <div className="participation-stats">
          <div className="stat-item">
            <div className="stat-value">{stateData.length}</div>
            <div className="stat-label">States</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stateData.reduce((sum, state) => sum + state.participantCount, 0)}</div>
            <div className="stat-label">Handlers</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stateData.reduce((sum, state) => sum + state.qualifiedCount, 0)}</div>
            <div className="stat-label">Qualified</div>
          </div>
        </div>
      </div>

      <div className="participation-content">
        {viewMode === 'map' && (
          <div className="map-view">
            <div className="view-header">
              <h3>National Participation Map</h3>
              <div className="view-indicator">Geographic Distribution</div>
            </div>
            
            <div className="map-container">
              {/* Simplified US Map Representation */}
              <div className="us-map">
                <div className="map-legend">
                  <div className="legend-title">Participation Level</div>
                  <div className="legend-items">
                    <div className="legend-item">
                      <div className="legend-color high"></div>
                      <span>High (12+)</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color medium"></div>
                      <span>Medium (7-11)</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color low"></div>
                      <span>Low (3-6)</span>
                    </div>
                  </div>
                </div>

                <div className="state-markers">
                  {stateData.map((state) => (
                    <div
                      key={state.state}
                      className={`state-marker ${getParticipationLevel(state.participantCount)}`}
                      style={{ 
                        '--region-color': getRegionColor(state.region),
                        '--participation-size': `${Math.max(0.8, state.participantCount / 20)}vw`
                      } as React.CSSProperties}
                      onClick={() => setSelectedState(state)}
                      title={`${state.stateName}: ${state.participantCount} handlers`}
                    >
                      <div className="marker-circle">
                        <span className="marker-count">{state.participantCount}</span>
                      </div>
                      <div className="marker-label">{state.state}</div>
                    </div>
                  ))}
                </div>

                {selectedState && (
                  <div className="state-tooltip">
                    <div className="tooltip-header">
                      <h4>{selectedState.stateName}</h4>
                      <button 
                        className="tooltip-close"
                        onClick={() => setSelectedState(null)}
                      >
                        ×
                      </button>
                    </div>
                    <div className="tooltip-content">
                      <div className="tooltip-stat">
                        <span className="tooltip-label">Participants:</span>
                        <span className="tooltip-value">{selectedState.participantCount}</span>
                      </div>
                      <div className="tooltip-stat">
                        <span className="tooltip-label">Qualified:</span>
                        <span className="tooltip-value">{selectedState.qualifiedCount}</span>
                      </div>
                      <div className="tooltip-stat">
                        <span className="tooltip-label">Avg Score:</span>
                        <span className="tooltip-value">{selectedState.averageScore}</span>
                      </div>
                      <div className="tooltip-performer">
                        <div className="performer-title">Top Performer</div>
                        <div className="performer-info">
                          <span className="performer-name">{selectedState.topPerformer.name}</span>
                          <span className="performer-breed">{selectedState.topPerformer.breed}</span>
                          <span className="performer-score">{selectedState.topPerformer.score} pts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'leaderboard' && (
          <div className="leaderboard-view">
            <div className="view-header">
              <h3>State Participation Rankings</h3>
              <div className="view-indicator">By Handler Count</div>
            </div>
            
            <div className="state-leaderboard">
              {stateData.map((state, index) => (
                <div 
                  key={state.state}
                  className="state-row"
                  style={{ '--region-color': getRegionColor(state.region) } as React.CSSProperties}
                >
                  <div className="state-rank">#{index + 1}</div>
                  <div className="state-info">
                    <div className="state-primary">
                      <span className="state-name">{state.stateName}</span>
                      <span className="state-code">({state.state})</span>
                    </div>
                    <div className="state-region" style={{ color: getRegionColor(state.region) }}>
                      {state.region.charAt(0).toUpperCase() + state.region.slice(1)}
                    </div>
                  </div>
                  <div className="state-metrics">
                    <div className="metric-item">
                      <div className="metric-value">{state.participantCount}</div>
                      <div className="metric-label">Handlers</div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-value">{state.qualifiedCount}</div>
                      <div className="metric-label">Qualified</div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-value">{state.averageScore}</div>
                      <div className="metric-label">Avg Score</div>
                    </div>
                  </div>
                  <div className="state-performer">
                    <div className="performer-name">{state.topPerformer.name}</div>
                    <div className="performer-details">
                      <span>{state.topPerformer.breed}</span>
                      <span>{state.topPerformer.score} pts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'regions' && (
          <div className="regions-view">
            <div className="view-header">
              <h3>Regional Analysis</h3>
              <div className="view-indicator">By Geographic Region</div>
            </div>
            
            <div className="regions-grid">
              {regionSummaries.map((region) => (
                <div 
                  key={region.region}
                  className="region-card"
                  style={{ '--region-color': getRegionColor(region.region.toLowerCase()) } as React.CSSProperties}
                >
                  <div className="region-header">
                    <h4>{region.region}</h4>
                    <div className="region-badge">{region.totalParticipants} handlers</div>
                  </div>
                  <div className="region-stats">
                    <div className="region-stat">
                      <span className="stat-label">Top State:</span>
                      <span className="stat-value">{region.topState}</span>
                    </div>
                    <div className="region-stat">
                      <span className="stat-label">Avg Score:</span>
                      <span className="stat-value">{region.averageScore}</span>
                    </div>
                  </div>
                  <div className="region-states">
                    {stateData
                      .filter(state => state.region === region.region.toLowerCase())
                      .slice(0, 5)
                      .map(state => (
                        <div key={state.state} className="region-state">
                          <span className="region-state-name">{state.state}</span>
                          <span className="region-state-count">{state.participantCount}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              ))}
            </div>

            <div className="regions-comparison">
              <div className="comparison-title">Regional Comparison</div>
              <div className="comparison-chart">
                {regionSummaries.map((region) => (
                  <div key={region.region} className="comparison-bar">
                    <div className="bar-label">{region.region}</div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill"
                        style={{ 
                          width: `${(region.totalParticipants / Math.max(...regionSummaries.map(r => r.totalParticipants))) * 100}%`,
                          backgroundColor: getRegionColor(region.region.toLowerCase())
                        }}
                      />
                      <div className="bar-value">{region.totalParticipants}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StateParticipation;