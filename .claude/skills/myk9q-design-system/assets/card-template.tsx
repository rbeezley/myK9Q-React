/**
 * Card Component Template
 *
 * Standard card pattern used throughout myK9Q.
 * Use this template when creating new card-style components.
 *
 * Features:
 * - Hover effect with shadow and lift
 * - Optional status border on left
 * - Responsive padding
 * - Click handling
 * - Action buttons (favorite, menu)
 */

import React from 'react';
import { Heart, MoreHorizontal } from 'lucide-react';

interface CardTemplateProps {
  // Card data
  id: number;
  title: string;
  subtitle?: string;
  status?: 'pending' | 'in-progress' | 'completed';

  // State
  isFavorite?: boolean;

  // Handlers
  onClick?: () => void;
  onFavoriteToggle?: (id: number) => void;
  onMenuClick?: (id: number) => void;

  // Content
  children?: React.ReactNode;
}

export const CardTemplate: React.FC<CardTemplateProps> = ({
  id,
  title,
  subtitle,
  status,
  isFavorite = false,
  onClick,
  onFavoriteToggle,
  onMenuClick,
  children,
}) => {
  return (
    <div
      className={`card ${status ? `card--${status}` : ''}`}
      onClick={onClick}
    >
      {/* Action Buttons - Top Right */}
      <div className="card-actions">
        {onFavoriteToggle && (
          <button
            className={`favorite-button ${isFavorite ? 'favorited' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle(id);
            }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className="favorite-icon" />
          </button>
        )}

        {onMenuClick && (
          <button
            className="menu-button"
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick(id);
            }}
            aria-label="More options"
          >
            <MoreHorizontal className="menu-icon" />
          </button>
        )}
      </div>

      {/* Card Header */}
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </div>

      {/* Card Content */}
      {children && (
        <div className="card-content">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * Required CSS (add to your component's CSS file):
 *
 * ```css
 * .card {
 *   background: var(--card);
 *   border: 1px solid var(--border);
 *   border-radius: var(--token-radius-xl);
 *   padding: var(--token-space-lg);
 *   box-shadow: var(--token-shadow-sm);
 *   transition: var(--token-transition-normal);
 *   cursor: pointer;
 *   position: relative;
 *   overflow: visible;
 * }
 *
 * .card:hover {
 *   box-shadow: var(--token-shadow-md);
 *   border-color: var(--primary);
 *   transform: translateY(-2px);
 * }
 *
 * .card:active {
 *   transform: scale(0.98);
 * }
 *
 * /* Status border variants */
 * .card--pending {
 *   border-left: 3px solid var(--status-setup);
 * }
 *
 * .card--in-progress {
 *   border-left: 3px solid var(--status-in-progress);
 * }
 *
 * .card--completed {
 *   border-left: 3px solid var(--status-completed);
 * }
 *
 * /* Card Actions */
 * .card-actions {
 *   position: absolute;
 *   top: var(--token-space-lg);
 *   right: var(--token-space-lg);
 *   display: flex;
 *   flex-direction: column;
 *   gap: var(--token-space-md);
 *   z-index: 10;
 * }
 *
 * .favorite-button,
 * .menu-button {
 *   width: var(--token-space-4xl);
 *   height: var(--token-space-4xl);
 *   display: flex;
 *   align-items: center;
 *   justify-content: center;
 *   background: var(--muted);
 *   border: 1px solid var(--border);
 *   border-radius: var(--token-radius-md);
 *   cursor: pointer;
 *   transition: var(--token-transition-normal);
 *   color: var(--foreground);
 * }
 *
 * .favorite-button:hover,
 * .menu-button:hover {
 *   background: var(--primary);
 *   color: white;
 *   border-color: var(--primary);
 *   transform: scale(1.05);
 * }
 *
 * .favorite-button.favorited {
 *   color: var(--token-error-contrast);
 *   background: var(--danger-subtle);
 *   border-color: var(--token-error-contrast);
 * }
 *
 * .favorite-button.favorited .favorite-icon {
 *   fill: currentColor;
 * }
 *
 * /* Card Header */
 * .card-header {
 *   padding-right: 120px; /* Space for action buttons */
 * }
 *
 * .card-title {
 *   margin: 0;
 *   font-size: var(--token-font-xl);
 *   font-weight: var(--token-font-weight-semibold);
 *   color: var(--foreground);
 *   line-height: 1.2;
 * }
 *
 * .card:hover .card-title {
 *   color: var(--primary);
 * }
 *
 * .card-subtitle {
 *   margin: var(--token-space-sm) 0 0 0;
 *   font-size: var(--token-font-md);
 *   color: var(--token-text-secondary);
 * }
 *
 * /* Card Content */
 * .card-content {
 *   margin-top: var(--token-space-md);
 * }
 *
 * /* Desktop */
 * @media (min-width: 1024px) {
 *   .card {
 *     padding: var(--token-space-xl);
 *   }
 * }
 *
 * /* Dark Theme */
 * .theme-dark .card {
 *   box-shadow: 0 var(--token-space-xs) var(--token-space-md) rgba(0, 0, 0, 0.3);
 * }
 *
 * .theme-dark .card:hover {
 *   box-shadow: 0 var(--token-space-xs) var(--token-space-md) rgba(0, 0, 0, 0.3);
 * }
 *
 * /* Accessibility */
 * @media (prefers-reduced-motion: reduce) {
 *   .card,
 *   .favorite-button,
 *   .menu-button {
 *     animation: none;
 *     transition: none;
 *   }
 *
 *   .card:active {
 *     transform: none;
 *   }
 * }
 * ```
 */

/**
 * Usage Example:
 *
 * ```tsx
 * import { CardTemplate } from '@/components/CardTemplate';
 *
 * function MyComponent() {
 *   const handleClick = () => {
 *     console.log('Card clicked');
 *   };
 *
 *   const handleFavorite = (id: number) => {
 *     console.log('Favorite toggled for:', id);
 *   };
 *
 *   return (
 *     <CardTemplate
 *       id={1}
 *       title="Class Title"
 *       subtitle="Judge: John Doe"
 *       status="in-progress"
 *       isFavorite={false}
 *       onClick={handleClick}
 *       onFavoriteToggle={handleFavorite}
 *     >
 *       <div>Additional content here</div>
 *     </CardTemplate>
 *   );
 * }
 * ```
 */

/**
 * Customization Guide:
 *
 * 1. Add custom fields to the interface
 * 2. Add custom sections in the JSX
 * 3. Add custom CSS classes for your specific use case
 * 4. Keep the base card structure and patterns
 * 5. Follow the design token usage
 *
 * Example:
 * ```tsx
 * interface MyCardProps extends CardTemplateProps {
 *   customField: string;
 * }
 *
 * export const MyCard: React.FC<MyCardProps> = (props) => {
 *   return (
 *     <CardTemplate {...props}>
 *       <div className="my-card-custom-section">
 *         {props.customField}
 *       </div>
 *     </CardTemplate>
 *   );
 * };
 * ```
 */
