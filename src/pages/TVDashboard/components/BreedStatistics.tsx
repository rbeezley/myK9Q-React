import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface BreedPerformance {
  breed: string;
  total_dogs: number;
  average_score: number;
  perfect_scores: number;
  fastest_time: string;
  slowest_time: string;
  completion_rate: number;
  top_performer: {
    call_name: string;
    handler: string;
    score: number;
    armband: string;
  } | null;
  rank: number;
  score_distribution: {
    excellent: number; // 95-100
    good: number;      // 85-94
    average: number;   // 75-84
    needs_work: number; // less than 75
  };
}

interface _BreedTrend {
  breed: string;
  trend: 'up' | 'down' | 'stable';
  change_percentage: number;
}

interface BreedStatisticsProps {
  licenseKey: string;
  showTopCount?: number;
}

const isDebugMode = import.meta.env.VITE_TV_DEBUG === 'true';

export const BreedStatistics: React.FC<BreedStatisticsProps> = ({ 
  licenseKey, 
  showTopCount = 8 
}) => {
  const [breedPerformance, setBreedPerformance] = useState<BreedPerformance[]>([]);
  const [_selectedBreed, _setSelectedBreed] = useState<BreedPerformance | null>(null);
  const [_viewMode, _setViewMode] = useState<'overview' | 'detailed'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBreedStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isDebugMode) console.log('🐕 Fetching breed statistics...');

      // Fetch all completed entries for breed analysis
      const { data: entriesData, error: entriesError } = await supabase
        .from('view_entry_class_join_normalized')
        .select('*')
        .eq('license_key', licenseKey)
        .eq('is_scored', true)
        .not('breed', 'is', null)
        .not('breed', 'eq', '')
        .order('breed');

      if (entriesError) {
        console.error('❌ Breed statistics error:', entriesError);
        throw entriesError;
      }

      if (!entriesData || entriesData.length === 0) {
        // Generate demo breed statistics
        generateDemoBreedStats();
        return;
      }

      // Process the data
      processBreedData(entriesData);

    } catch (error) {
      console.error('❌ Error fetching breed statistics:', error);
      setError('Unable to load breed statistics');
      // Fallback to demo data
      generateDemoBreedStats();
    } finally {
      setLoading(false);
    }
  };

  const generateDemoBreedStats = () => {
    const demoBreeds: BreedPerformance[] = [
      {
        breed: 'Border Collie',
        total_dogs: 28,
        average_score: 92.3,
        perfect_scores: 4,
        fastest_time: '0:47',
        slowest_time: '2:15',
        completion_rate: 96.4,
        top_performer: {
          call_name: 'Blaze',
          handler: 'Mike Wilson',
          score: 118,
          armband: '247'
        },
        rank: 1,
        score_distribution: { excellent: 12, good: 11, average: 4, needs_work: 1 }
      },
      {
        breed: 'German Shepherd',
        total_dogs: 25,
        average_score: 89.7,
        perfect_scores: 3,
        fastest_time: '0:52',
        slowest_time: '2:28',
        completion_rate: 92.0,
        top_performer: {
          call_name: 'Nova',
          handler: 'Sarah Chen',
          score: 116,
          armband: '089'
        },
        rank: 2,
        score_distribution: { excellent: 8, good: 12, average: 4, needs_work: 1 }
      },
      {
        breed: 'Labrador Retriever',
        total_dogs: 22,
        average_score: 88.1,
        perfect_scores: 2,
        fastest_time: '0:58',
        slowest_time: '2:35',
        completion_rate: 90.9,
        top_performer: {
          call_name: 'Scout',
          handler: 'Tom Bradley',
          score: 115,
          armband: '156'
        },
        rank: 3,
        score_distribution: { excellent: 6, good: 10, average: 5, needs_work: 1 }
      },
      {
        breed: 'Golden Retriever',
        total_dogs: 18,
        average_score: 86.4,
        perfect_scores: 1,
        fastest_time: '1:05',
        slowest_time: '2:42',
        completion_rate: 88.9,
        top_performer: {
          call_name: 'Honey',
          handler: 'Lisa Martinez',
          score: 112,
          armband: '201'
        },
        rank: 4,
        score_distribution: { excellent: 4, good: 9, average: 4, needs_work: 1 }
      },
      {
        breed: 'Belgian Malinois',
        total_dogs: 15,
        average_score: 91.2,
        perfect_scores: 2,
        fastest_time: '0:49',
        slowest_time: '2:18',
        completion_rate: 93.3,
        top_performer: {
          call_name: 'Zeus',
          handler: 'John Davis',
          score: 114,
          armband: '134'
        },
        rank: 5,
        score_distribution: { excellent: 6, good: 6, average: 2, needs_work: 1 }
      },
      {
        breed: 'Australian Shepherd',
        total_dogs: 14,
        average_score: 85.7,
        perfect_scores: 1,
        fastest_time: '1:08',
        slowest_time: '2:48',
        completion_rate: 85.7,
        top_performer: {
          call_name: 'Maggie',
          handler: 'Amy Johnson',
          score: 110,
          armband: '178'
        },
        rank: 6,
        score_distribution: { excellent: 3, good: 7, average: 3, needs_work: 1 }
      },
      {
        breed: 'Dutch Shepherd',
        total_dogs: 12,
        average_score: 89.5,
        perfect_scores: 2,
        fastest_time: '0:54',
        slowest_time: '2:25',
        completion_rate: 91.7,
        top_performer: {
          call_name: 'Rex',
          handler: 'David Wilson',
          score: 113,
          armband: '098'
        },
        rank: 7,
        score_distribution: { excellent: 4, good: 5, average: 2, needs_work: 1 }
      },
      {
        breed: 'Springer Spaniel',
        total_dogs: 11,
        average_score: 84.2,
        perfect_scores: 1,
        fastest_time: '1:12',
        slowest_time: '2:55',
        completion_rate: 81.8,
        top_performer: {
          call_name: 'Springer',
          handler: 'Carol Smith',
          score: 108,
          armband: '223'
        },
        rank: 8,
        score_distribution: { excellent: 2, good: 5, average: 3, needs_work: 1 }
      }
    ];

    setBreedPerformance(demoBreeds);
  };

  const processBreedData = (data: any[]) => {
    // Group entries by breed
    const breedGroups = data.reduce((acc: { [key: string]: any[] }, entry) => {
      const breed = entry.breed || 'Mixed Breed';
      if (!acc[breed]) acc[breed] = [];
      acc[breed].push(entry);
      return acc;
    }, {});

    // Calculate statistics for each breed
    const breedStats = Object.entries(breedGroups)
      .map(([breed, entries]) => {
        const scores = entries.map(() => 85 + Math.random() * 15); // Demo scoring
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const perfectScores = Math.floor(entries.length * 0.1);
        const completionRate = (entries.length / Math.max(entries.length, 1)) * 100;

        return {
          breed,
          total_dogs: entries.length,
          average_score: avgScore,
          perfect_scores: perfectScores,
          fastest_time: '0:45',
          slowest_time: '2:30',
          completion_rate: completionRate,
          top_performer: entries.length > 0 ? {
            call_name: entries[0].call_name || 'Unknown',
            handler: entries[0].handler || 'Unknown',
            score: Math.floor(avgScore + 10),
            armband: entries[0].armband || 'N/A'
          } : null,
          rank: 0, // Will be set after sorting
          score_distribution: {
            excellent: Math.floor(entries.length * 0.3),
            good: Math.floor(entries.length * 0.4),
            average: Math.floor(entries.length * 0.25),
            needs_work: Math.floor(entries.length * 0.05)
          }
        };
      })
      .filter(breed => breed.total_dogs >= 3) // Only show breeds with 3+ dogs
      .sort((a, b) => b.average_score - a.average_score)
      .map((breed, index) => ({ ...breed, rank: index + 1 }))
      .slice(0, showTopCount);

    setBreedPerformance(breedStats);
  };

  const _getPerformanceColor = (score: number): string => {
    if (score >= 95) return '#34C759'; // Green
    if (score >= 85) return '#007AFF'; // Blue
    if (score >= 75) return '#FF9500'; // Orange
    return '#FF3B30'; // Red
  };

  const _getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '📊';
    }
  };

  useEffect(() => {
    fetchBreedStatistics();
    
    // Refresh data every 10 minutes
    const interval = setInterval(fetchBreedStatistics, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [licenseKey]);

  if (loading) {
    return (
      <div className="breed-statistics loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading breed intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="breed-statistics">
      <div className="breed-header">
        <h2>
          <span className="breed-icon">🏆</span>
          Top Performing Breeds
        </h2>
      </div>

      <div className="breed-overview">
        <div className="breed-rankings">
          {breedPerformance.slice(0, 4).map((breed, index) => (
            <div
              key={breed.breed}
              className="breed-rank-item"
            >
              <div className="rank-position">
                <span className="rank-number">{breed.rank}</span>
                {index < 3 && <span className="rank-medal">{['🥇', '🥈', '🥉'][index]}</span>}
              </div>

              <div className="breed-info">
                <div className="breed-name">{breed.breed}</div>
                <div className="breed-stats-summary">
                  {breed.total_dogs} entries • {breed.average_score.toFixed(1)} avg
                </div>
              </div>

              <div className="breed-performance">
                <div className="performance-score">
                  {breed.average_score.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="breed-insights">
          <div className="insights-grid">
            <div className="insight-item">
              <div className="insight-icon">🎯</div>
              <div className="insight-content">
                <div className="insight-label">Leader</div>
                <div className="insight-value">
                  {breedPerformance[0]?.breed}
                </div>
              </div>
            </div>

            <div className="insight-item">
              <div className="insight-icon">⚡</div>
              <div className="insight-content">
                <div className="insight-label">Perfect Scores</div>
                <div className="insight-value">
                  {breedPerformance.reduce((sum, breed) => sum + breed.perfect_scores, 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
    </div>
  );
};

export default BreedStatistics;