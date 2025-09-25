import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
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
    score: number; // For nationals: points, for regular: time in seconds
  };
  region: 'northeast' | 'southeast' | 'midwest' | 'southwest' | 'west';
  isNationalShow?: boolean;
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

  // State name mapping
  const stateNames: Record<string, string> = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
    'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
    'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
    'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
    'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
    'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
    'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
    'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
  };

  // Reverse mapping: full name to code
  const stateNameToCode: Record<string, string> = Object.entries(stateNames).reduce((acc, [code, name]) => {
    acc[name] = code;
    acc[name.toLowerCase()] = code; // Also add lowercase version
    return acc;
  }, {} as Record<string, string>);

  // Region mapping
  const getRegion = (state: string): 'northeast' | 'southeast' | 'midwest' | 'southwest' | 'west' => {
    const regionMap: Record<string, 'northeast' | 'southeast' | 'midwest' | 'southwest' | 'west'> = {
      // Northeast
      'CT': 'northeast', 'ME': 'northeast', 'MA': 'northeast', 'NH': 'northeast', 'NJ': 'northeast',
      'NY': 'northeast', 'PA': 'northeast', 'RI': 'northeast', 'VT': 'northeast', 'MD': 'northeast', 'DE': 'northeast',
      // Southeast
      'FL': 'southeast', 'GA': 'southeast', 'NC': 'southeast', 'SC': 'southeast', 'VA': 'southeast',
      'WV': 'southeast', 'AL': 'southeast', 'KY': 'southeast', 'MS': 'southeast', 'TN': 'southeast', 'AR': 'southeast', 'LA': 'southeast',
      // Midwest
      'IL': 'midwest', 'IN': 'midwest', 'MI': 'midwest', 'OH': 'midwest', 'WI': 'midwest',
      'IA': 'midwest', 'KS': 'midwest', 'MN': 'midwest', 'MO': 'midwest', 'NE': 'midwest', 'ND': 'midwest', 'SD': 'midwest',
      // Southwest
      'AZ': 'southwest', 'NM': 'southwest', 'TX': 'southwest', 'OK': 'southwest',
      // West
      'CA': 'west', 'NV': 'west', 'UT': 'west', 'CO': 'west', 'WY': 'west',
      'ID': 'west', 'MT': 'west', 'WA': 'west', 'OR': 'west', 'AK': 'west', 'HI': 'west'
    };
    return regionMap[state] || 'midwest';
  };

  useEffect(() => {
    const fetchStateData = async () => {
      try {
        setLoading(true);

        // Fetch real data from normalized view with handler state information
        const { data: entryData, error } = await supabase
          .from('view_entry_class_join_normalized')
          .select('handler, call_name, breed, is_scored, placement, handler_state, handler_location')
          .eq('license_key', licenseKey)
          .not('handler_state', 'is', null);

        if (error) {
          console.error('Error fetching state data:', error);
          setLoading(false);
          return;
        }

        console.log('📍 State data fetched:', entryData?.length, 'entries with state info');
        console.log('📍 Sample entries:', entryData?.slice(0, 3));

        // Group by state and calculate statistics
        const stateMap = new Map<string, any[]>();

        // Process real handler state data from normalized view
        entryData?.forEach(entry => {
          let state = entry.handler_state?.trim();
          if (state) {
            // Convert full state name to code if needed
            if (state.length > 2) {
              state = stateNameToCode[state] || stateNameToCode[state.toLowerCase()];
            } else {
              state = state.toUpperCase();
            }

            if (state && state.length === 2) {
              if (!stateMap.has(state)) {
                stateMap.set(state, []);
              }
              stateMap.get(state)?.push(entry);
            }
          }
        });

        // Convert to StateData format (NATIONAL SHOW logic only)
        const processedData: StateData[] = Array.from(stateMap.entries()).map(([state, entries]) => {
          const participantCount = entries.length;
          // Count qualified based on placement (1-4 are qualified)
          const qualifiedCount = entries.filter(e => e.placement && e.placement >= 1 && e.placement <= 4).length;
          const scores = entries.filter(e => e.score && e.score !== '' && e.score !== '0').map(e => parseFloat(e.score));
          const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

          // Find top performer for this state (highest score wins)
          const topEntry = entries
            .filter(e => e.score && e.score !== '' && e.score !== '0')
            .sort((a, b) => parseFloat(b.score || '0') - parseFloat(a.score || '0'))[0];

          return {
            state,
            stateName: stateNames[state] || state,
            participantCount,
            qualifiedCount,
            averageScore,
            topPerformer: topEntry ? {
              name: topEntry.call_name || 'Unknown',
              breed: topEntry.breed || 'Mixed',
              score: parseFloat(topEntry.score || '0')
            } : {
              name: 'TBD',
              breed: 'TBD',
              score: 0
            },
            region: getRegion(state),
            isNationalShow: true // Always national show for now
          };
        }).sort((a, b) => b.participantCount - a.participantCount);

        setStateData(processedData);

        // Calculate region summaries
        const regions: Array<'northeast' | 'southeast' | 'midwest' | 'southwest' | 'west'> = ['northeast', 'southeast', 'midwest', 'southwest', 'west'];
        const summaries = regions.map(region => {
          const regionStates = processedData.filter(state => state.region === region);
          const totalParticipants = regionStates.reduce((sum, state) => sum + state.participantCount, 0);
          const avgScores = regionStates.filter(s => s.averageScore > 0);
          const averageScore = avgScores.length > 0
            ? Math.round(avgScores.reduce((sum, state) => sum + state.averageScore, 0) / avgScores.length)
            : 0;
          const topState = regionStates.reduce((top, state) =>
            !top || state.participantCount > top.participantCount ? state : top,
            null as StateData | null
          );

          return {
            region: region.charAt(0).toUpperCase() + region.slice(1),
            totalParticipants,
            averageScore,
            topState: topState?.stateName || 'N/A'
          };
        }).sort((a, b) => b.totalParticipants - a.totalParticipants);

        setRegionSummaries(summaries);
        setLoading(false);
      } catch (err) {
        console.error('Error in fetchStateData:', err);
        setLoading(false);
      }
    };

    fetchStateData();

    // Refresh data every 60 seconds
    const interval = setInterval(fetchStateData, 60000);

    return () => clearInterval(interval);
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
          <h2>🗺️ DOGS ACROSS AMERICA</h2>
        </div>
        <div className="participation-stats">
          <div className="stat-item stat-states">
            <div className="stat-value">{stateData.length}</div>
            <div className="stat-label">States</div>
          </div>
          <div className="stat-item stat-handlers">
            <div className="stat-value">{stateData.reduce((sum, state) => sum + state.participantCount, 0)}</div>
            <div className="stat-label">Dogs</div>
          </div>
          <div className="stat-item stat-qualified">
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
                <div className="state-markers">
                  {stateData.map((state) => (
                    <div
                      key={state.state}
                      className={`state-marker ${getParticipationLevel(state.participantCount)}`}
                      style={{
                        '--region-color': getRegionColor(state.region),
                        '--participation-size': `${Math.max(2.5, state.participantCount / 10)}vw`
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
              <h3>Top 5 States</h3>
              <div className="view-indicator">By Participation</div>
            </div>

            <div className="state-leaderboard-horizontal">
              {stateData.slice(0, 5).map((state, index) => (
                <div
                  key={state.state}
                  className={`state-card-horizontal rank-${index + 1}`}
                  style={{ '--region-color': getRegionColor(state.region) } as React.CSSProperties}
                >
                  <div className="rank-header">
                    <div className="rank-position">#{index + 1}</div>
                    {index === 0 && <div className="rank-icon">🥇</div>}
                    {index === 1 && <div className="rank-icon">🥈</div>}
                    {index === 2 && <div className="rank-icon">🥉</div>}
                  </div>

                  <div className="state-info-compact">
                    <div className="state-name-short">{state.state}</div>
                    <div className="state-full-name">{state.stateName}</div>
                  </div>

                  <div className="state-metrics-compact">
                    <div className="metric-primary">
                      <span className="metric-value-large">{state.participantCount}</span>
                      <span className="metric-label-small">DOGS</span>
                    </div>
                    <div className="metrics-secondary">
                      <div className="metric-small">
                        <span>{state.qualifiedCount}</span>
                        <span>Q</span>
                      </div>
                      <div className="metric-small">
                        <span>{state.averageScore}</span>
                        <span>AVG</span>
                      </div>
                    </div>
                  </div>

                  {state.topPerformer.name !== 'TBD' && state.topPerformer.score > 0 && (
                    <div className="top-performer-compact">
                      <div className="performer-name-short">{state.topPerformer.name.split(' ')[0]}</div>
                      <div className="performer-score-compact">{state.topPerformer.score} pts</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {stateData.length > 5 && (
              <div className="additional-states-count">
                <span>+{stateData.length - 5} more states</span>
              </div>
            )}
          </div>
        )}

        {viewMode === 'regions' && (
          <div className="regions-view">
            <div className="view-header">
              <h3>Regional Leaders</h3>
              <div className="view-indicator">Top 3 Regions</div>
            </div>

            <div className="regions-showcase">
              {regionSummaries.slice(0, 3).map((region, index) => (
                <div
                  key={region.region}
                  className={`region-showcase-card rank-${index + 1}`}
                  style={{ '--region-color': getRegionColor(region.region.toLowerCase()) } as React.CSSProperties}
                >
                  <div className="region-rank">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                  </div>
                  <div className="region-name-large">{region.region}</div>
                  <div className="region-participants">
                    <div className="participant-count">{region.totalParticipants}</div>
                    <div className="participant-label">Total Dogs</div>
                  </div>
                  <div className="region-highlights">
                    <div className="highlight-item">
                      <span className="highlight-label">Leading State</span>
                      <span className="highlight-value">{region.topState}</span>
                    </div>
                    <div className="highlight-item">
                      <span className="highlight-label">Average Score</span>
                      <span className="highlight-value">{region.averageScore}</span>
                    </div>
                  </div>
                  <div className="region-top-states">
                    {stateData
                      .filter(state => state.region === region.region.toLowerCase())
                      .slice(0, 3)
                      .map((state, idx) => (
                        <div key={state.state} className="top-state-item">
                          <span className="state-position">{idx + 1}.</span>
                          <span className="state-abbr">{state.state}</span>
                          <span className="state-count">{state.participantCount}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              ))}
            </div>

            <div className="regions-summary-bar">
              <div className="summary-title">All Regions</div>
              <div className="summary-items">
                {regionSummaries.map((region) => (
                  <div
                    key={region.region}
                    className="summary-item"
                    style={{ '--region-color': getRegionColor(region.region.toLowerCase()) } as React.CSSProperties}
                  >
                    <span className="summary-region">{region.region}</span>
                    <span className="summary-count">{region.totalParticipants}</span>
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