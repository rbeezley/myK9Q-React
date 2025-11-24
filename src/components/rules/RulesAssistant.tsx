import React, { useState, useCallback, useEffect } from 'react';
import {  X,
  BookOpen,
  Search,
  Loader2,
  AlertCircle,
  Info
} from 'lucide-react';
import { RulesService, type Rule, type RulesServiceError } from '../../services/rulesService';
import './RulesAssistant.css';

interface RulesAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesAssistant: React.FC<RulesAssistantProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(async (searchQuery: string, forceRefresh = false) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setAnswer(null);
      setError(null);
      setSearchPerformed(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchPerformed(true);

    // Ensure minimum loading time for visual feedback (500ms)
    const startTime = Date.now();

    try {
      console.log('📚 [RulesAssistant] Searching for:', searchQuery, forceRefresh ? '(forcing refresh)' : '');

      // Clear cache for this query if forceRefresh is true
      if (forceRefresh) {
        RulesService.clearCacheForQuery(searchQuery);
      }

      const response = await RulesService.searchRules({ query: searchQuery });

      // Wait for minimum time to show loading state
      const elapsed = Date.now() - startTime;
      if (elapsed < 500) {
        await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
      }

      console.log('📚 [RulesAssistant] Search results:', response.results.length, 'rules found');
      console.log('📚 [RulesAssistant] Answer:', response.answer);

      setAnswer(response.answer);
      setResults(response.results);

      if (response.results.length === 0) {
        setError('No rules found matching your search. Try different keywords or be more specific.');
      }
    } catch (err) {
      console.error('📚 [RulesAssistant] Search error:', err);
      const error = err as RulesServiceError;
      setError(error.message || 'Failed to search rules. Please try again.');
      setAnswer(null);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search (800ms)
    const timeout = setTimeout(() => {
      handleSearch(newQuery);
    }, 800);

    setSearchTimeout(timeout);
  };

  const handleSearchClick = () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    // Force a fresh search when button is clicked explicitly
    handleSearch(query, true);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      // Force a fresh search when Enter is pressed
      handleSearch(query, true);
    }
  };

  const toggleRuleExpansion = (ruleId: string) => {
    setExpandedRuleId(expandedRuleId === ruleId ? null : ruleId);
  };

  const formatMeasurement = (key: string, value: any): string => {
    const labels: Record<string, string> = {
      min_area_sq_ft: 'Min Area',
      max_area_sq_ft: 'Max Area',
      time_limit_minutes: 'Time Limit',
      min_height_inches: 'Min Height',
      max_height_inches: 'Max Height',
      min_hides: 'Min Hides',
      max_hides: 'Max Hides',
      num_containers: 'Containers',
      max_leash_length_feet: 'Max Leash',
      warning_seconds: 'Warning Time',
    };

    const units: Record<string, string> = {
      min_area_sq_ft: 'sq ft',
      max_area_sq_ft: 'sq ft',
      time_limit_minutes: 'min',
      min_height_inches: 'in',
      max_height_inches: 'in',
      max_leash_length_feet: 'ft',
      warning_seconds: 'sec',
    };

    const label = labels[key] || key;
    const unit = units[key] || '';

    return `${label}: ${value}${unit ? ' ' + unit : ''}`;
  };

  // Clear search when panel closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setAnswer(null);
      setResults([]);
      setError(null);
      setSearchPerformed(false);
      setExpandedRuleId(null);
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    }
  }, [isOpen, searchTimeout]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="rules-panel-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Panel */}
      <aside
        className="rules-panel"
        role="complementary"
        aria-label="Rules Assistant"
      >
        {/* Header */}
        <div className="rules-panel-header">
          <div className="rules-panel-title">
            <BookOpen size={24} />
            <h2>Rules Assistant</h2>
          </div>
          <button
            onClick={onClose}
            className="rules-close-btn"
            aria-label="Close rules assistant"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search Input */}
        <div className="rules-search-container">
          <div className="rules-search-input-wrapper">
            <Search className="rules-search-icon" size={20} />
            <input
              type="text"
              className="rules-search-input"
              placeholder="Ask about AKC Scent Work rules..."
              value={query}
              onChange={handleQueryChange}
              onKeyPress={handleKeyPress}
              autoFocus
            />
            {isLoading && (
              <Loader2 className="rules-loading-icon" size={20} />
            )}
          </div>
          <button
            onClick={handleSearchClick}
            className="rules-search-btn"
            disabled={!query.trim() || isLoading}
          >
            Search
          </button>
        </div>

        {/* Help Text */}
        {!searchPerformed && (
          <div className="rules-help-text">
            <Info size={16} />
            <span>
              Try: "what is the area size for exterior advanced?" or "how many hides in master buried?"
            </span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rules-error-state">
            <AlertCircle size={24} />
            <p>{error}</p>
          </div>
        )}

        {/* Answer Section */}
        {!isLoading && answer && (
          <div className="rules-answer-section">
            <div className="rules-answer-label">Answer:</div>
            <div className="rules-answer-text">{answer}</div>
            {results.length > 0 && (
              <div className="rules-source-hint">
                View full rule details below for complete context
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {!isLoading && results.length > 0 && (
          <div className="rules-results">
            <div className="rules-results-header">
              <span>{answer ? 'Source Rules' : `Found ${results.length} ${results.length === 1 ? 'rule' : 'rules'}`} ({results.length})</span>
            </div>

            <div className="rules-results-list">
              {results.map((rule) => (
                <div key={rule.id} className="rules-result-card">
                  {/* Rule Header */}
                  <button
                    className="rules-result-header"
                    onClick={() => toggleRuleExpansion(rule.id)}
                    aria-expanded={expandedRuleId === rule.id}
                  >
                    <div className="rules-result-title-section">
                      <h3 className="rules-result-title">{rule.title}</h3>
                      <span className="rules-result-section">{rule.section}</span>
                    </div>
                    <div className="rules-result-categories">
                      {rule.categories.level && (
                        <span className="rules-category-badge level">{rule.categories.level}</span>
                      )}
                      {rule.categories.element && (
                        <span className="rules-category-badge element">{rule.categories.element}</span>
                      )}
                    </div>
                  </button>

                  {/* Rule Content (Expandable) */}
                  {expandedRuleId === rule.id && (
                    <div className="rules-result-content">
                      <p className="rules-content-text">{rule.content}</p>

                      {/* Measurements */}
                      {Object.keys(rule.measurements).length > 0 && (
                        <div className="rules-measurements">
                          <h4>Key Measurements:</h4>
                          <ul>
                            {Object.entries(rule.measurements).map(([key, value]) => (
                              <li key={key}>{formatMeasurement(key, value)}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Keywords */}
                      {rule.keywords.length > 0 && (
                        <div className="rules-keywords">
                          <span>Keywords:</span>
                          <div className="rules-keyword-tags">
                            {rule.keywords.slice(0, 8).map((keyword, idx) => (
                              <span key={idx} className="rules-keyword-tag">{keyword}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State (after search with no results) */}
        {!isLoading && searchPerformed && results.length === 0 && !error && (
          <div className="rules-empty-state">
            <BookOpen size={48} opacity={0.3} />
            <p>No rules found for "{query}"</p>
            <p className="rules-empty-hint">Try using different keywords or asking in a different way.</p>
          </div>
        )}
      </aside>
    </>
  );
};
