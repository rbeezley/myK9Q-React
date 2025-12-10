import React, { useState, useCallback, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Search,
  Loader2,
  AlertCircle,
  Info,
  Flag,
  Check,
  BookOpen,
  LayoutGrid,
  Trophy,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ChatbotService,
  ChatServiceError,
  formatToolName,
  getPopularQuestions,
  type ChatResponse,
  type ChatSources,
  type Rule,
  type ClassSummary,
  type EntryResult,
  type TrialSummary,
  type PopularQuestion,
} from '../../services/chatbotService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { logger } from '@/utils/logger';
import './AskMyK9Q.css';

interface AskMyK9QProps {
  isOpen: boolean;
  onClose: () => void;
}

type SourceType = 'rules' | 'classes' | 'entries' | 'trials';

// =============================================================================
// HELPER FUNCTIONS (extracted to reduce component complexity)
// =============================================================================

function parseOrgAndSport(orgString: string): { organizationCode: string; sportCode: string } {
  const parts = orgString.trim().split(/\s+/);
  const organizationCode = parts[0] || 'AKC';
  const sportName = parts.slice(1).join(' ').toLowerCase();

  const sportCodeMap: Record<string, string> = {
    'scent work': 'scent-work',
    'nosework': 'nosework',
    'obedience': 'obedience',
    'rally': 'rally',
    'fast cat': 'fast-cat',
  };

  const sportCode = sportCodeMap[sportName] || 'scent-work';
  return { organizationCode, sportCode };
}

function getSourceIcon(sourceType: SourceType) {
  switch (sourceType) {
    case 'rules': return BookOpen;
    case 'classes': return LayoutGrid;
    case 'entries': return Users;
    case 'trials': return Calendar;
    default: return MessageSquare;
  }
}

function getSourceLabel(sourceType: SourceType): string {
  switch (sourceType) {
    case 'rules': return 'Rules';
    case 'classes': return 'Classes';
    case 'entries': return 'Entries';
    case 'trials': return 'Trials';
    default: return sourceType;
  }
}

function getSourceCount(sources: ChatSources, sourceType: SourceType): number {
  const data = sources[sourceType];
  return Array.isArray(data) ? data.length : 0;
}

// =============================================================================
// ANSWER SECTION COMPONENT (extracted to reduce main component complexity)
// =============================================================================

interface AnswerSectionProps {
  response: ChatResponse;
  feedbackStatus: 'idle' | 'submitting' | 'success' | 'error';
  onReportIssue: () => void;
}

const AnswerSection: React.FC<AnswerSectionProps> = ({
  response,
  feedbackStatus,
  onReportIssue,
}) => (
  <div className="chat-answer-section">
    <div className="chat-answer-header">
      <div className="chat-answer-label">Answer</div>
      {response.toolsUsed && response.toolsUsed.length > 0 && (
        <div className="chat-tools-used">
          {response.toolsUsed.map((tool, idx) => (
            <span key={idx} className={`chat-tool-badge ${tool}`}>
              {formatToolName(tool)}
            </span>
          ))}
        </div>
      )}
    </div>
    <div className="chat-answer-text">{response.answer}</div>
    <button
      onClick={onReportIssue}
      className={`chat-report-issue-btn ${feedbackStatus === 'success' ? 'success' : ''}`}
      title={feedbackStatus === 'success' ? 'Issue reported' : 'Report an incorrect answer'}
      disabled={feedbackStatus === 'submitting' || feedbackStatus === 'success'}
    >
      {feedbackStatus === 'submitting' ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          <span>Reporting...</span>
        </>
      ) : feedbackStatus === 'success' ? (
        <>
          <Check size={14} />
          <span>Reported - Thanks!</span>
        </>
      ) : feedbackStatus === 'error' ? (
        <>
          <AlertCircle size={14} />
          <span>Failed - Retry</span>
        </>
      ) : (
        <>
          <Flag size={14} />
          <span>Report Issue</span>
        </>
      )}
    </button>
  </div>
);

