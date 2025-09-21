import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface JudgeProfile {
  id: number;
  name: string;
  photo_url?: string;
  judging_since: number;
  home_state: string;
  specialties: string[];
  fun_facts: string[];
  akc_number: string;
  assignments: {
    current_element?: string;
    ring_number?: number;
    schedule?: string;
  };
  achievements?: string[];
  certification_level?: string;
}

interface JudgeSpotlightProps {
  licenseKey: string;
  rotationInterval?: number; // in milliseconds, default 30 seconds
}

const isDebugMode = import.meta.env.VITE_TV_DEBUG === 'true';

export const JudgeSpotlight: React.FC<JudgeSpotlightProps> = ({
  licenseKey,
  rotationInterval = 7000
}) => {
  const [judges, setJudges] = useState<JudgeProfile[]>([]);
  const [currentJudgeIndex, setCurrentJudgeIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJudges = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isDebugMode) console.log('👨‍⚖️ Fetching judges data...');

      // Try to fetch from judge_profiles table
      const { data: judgeData, error: judgeError } = await supabase
        .from('judge_profiles')
        .select('*')
        .limit(10);

      if (judgeError && judgeError.code !== 'PGRST116') {
        console.error('❌ Judge profiles error:', judgeError);
        throw judgeError;
      }

      if (!judgeData || judgeData.length === 0) {
        // Generate demo judge data for the inaugural event
        generateDemoJudges();
      } else {
        setJudges(judgeData);
      }

    } catch (error) {
      console.error('❌ Error fetching judges:', error);
      setError('Unable to load judge information');
      // Fallback to demo data
      generateDemoJudges();
    } finally {
      setLoading(false);
    }
  };

  const generateDemoJudges = () => {
    const demoJudges: JudgeProfile[] = [
      {
        id: 1,
        name: 'Patricia Henderson',
        judging_since: 2008,
        home_state: 'Ohio',
        specialties: ['Scent Work', 'Tracking', 'Search & Rescue'],
        fun_facts: [
          'Founded the first Scent Work club in Ohio',
          'Former K9 police officer for 15 years',
          'Has judged over 500 trials nationwide'
        ],
        akc_number: 'SW001234',
        assignments: {
          current_element: 'Container Search',
          ring_number: 1,
          schedule: 'Day 2: 8:00 AM - 12:00 PM'
        },
        achievements: ['AKC Judge of the Year 2023', 'Master Trainer Certification'],
        certification_level: 'Master Judge'
      },
      {
        id: 2,
        name: 'Michael Rodriguez',
        judging_since: 2012,
        home_state: 'Texas',
        specialties: ['Scent Work', 'Detection Sports', 'Field Training'],
        fun_facts: [
          'Started with his rescue dog "Ranger"',
          'Developed innovative training techniques',
          'Speaks at international seminars'
        ],
        akc_number: 'SW002456',
        assignments: {
          current_element: 'Interior Search',
          ring_number: 2,
          schedule: 'Day 2: 1:00 PM - 5:00 PM'
        },
        achievements: ['International Judge Certification', 'Published Author'],
        certification_level: 'Senior Judge'
      },
      {
        id: 3,
        name: 'Dr. Sarah Chen',
        judging_since: 2015,
        home_state: 'California',
        specialties: ['Scent Work', 'Canine Behavior', 'Training Psychology'],
        fun_facts: [
          'PhD in Animal Behavior',
          'Researcher at UC Davis',
          'Trains service dogs in her spare time'
        ],
        akc_number: 'SW003789',
        assignments: {
          current_element: 'Exterior Search',
          ring_number: 3,
          schedule: 'Day 3: Finals'
        },
        achievements: ['Research Excellence Award', 'Behavior Specialist'],
        certification_level: 'Master Judge'
      },
      {
        id: 4,
        name: 'Robert Williams',
        judging_since: 2010,
        home_state: 'Florida',
        specialties: ['Scent Work', 'Agility', 'Obedience'],
        fun_facts: [
          'Retired military working dog handler',
          'Breeds German Shepherds',
          'Marathon runner and dog sports enthusiast'
        ],
        akc_number: 'SW004012',
        assignments: {
          current_element: 'Buried Search',
          ring_number: 4,
          schedule: 'Day 2: 9:00 AM - 1:00 PM'
        },
        achievements: ['Military Service Medal', 'Multi-Sport Judge'],
        certification_level: 'Senior Judge'
      }
    ];

    setJudges(demoJudges);
  };

  const rotateToNextJudge = () => {
    if (judges.length === 0) return;

    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentJudgeIndex((prev) => (prev + 1) % judges.length);
      setIsTransitioning(false);
    }, 300); // Half of transition time
  };

  useEffect(() => {
    fetchJudges();
  }, [licenseKey]);

  useEffect(() => {
    if (judges.length <= 1) return;

    const interval = setInterval(rotateToNextJudge, rotationInterval);
    
    return () => clearInterval(interval);
  }, [judges.length, rotationInterval]);

  if (loading) {
    return (
      <div className="judge-spotlight loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading judge information...</p>
        </div>
      </div>
    );
  }

  if (judges.length === 0) {
    return (
      <div className="judge-spotlight">
        <h2>👨‍⚖️ Judge Spotlight</h2>
        <div className="no-judges">
          <p>Judge information will be available soon!</p>
        </div>
      </div>
    );
  }

  const currentJudge = judges[currentJudgeIndex];

  return (
    <div className="judge-spotlight">
      <h2>
        <span className="judge-icon">👨‍⚖️</span>
        Judge Spotlight
      </h2>
      
      <div className={`judge-profile ${isTransitioning ? 'transitioning' : ''}`}>
        {/* Judge Photo */}
        <div className="judge-photo">
          {currentJudge.photo_url ? (
            <img src={currentJudge.photo_url} alt={currentJudge.name} />
          ) : (
            <div className="photo-placeholder">
              <span className="placeholder-icon">👨‍⚖️</span>
            </div>
          )}
          <div className="certification-badge">
            {currentJudge.certification_level || 'AKC Judge'}
          </div>
        </div>

        {/* Judge Information */}
        <div className="judge-info">
          <div className="judge-header">
            <h3 className="judge-name">{currentJudge.name}</h3>
            <div className="judge-credentials">
              <span className="akc-number">{currentJudge.akc_number}</span>
              <span className="home-state">{currentJudge.home_state}</span>
            </div>
          </div>

          <div className="judge-experience">
            <div className="experience-item">
              <span className="experience-label">Judging Since:</span>
              <span className="experience-value">{currentJudge.judging_since}</span>
              <span className="experience-years">
                ({new Date().getFullYear() - currentJudge.judging_since} years)
              </span>
            </div>
          </div>

          {/* Current Assignment */}
          {currentJudge.assignments && (
            <div className="current-assignment">
              <h4>📍 Current Assignment</h4>
              <div className="assignment-details">
                {currentJudge.assignments.current_element && (
                  <div className="assignment-item">
                    <span className="assignment-label">Element:</span>
                    <span className="assignment-value">{currentJudge.assignments.current_element}</span>
                  </div>
                )}
                {currentJudge.assignments.ring_number && (
                  <div className="assignment-item">
                    <span className="assignment-label">Ring:</span>
                    <span className="assignment-value">#{currentJudge.assignments.ring_number}</span>
                  </div>
                )}
                {currentJudge.assignments.schedule && (
                  <div className="assignment-item">
                    <span className="assignment-label">Schedule:</span>
                    <span className="assignment-value">{currentJudge.assignments.schedule}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Specialties */}
          {currentJudge.specialties && currentJudge.specialties.length > 0 && (
            <div className="specialties">
              <h4>🏆 Specialties</h4>
              <div className="specialty-tags">
                {currentJudge.specialties.map((specialty, index) => (
                  <span key={index} className="specialty-tag">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Fun Fact */}
          {currentJudge.fun_facts && currentJudge.fun_facts.length > 0 && (
            <div className="fun-fact">
              <h4>✨ Did You Know?</h4>
              <p>{currentJudge.fun_facts[currentJudgeIndex % currentJudge.fun_facts.length]}</p>
            </div>
          )}

          {/* Achievements */}
          {currentJudge.achievements && currentJudge.achievements.length > 0 && (
            <div className="achievements">
              <h4>🌟 Achievements</h4>
              <ul>
                {currentJudge.achievements.slice(0, 2).map((achievement, index) => (
                  <li key={index}>{achievement}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Rotation Indicator */}
      {judges.length > 1 && (
        <div className="rotation-indicator">
          <div className="indicator-dots">
            {judges.map((_, index) => (
              <div
                key={index}
                className={`indicator-dot ${index === currentJudgeIndex ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
    </div>
  );
};

export default JudgeSpotlight;