/**
 * FAQ Section Component
 *
 * Displays browsable FAQ content organized by category.
 * Works offline - content is bundled in the app.
 */

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Rocket,
  Search,
  CheckCircle,
  ClipboardList,
  BarChart2,
  Bell,
  Users,
  Shield,
  WifiOff,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { faqCategories, type FAQCategory } from '../../data/faqContent';

// Icon mapping for categories
const categoryIcons: Record<FAQCategory['icon'], React.ComponentType<{ size?: number }>> = {
  'rocket': Rocket,
  'search': Search,
  'check-circle': CheckCircle,
  'clipboard': ClipboardList,
  'bar-chart': BarChart2,
  'bell': Bell,
  'users': Users,
  'shield': Shield,
  'wifi-off': WifiOff,
  'settings': Settings,
  'help-circle': HelpCircle,
};

interface FAQSectionProps {
  /** Filter to show only specific category IDs */
  filterCategories?: string[];
  /** Callback when user wants to ask AI about a topic */
  onAskAI?: (question: string) => void;
  /** Maximum height before scrolling (CSS value) */
  maxHeight?: string;
}

export const FAQSection: React.FC<FAQSectionProps> = ({
  filterCategories,
  onAskAI,
  maxHeight = '100%',
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  // Filter categories if specified
  const displayCategories = filterCategories
    ? faqCategories.filter(cat => filterCategories.includes(cat.id))
    : faqCategories;

  const toggleCategory = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
      setExpandedQuestion(null);
    } else {
      setExpandedCategory(categoryId);
      setExpandedQuestion(null);
    }
  };

  const toggleQuestion = (questionKey: string) => {
    setExpandedQuestion(expandedQuestion === questionKey ? null : questionKey);
  };

  const handleAskAI = (question: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onAskAI?.(question);
  };

  return (
    <div className="faq-section" style={{ maxHeight, overflowY: 'auto' }}>
      <div className="faq-categories">
        {displayCategories.map((category) => {
          const IconComponent = categoryIcons[category.icon];
          const isExpanded = expandedCategory === category.id;

          return (
            <div key={category.id} className="faq-category">
              {/* Category Header */}
              <button
                className={`faq-category-header ${isExpanded ? 'expanded' : ''}`}
                onClick={() => toggleCategory(category.id)}
                aria-expanded={isExpanded}
              >
                <div className="faq-category-title">
                  <IconComponent size={18} />
                  <span>{category.title}</span>
                  <span className="faq-category-count">({category.items.length})</span>
                </div>
                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>

              {/* Questions List */}
              {isExpanded && (
                <div className="faq-questions">
                  {category.items.map((item, idx) => {
                    const questionKey = `${category.id}-${idx}`;
                    const isQuestionExpanded = expandedQuestion === questionKey;

                    return (
                      <div key={questionKey} className="faq-question">
                        <button
                          className={`faq-question-header ${isQuestionExpanded ? 'expanded' : ''}`}
                          onClick={() => toggleQuestion(questionKey)}
                          aria-expanded={isQuestionExpanded}
                        >
                          <span className="faq-question-text">{item.question}</span>
                          {isQuestionExpanded ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>

                        {isQuestionExpanded && (
                          <div className="faq-answer">
                            <p>{item.answer}</p>
                            {onAskAI && (
                              <button
                                className="faq-ask-ai-btn"
                                onClick={(e) => handleAskAI(item.question, e)}
                                title="Ask AskQ for more details"
                              >
                                Ask AI for more details →
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FAQSection;