// =============================================================================
// SOURCES SECTION COMPONENT (extracted to reduce main component complexity)
// =============================================================================

interface SourcesSectionProps {
  sources: ChatSources;
  expandedSource: SourceType | null;
  expandedRuleId: string | null;
  onToggleSource: (sourceType: SourceType) => void;
  onToggleRule: (ruleId: string) => void;
}

const SourcesSection: React.FC<SourcesSectionProps> = ({
  sources,
  expandedSource,
  expandedRuleId,
  onToggleSource,
  onToggleRule,
}) => (
  <div className="chat-sources">
    <div className="chat-sources-header">Sources</div>

    {(Object.keys(sources) as SourceType[]).map((sourceType) => {
      const count = getSourceCount(sources, sourceType);
      if (count === 0) return null;

      const Icon = getSourceIcon(sourceType);
      const isExpanded = expandedSource === sourceType;

      return (
        <div key={sourceType} className="chat-source-section">
          <button
            className="chat-source-header"
            onClick={() => onToggleSource(sourceType)}
            aria-expanded={isExpanded}
          >
            <div className="chat-source-title">
              <Icon size={16} />
              <span>{getSourceLabel(sourceType)}</span>
              <span className="chat-source-count">({count})</span>
            </div>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {isExpanded && (
            <div className="chat-source-content">
              {sourceType === 'rules' && (
                <RulesSourceList
                  rules={sources.rules || []}
                  expandedRuleId={expandedRuleId}
                  onToggleRule={onToggleRule}
                />
              )}
              {sourceType === 'classes' && (
                <ClassesSourceList classes={sources.classes || []} />
              )}
              {sourceType === 'entries' && (
                <EntriesSourceList entries={sources.entries || []} />
              )}
              {sourceType === 'trials' && (
                <TrialsSourceList trials={sources.trials || []} />
              )}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

export const AskMyK9Q: React.FC<AskMyK9QProps> = ({ isOpen, onClose }) => {
  const { showContext } = useAuth();
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [expandedSource, setExpandedSource] = useState<SourceType | null>(null);
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [_isOnline, setIsOnline] = useState(navigator.onLine);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [popularQuestions, setPopularQuestions] = useState<PopularQuestion[]>([]);

  const { organizationCode, sportCode } = showContext?.org
    ? parseOrgAndSport(showContext.org)
    : { organizationCode: 'AKC', sportCode: 'scent-work' };

  const handleSearch = useCallback(async (searchQuery: string) => {
    setFeedbackStatus('idle');

    if (!searchQuery.trim()) {
      setResponse(null);
      setError(null);
      setSearchPerformed(false);
      return;
    }

    if (!navigator.onLine) {
      setError('AskQ requires an internet connection. Your show data is still available offline in the app.');
      setSearchPerformed(true);
      setResponse(null);
      return;
    }

    if (!showContext?.licenseKey) {
      setError('Please log in to use AskQ.');
      setSearchPerformed(true);
      setResponse(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchPerformed(true);
    setExpandedSource(null);
    setExpandedRuleId(null);

    const startTime = Date.now();

    try {
      const result = await ChatbotService.sendMessage({
        message: searchQuery,
        licenseKey: showContext.licenseKey,
        organizationCode,
        sportCode,
      });

      // Minimum loading time for visual feedback
      const elapsed = Date.now() - startTime;
      if (elapsed < 500) {
        await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
      }

      setResponse(result);

      // Auto-expand first source type if available
      if (result.sources) {
        const firstSource = Object.keys(result.sources)[0] as SourceType | undefined;
        if (firstSource) {
          setExpandedSource(firstSource);
        }
      }
    } catch (err) {
      logger.error('[AskMyK9Q] Search error:', err);
      const chatError = err as ChatServiceError;
      setError(chatError.message || 'Failed to get response. Please try again.');
      setResponse(null);
    } finally {
      setIsLoading(false);
    }
  }, [showContext?.licenseKey, organizationCode, sportCode]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSearchClick = () => {
    handleSearch(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    handleSearch(example);
  };

  const toggleSourceExpansion = (sourceType: SourceType) => {
    setExpandedSource(expandedSource === sourceType ? null : sourceType);
  };

  const toggleRuleExpansion = (ruleId: string) => {
    setExpandedRuleId(expandedRuleId === ruleId ? null : ruleId);
  };

  const handleReportIssue = async () => {
    if (feedbackStatus === 'submitting' || feedbackStatus === 'success') return;

    setFeedbackStatus('submitting');

    try {
      const { error: insertError } = await supabase
        .from('chatbot_feedback')
        .insert({
          question: query,
          ai_response: response?.answer || '',
          tools_used: response?.toolsUsed || [],
          show_id: showContext?.showId ? parseInt(showContext.showId, 10) : null,
          license_key: showContext?.licenseKey || null,
        });

      if (insertError) {
        // If table doesn't exist, fall back to rules_feedback table
        if (insertError.code === '42P01') {
          const { error: fallbackError } = await supabase
            .from('rules_feedback')
            .insert({
              question: query,
              ai_response: response?.answer || '',
              show_id: showContext?.showId ? parseInt(showContext.showId, 10) : null,
              license_key: showContext?.licenseKey || null,
            });

          if (fallbackError) {
            logger.error('Failed to submit feedback:', fallbackError);
            setFeedbackStatus('error');
            setTimeout(() => setFeedbackStatus('idle'), 3000);
            return;
          }
        } else {
          logger.error('Failed to submit feedback:', insertError);
          setFeedbackStatus('error');
          setTimeout(() => setFeedbackStatus('idle'), 3000);
          return;
        }
      }

      setFeedbackStatus('success');
    } catch (err) {
      logger.error('Failed to submit feedback:', err);
      setFeedbackStatus('error');
      setTimeout(() => setFeedbackStatus('idle'), 3000);
    }
  };

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError(null);
    };
    const handleOffline = () => {
      setIsOnline(false);
      if (query.trim()) {
        setError('AskQ requires an internet connection. Your show data is still available offline in the app.');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [query]);

  // Clear state when panel closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResponse(null);
      setError(null);
      setSearchPerformed(false);
      setExpandedSource(null);
      setExpandedRuleId(null);
      setFeedbackStatus('idle');
    }
  }, [isOpen]);

  // Load popular questions when panel opens
  useEffect(() => {
    if (isOpen && popularQuestions.length === 0) {
      getPopularQuestions(6).then(setPopularQuestions).catch(() => {
        // Silently fail - will show empty state or defaults
      });
    }
  }, [isOpen, popularQuestions.length]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="chat-panel-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Panel */}
      <aside
        className="chat-panel"
        role="complementary"
        aria-label="AskQ"
      >
        {/* Header */}
        <div className="chat-panel-header">
          <div className="chat-panel-title">
            <MessageSquare size={24} />
            <h2>AskQ</h2>
          </div>
          <button
            onClick={onClose}
            className="chat-close-btn"
            aria-label="Close assistant"
          >
            <X size={24} />
          </button>
        </div>

        {/* Beta Disclaimer */}
        <div className="chat-beta-disclaimer">
          <AlertCircle size={16} />
          <span>
            <strong>Beta Feature:</strong> Ask about rules or your show data. Verify critical information.
          </span>
        </div>

        {/* Search Input */}
        <div className="chat-search-container">
          <div className="chat-search-input-wrapper">
            <Search className="chat-search-icon" size={20} />
            <input
              type="text"
              className="chat-search-input"
              placeholder="Ask about rules or your show..."
              value={query}
              onChange={handleQueryChange}
              onKeyPress={handleKeyPress}
              autoFocus
            />
            {isLoading && (
              <Loader2 className="chat-loading-icon" size={20} />
            )}
          </div>
          <button
            onClick={handleSearchClick}
            className="chat-search-btn"
            disabled={!query.trim() || isLoading}
          >
            Ask
          </button>
        </div>

        {/* Search Instruction */}
        {query.trim() && !searchPerformed && !isLoading && (
          <div className="chat-search-instruction">
            <Info size={14} />
            <span>Press Enter or click Ask</span>
          </div>
        )}

        {/* Help Text with Popular Questions */}
        {!searchPerformed && !query.trim() && (
          <div className="chat-help-section">
            <div className="chat-help-text">
              <Info size={16} />
              <span>Ask about rules, class schedules, entries, or results</span>
            </div>
            <div className="chat-dictation-tip">
              Tip: Use your keyboard's 🎤 button to speak your question
            </div>
            {popularQuestions.length > 0 && (
              <div className="chat-examples">
                <span className="chat-examples-label">
                  {popularQuestions.some(q => q.ask_count > 0) ? 'Popular questions:' : 'Try asking:'}
                </span>
                <div className="chat-example-chips">
                  {popularQuestions.map((pq, idx) => (
                    <button
                      key={idx}
                      className="chat-example-chip"
                      onClick={() => handleExampleClick(pq.query)}
                    >
                      {pq.query}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="chat-error-state">
            <AlertCircle size={24} />
            <p>{error}</p>
          </div>
        )}

        {/* Answer Section */}
        {!isLoading && response?.answer && (
          <AnswerSection
            response={response}
            feedbackStatus={feedbackStatus}
            onReportIssue={handleReportIssue}
          />
        )}

        {/* Sources Section */}
        {!isLoading && response?.sources && Object.keys(response.sources).length > 0 && (
          <SourcesSection
            sources={response.sources}
            expandedSource={expandedSource}
            expandedRuleId={expandedRuleId}
            onToggleSource={toggleSourceExpansion}
            onToggleRule={toggleRuleExpansion}
          />
        )}

        {/* Empty State */}
        {!isLoading && searchPerformed && !response?.answer && !error && (
          <div className="chat-empty-state">
            <MessageSquare size={48} opacity={0.3} />
            <p>No answer found for "{query}"</p>
            <p className="chat-empty-hint">Try rephrasing your question or using different keywords.</p>
          </div>
        )}
      </aside>
    </>
  );
};

// =============================================================================
// SOURCE LIST COMPONENTS
// =============================================================================

interface RulesSourceListProps {
  rules: Rule[];
  expandedRuleId: string | null;
  onToggleRule: (id: string) => void;
}

const RulesSourceList: React.FC<RulesSourceListProps> = ({
  rules,
  expandedRuleId,
  onToggleRule,
}) => {
  const formatMeasurement = (key: string, value: string | number | boolean): string => {
    const labels: Record<string, string> = {
      min_area_sq_ft: 'Min Area',
      max_area_sq_ft: 'Max Area',
      time_limit_minutes: 'Time Limit',
      min_hides: 'Min Hides',
      max_hides: 'Max Hides',
      max_leash_length_feet: 'Max Leash',
      warning_seconds: 'Warning Time',
    };

    const units: Record<string, string> = {
      min_area_sq_ft: 'sq ft',
      max_area_sq_ft: 'sq ft',
      time_limit_minutes: 'min',
      max_leash_length_feet: 'ft',
      warning_seconds: 'sec',
    };

    const label = labels[key] || key;
    const unit = units[key] || '';
    const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;

    return `${label}: ${displayValue}${unit ? ' ' + unit : ''}`;
  };

  return (
    <div className="chat-rules-list">
      {rules.map((rule) => (
        <div key={rule.id} className="chat-rule-card">
          <button
            className="chat-rule-header"
            onClick={() => onToggleRule(rule.id)}
            aria-expanded={expandedRuleId === rule.id}
          >
            <div className="chat-rule-title-section">
              <h4 className="chat-rule-title">{rule.title}</h4>
              <span className="chat-rule-section">{rule.section}</span>
            </div>
            <div className="chat-rule-badges">
              {rule.categories.level && (
                <span className="chat-badge level">{rule.categories.level}</span>
              )}
              {rule.categories.element && (
                <span className="chat-badge element">{rule.categories.element}</span>
              )}
            </div>
          </button>

          {expandedRuleId === rule.id && (
            <div className="chat-rule-content">
              <p>{rule.content}</p>
              {Object.keys(rule.measurements).length > 0 && (
                <div className="chat-measurements">
                  <h5>Key Measurements:</h5>
                  <ul>
                    {Object.entries(rule.measurements).map(([key, value]) => (
                      <li key={key}>{formatMeasurement(key, value as string | number | boolean)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

interface ClassesSourceListProps {
  classes: ClassSummary[];
}

const ClassesSourceList: React.FC<ClassesSourceListProps> = ({ classes }) => {
  const formatStatus = (status: string): string => {
    const statusLabels: Record<string, string> = {
      'no-status': 'Not Started',
      'setup': 'Setup',
      'briefing': 'Briefing',
      'break': 'On Break',
      'in_progress': 'In Progress',
      'completed': 'Completed',
    };
    return statusLabels[status] || status;
  };

  return (
    <div className="chat-data-table">
      <div className="chat-data-header">
        <span>Class</span>
        <span>Entries</span>
        <span>Status</span>
      </div>
      {classes.map((cls, idx) => (
        <div key={idx} className="chat-data-row">
          <div className="chat-data-cell primary">
            <span className="chat-class-name">{cls.element} {cls.level}{cls.section ? ` ${cls.section}` : ''}</span>
            {cls.judge_name && <span className="chat-class-judge">Judge: {cls.judge_name}</span>}
          </div>
          <div className="chat-data-cell">
            <span>{cls.scored_entries}/{cls.total_entries}</span>
            {cls.qualified_count > 0 && (
              <span className="chat-qualified-count">
                <Trophy size={12} /> {cls.qualified_count}Q
              </span>
            )}
          </div>
          <div className="chat-data-cell">
            <span className={`chat-status-badge ${cls.class_status}`}>
              {formatStatus(cls.class_status)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

interface EntriesSourceListProps {
  entries: EntryResult[];
}

const EntriesSourceList: React.FC<EntriesSourceListProps> = ({ entries }) => {
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const getOrdinal = (n: number): string => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  return (
    <div className="chat-data-table entries">
      <div className="chat-data-header">
        <span>#</span>
        <span>Dog/Handler</span>
        <span>Result</span>
      </div>
      {entries.map((entry, idx) => (
        <div key={idx} className="chat-data-row">
          <div className="chat-data-cell armband">
            <span className="chat-armband">{entry.armband_number}</span>
          </div>
          <div className="chat-data-cell primary">
            <span className="chat-dog-name">{entry.call_name}</span>
            <span className="chat-handler-name">{entry.handler}</span>
          </div>
          <div className="chat-data-cell result">
            {entry.is_scored ? (
              <>
                <span className={`chat-result-badge ${entry.result_status}`}>
                  {entry.result_status === 'qualified' ? 'Q' : 'NQ'}
                </span>
                {entry.time !== null && (
                  <span className="chat-time">{formatTime(entry.time)}</span>
                )}
                {entry.placement && entry.placement > 0 && entry.placement <= 4 && (
                  <span className="chat-placement-badge">{getOrdinal(entry.placement)}</span>
                )}
              </>
            ) : (
              <span className="chat-not-scored">-</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

interface TrialsSourceListProps {
  trials: TrialSummary[];
}

const TrialsSourceList: React.FC<TrialsSourceListProps> = ({ trials }) => {
  return (
    <div className="chat-trials-list">
      {trials.map((trial, idx) => (
        <div key={idx} className="chat-trial-card">
          <div className="chat-trial-name">
            {trial.trial_name || `Trial ${trial.trial_number}`}
          </div>
          <div className="chat-trial-details">
            <span className="chat-trial-date">
              <Calendar size={14} />
              {new Date(trial.trial_date).toLocaleDateString()}
            </span>
            {trial.competition_type && (
              <span className="chat-trial-type">{trial.competition_type}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AskMyK9Q;
