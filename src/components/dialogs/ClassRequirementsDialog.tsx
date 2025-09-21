import React, { useState, useEffect } from 'react';
import { X, Clock, Users, MapPin, AlertTriangle, Target, Ruler, Package, Speech } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import './ClassRequirementsDialog.css';

interface ClassRequirementsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSetMaxTime?: () => void;
  classData: {
    id: number;
    element: string;
    level: string;
    class_name: string;
    time_limit?: string;
    time_limit2?: string;
    time_limit3?: string;
    entry_count: number;
  };
}

interface AKCRequirements {
  akc_class_requirements_id: number;
  element: string;
  level: string;
  hides: string;
  distractions: string;
  height: string;
  required_calls: string;
  area_count: number;
  time_limit_text: string;
  containers: string;
  area_size: string;
}

interface UKCRequirements {
  ukc_class_requirements_id: number;
  element: string;
  level: string;
  items: string;
  hides: string;
  distractions: string;
  time_limit_text: string;
  height: string;
  area_count: number;
  final_response: string;
  area_size: string;
}

export const ClassRequirementsDialog: React.FC<ClassRequirementsDialogProps> = ({
  isOpen,
  onClose,
  onSetMaxTime,
  classData
}) => {
  const { showContext } = useAuth();
  const [requirements, setRequirements] = useState<AKCRequirements | UKCRequirements | null>(null);
  const [loading, setLoading] = useState(false);
  const [organization, setOrganization] = useState<'AKC' | 'UKC' | null>(null);

  useEffect(() => {
    if (isOpen && classData) {
      loadRequirements();
    }
  }, [isOpen, classData]);

  const loadRequirements = async () => {
    if (!showContext?.licenseKey) return;

    setLoading(true);
    try {
      console.log('🔍 ClassRequirementsDialog - Debug Info:');
      console.log('License Key:', showContext.licenseKey);
      console.log('Class Data:', classData);
      console.log('Element:', classData.element);
      console.log('Level:', classData.level);

      // First, get the organization from the show data
      const { data: showData, error: showError } = await supabase
        .from('tbl_show_queue')
        .select('org')
        .eq('mobile_app_lic_key', showContext.licenseKey)
        .single();

      if (showError || !showData) {
        console.error('❌ Error fetching show data:', showError);
        return;
      }

      const org = showData.org;
      console.log('📋 Organization:', org);
      const isAKC = org.includes('AKC');
      const isUKC = org.includes('UKC');
      console.log('🏢 Is AKC:', isAKC, 'Is UKC:', isUKC);

      setOrganization(isAKC ? 'AKC' : isUKC ? 'UKC' : null);

      // Query the appropriate requirements table
      let requirementsData = null;

      if (isAKC) {
        console.log('🔎 Querying AKC requirements with:', { element: classData.element, level: classData.level });
        const { data, error } = await supabase
          .from('tbl_akc_class_requirements')
          .select('*')
          .eq('element', classData.element)
          .eq('level', classData.level)
          .single();

        console.log('📊 AKC Query Result:', { data, error });
        if (!error && data) {
          requirementsData = data;
        }
      } else if (isUKC) {
        console.log('🔎 Querying UKC requirements with:', { element: classData.element, level: classData.level });
        const { data, error } = await supabase
          .from('tbl_ukc_class_requirements')
          .select('*')
          .eq('element', classData.element)
          .eq('level', classData.level)
          .single();

        console.log('📊 UKC Query Result:', { data, error });
        if (!error && data) {
          requirementsData = data;
        }
      }

      console.log('✅ Final Requirements Data:', requirementsData);
      setRequirements(requirementsData);
    } catch (error) {
      console.error('💥 Error loading requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaxTimeDisplay = () => {
    // Check if any judge-set max times exist
    const area1Time = classData.time_limit;
    const area2Time = classData.time_limit2;
    const area3Time = classData.time_limit3;

    const setTimes = [area1Time, area2Time, area3Time].filter(time => time && time !== '00:00');

    if (setTimes.length > 0) {
      // Show judge-set times
      if (setTimes.length === 1) {
        return `${setTimes[0]} (set by judge)`;
      } else {
        return `${setTimes.join(', ')} (set by judge)`;
      }
    }

    // Fall back to requirements text
    if (requirements && 'time_limit_text' in requirements) {
      return `${requirements.time_limit_text} (range allowed)`;
    }

    return 'Not specified';
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-container" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <div className="dialog-title">
            <Package className="title-icon" />
            <span>Class Requirements</span>
          </div>
          <button className="close-button" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="dialog-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Loading requirements...</p>
            </div>
          ) : requirements ? (
            <>
              {/* Class Info Header */}
              <div className="class-info-header">
                <h3 className="class-title">{classData.element} {classData.level}</h3>
                <div className="class-meta">
                  <span className="org-badge">{organization}</span>
                  <span className="entry-count">
                    <Users className="h-4 w-4" />
                    {classData.entry_count} {classData.entry_count === 1 ? 'Dog' : 'Dogs'}
                  </span>
                </div>
              </div>

              {/* Requirements Grid */}
              <div className="requirements-grid">
                {/* Max Time */}
                <div
                  className={`requirement-item ${onSetMaxTime ? 'requirement-item-clickable' : ''}`}
                  onClick={onSetMaxTime}
                  role={onSetMaxTime ? "button" : undefined}
                  tabIndex={onSetMaxTime ? 0 : undefined}
                >
                  <div className="requirement-icon">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="requirement-content">
                    <label>Max Time</label>
                    <div className="requirement-value">{getMaxTimeDisplay()}</div>
                  </div>
                </div>

                {/* Hides */}
                <div className="requirement-item">
                  <div className="requirement-icon">
                    <Target className="h-5 w-5" />
                  </div>
                  <div className="requirement-content">
                    <label>Hides</label>
                    <div className="requirement-value">{requirements.hides}</div>
                  </div>
                </div>

                {/* Distractions */}
                <div className="requirement-item">
                  <div className="requirement-icon">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="requirement-content">
                    <label>Distractions</label>
                    <div className="requirement-value">{requirements.distractions}</div>
                  </div>
                </div>

                {/* Required Calls (AKC) or Final Response (UKC) */}
                <div className="requirement-item">
                  <div className="requirement-icon">
                    <Speech className="h-5 w-5" />
                  </div>
                  <div className="requirement-content">
                    <label>
                      {'required_calls' in requirements ? 'Required Calls' : 'Final Response'}
                    </label>
                    <div className="requirement-value">
                      {'required_calls' in requirements
                        ? requirements.required_calls
                        : (requirements as UKCRequirements).final_response}
                    </div>
                  </div>
                </div>

                {/* Height */}
                {requirements.height && requirements.height !== '-' && (
                  <div className="requirement-item">
                    <div className="requirement-icon">
                      <Ruler className="h-5 w-5" />
                    </div>
                    <div className="requirement-content">
                      <label>Max Height</label>
                      <div className="requirement-value">{requirements.height}</div>
                    </div>
                  </div>
                )}

                {/* Arrangement - Only for Container, Buried, and Handler Discrimination Novice */}
                {(classData.element === 'Container' ||
                  classData.element === 'Buried' ||
                  (classData.element === 'Handler Discrimination' && classData.level === 'Novice A')) && (
                  <div className="requirement-item">
                    <div className="requirement-icon">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="requirement-content">
                      <label>Arrangement</label>
                      <div className="requirement-value">
                        {'containers' in requirements
                          ? requirements.containers || '-'
                          : (requirements as UKCRequirements).items || '-'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Area Size */}
                {requirements.area_size && requirements.area_size !== '-' && (
                  <div className="requirement-item">
                    <div className="requirement-icon">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="requirement-content">
                      <label>Area Size</label>
                      <div className="requirement-value">{requirements.area_size}</div>
                    </div>
                  </div>
                )}

                {/* Area Count */}
                {requirements.area_count > 1 && (
                  <div className="requirement-item">
                    <div className="requirement-icon">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="requirement-content">
                      <label>Areas</label>
                      <div className="requirement-value">{requirements.area_count}</div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-data-state">
              <Package className="no-data-icon" />
              <h3>No Requirements Found</h3>
              <p>Requirements data is not available for this class combination.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};