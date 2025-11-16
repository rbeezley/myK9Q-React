/**
 * Form Section Component Template
 *
 * Standard form section pattern used throughout myK9Q.
 * Use this template when creating forms or settings screens.
 *
 * Features:
 * - Proper label/input associations
 * - Inline validation error messages
 * - Toggle switches with labels
 * - Select dropdowns
 * - Text inputs
 * - Datetime inputs
 * - Accessible (ARIA attributes)
 * - Consistent spacing and styling
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  /** Field label */
  label: string;

  /** Input element ID (required for label association) */
  id: string;

  /** Field is required */
  required?: boolean;

  /** Error message (if validation failed) */
  error?: string;

  /** Help text / description */
  helpText?: string;

  /** Field content (input, select, toggle, etc.) */
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  required = false,
  error,
  helpText,
  children,
}) => {
  return (
    <div className="form-field">
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span className="form-required" aria-label="required">*</span>}
      </label>

      <div className="form-input-wrapper">
        {children}
      </div>

      {error && (
        <div className="form-error" role="alert">
          <AlertCircle className="form-error-icon" size={14} />
          <span className="form-error-text">{error}</span>
        </div>
      )}

      {helpText && !error && (
        <p className="form-help-text">{helpText}</p>
      )}
    </div>
  );
};

/**
 * Text Input Component
 */
interface TextInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'number' | 'password';
  disabled?: boolean;
  error?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  id,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  error = false,
}) => {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      aria-invalid={error}
      className={`form-input ${error ? 'form-input--error' : ''}`}
    />
  );
};

/**
 * Select Dropdown Component
 */
interface SelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  error?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  id,
  value,
  onChange,
  options,
  disabled = false,
  error = false,
}) => {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-invalid={error}
      className={`form-select ${error ? 'form-select--error' : ''}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

/**
 * Toggle Switch Component
 */
interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`toggle-switch ${checked ? 'toggle-switch--checked' : ''}`}
    >
      <span className="toggle-switch-track">
        <span className="toggle-switch-thumb" />
      </span>
    </button>
  );
};

/**
 * Datetime Input Component
 */
interface DatetimeInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export const DatetimeInput: React.FC<DatetimeInputProps> = ({
  id,
  value,
  onChange,
  disabled = false,
  error = false,
}) => {
  return (
    <input
      id={id}
      type="datetime-local"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-invalid={error}
      className={`form-input form-input--datetime ${error ? 'form-input--error' : ''}`}
    />
  );
};

/**
 * Required CSS (add to your component's CSS file):
 *
 * ```css
 * /* Form Field */
 * .form-field {
 *   display: flex;
 *   flex-direction: column;
 *   gap: var(--token-space-sm);
 * }
 *
 * .form-label {
 *   font-size: var(--token-font-md);
 *   font-weight: var(--token-font-weight-medium);
 *   color: var(--foreground);
 *   line-height: 1.4;
 * }
 *
 * .form-required {
 *   color: var(--token-error);
 *   margin-left: var(--token-space-xs);
 * }
 *
 * .form-input-wrapper {
 *   display: flex;
 *   flex-direction: column;
 * }
 *
 * /* Text Input */
 * .form-input {
 *   width: 100%;
 *   padding: var(--token-space-md) var(--token-space-lg);
 *   border: 1px solid var(--border);
 *   border-radius: var(--token-radius-md);
 *   background: var(--background);
 *   color: var(--foreground);
 *   font-size: var(--token-font-md);
 *   font-family: inherit;
 *   transition: var(--token-transition-fast);
 *   min-height: var(--min-touch-target);
 * }
 *
 * .form-input:focus {
 *   outline: none;
 *   border-color: var(--primary);
 *   box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
 * }
 *
 * .form-input::placeholder {
 *   color: var(--token-text-tertiary);
 * }
 *
 * .form-input:disabled {
 *   background: var(--muted);
 *   color: var(--token-text-tertiary);
 *   cursor: not-allowed;
 * }
 *
 * .form-input--error {
 *   border-color: var(--token-error);
 * }
 *
 * .form-input--error:focus {
 *   box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.1);
 * }
 *
 * /* Datetime Input */
 * .form-input--datetime {
 *   /* Browser-specific styles */
 * }
 *
 * .theme-dark .form-input--datetime::-webkit-calendar-picker-indicator {
 *   filter: invert(1);
 * }
 *
 * /* Select Dropdown */
 * .form-select {
 *   width: 100%;
 *   padding: var(--token-space-md) var(--token-space-lg);
 *   border: 1px solid var(--border);
 *   border-radius: var(--token-radius-md);
 *   background: var(--background);
 *   color: var(--foreground);
 *   font-size: var(--token-font-md);
 *   font-family: inherit;
 *   transition: var(--token-transition-fast);
 *   min-height: var(--min-touch-target);
 *   cursor: pointer;
 * }
 *
 * .form-select:focus {
 *   outline: none;
 *   border-color: var(--primary);
 *   box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
 * }
 *
 * .form-select:disabled {
 *   background: var(--muted);
 *   color: var(--token-text-tertiary);
 *   cursor: not-allowed;
 * }
 *
 * .form-select--error {
 *   border-color: var(--token-error);
 * }
 *
 * /* Toggle Switch */
 * .toggle-switch {
 *   display: inline-flex;
 *   align-items: center;
 *   cursor: pointer;
 *   background: none;
 *   border: none;
 *   padding: 0;
 * }
 *
 * .toggle-switch:disabled {
 *   cursor: not-allowed;
 *   opacity: 0.5;
 * }
 *
 * .toggle-switch-track {
 *   position: relative;
 *   width: 51px;
 *   height: 31px;
 *   background: var(--muted);
 *   border: 1px solid var(--border);
 *   border-radius: var(--token-radius-full);
 *   transition: var(--token-transition-fast);
 * }
 *
 * .toggle-switch--checked .toggle-switch-track {
 *   background: var(--primary);
 *   border-color: var(--primary);
 * }
 *
 * .toggle-switch-thumb {
 *   position: absolute;
 *   top: 2px;
 *   left: 2px;
 *   width: 27px;
 *   height: 27px;
 *   background: white;
 *   border-radius: var(--token-radius-full);
 *   transition: var(--token-transition-normal);
 *   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
 * }
 *
 * .toggle-switch--checked .toggle-switch-thumb {
 *   transform: translateX(20px);
 * }
 *
 * .toggle-switch:focus-visible .toggle-switch-track {
 *   outline: 2px solid var(--primary);
 *   outline-offset: 2px;
 * }
 *
 * /* Error Message */
 * .form-error {
 *   display: flex;
 *   align-items: center;
 *   gap: var(--token-space-xs);
 *   color: var(--token-error);
 *   font-size: var(--token-font-sm);
 *   line-height: 1.4;
 * }
 *
 * .form-error-icon {
 *   flex-shrink: 0;
 * }
 *
 * .form-error-text {
 *   flex: 1;
 * }
 *
 * /* Help Text */
 * .form-help-text {
 *   margin: 0;
 *   font-size: var(--token-font-sm);
 *   color: var(--token-text-secondary);
 *   line-height: 1.4;
 * }
 *
 * /* Accessibility */
 * @media (prefers-reduced-motion: reduce) {
 *   .form-input,
 *   .form-select,
 *   .toggle-switch-track,
 *   .toggle-switch-thumb {
 *     transition: none;
 *   }
 * }
 * ```
 */

/**
 * Usage Examples:
 *
 * ```tsx
 * import { FormField, TextInput, Select, ToggleSwitch, DatetimeInput } from '@/components/Form';
 *
 * function MyForm() {
 *   const [name, setName] = useState('');
 *   const [email, setEmail] = useState('');
 *   const [level, setLevel] = useState('novice');
 *   const [enabled, setEnabled] = useState(false);
 *   const [startTime, setStartTime] = useState('');
 *   const [errors, setErrors] = useState({});
 *
 *   return (
 *     <form>
 *       {/* Text input with validation */}
 *       <FormField
 *         label="Dog Name"
 *         id="dog-name"
 *         required
 *         error={errors.name}
 *         helpText="Enter your dog's call name"
 *       >
 *         <TextInput
 *           id="dog-name"
 *           value={name}
 *           onChange={setName}
 *           placeholder="e.g., Max"
 *           error={!!errors.name}
 *         />
 *       </FormField>
 *
 *       {/* Email input */}
 *       <FormField
 *         label="Email"
 *         id="email"
 *         required
 *       >
 *         <TextInput
 *           id="email"
 *           type="email"
 *           value={email}
 *           onChange={setEmail}
 *           placeholder="your@email.com"
 *         />
 *       </FormField>
 *
 *       {/* Select dropdown */}
 *       <FormField
 *         label="Level"
 *         id="level"
 *       >
 *         <Select
 *           id="level"
 *           value={level}
 *           onChange={setLevel}
 *           options={[
 *             { value: 'novice', label: 'Novice' },
 *             { value: 'advanced', label: 'Advanced' },
 *             { value: 'excellent', label: 'Excellent' },
 *           ]}
 *         />
 *       </FormField>
 *
 *       {/* Toggle switch */}
 *       <FormField
 *         label="Enable Self Check-in"
 *         id="self-checkin"
 *       >
 *         <ToggleSwitch
 *           id="self-checkin"
 *           checked={enabled}
 *           onChange={setEnabled}
 *         />
 *       </FormField>
 *
 *       {/* Datetime input */}
 *       <FormField
 *         label="Planned Start Time"
 *         id="start-time"
 *       >
 *         <DatetimeInput
 *           id="start-time"
 *           value={startTime}
 *           onChange={setStartTime}
 *         />
 *       </FormField>
 *     </form>
 *   );
 * }
 * ```
 */

/**
 * Accessibility Notes:
 *
 * - All inputs have associated labels via htmlFor/id
 * - Required fields marked with asterisk and aria-label
 * - Error messages have role="alert" for screen readers
 * - Invalid inputs have aria-invalid attribute
 * - Toggle switches use role="switch" and aria-checked
 * - Focus indicators visible on all inputs
 * - Help text provides additional context
 * - Touch targets meet 44x44px minimum
 */

/**
 * Validation Pattern:
 *
 * ```tsx
 * const validateForm = () => {
 *   const newErrors = {};
 *
 *   if (!name.trim()) {
 *     newErrors.name = 'Dog name is required';
 *   }
 *
 *   if (!email.includes('@')) {
 *     newErrors.email = 'Please enter a valid email';
 *   }
 *
 *   setErrors(newErrors);
 *   return Object.keys(newErrors).length === 0;
 * };
 *
 * const handleSubmit = (e) => {
 *   e.preventDefault();
 *   if (validateForm()) {
 *     // Submit form
 *   }
 * };
 * ```
 */

/**
 * Testing Checklist:
 *
 * - [ ] Labels are associated with inputs
 * - [ ] Required fields show asterisk
 * - [ ] Error messages display correctly
 * - [ ] Help text displays when no error
 * - [ ] Inputs accept user input
 * - [ ] Selects show all options
 * - [ ] Toggle switches toggle on click
 * - [ ] Datetime picker opens correctly
 * - [ ] Focus indicators visible
 * - [ ] Validation errors prevent submission
 * - [ ] Disabled state works
 * - [ ] Touch targets are 44x44px minimum
 * - [ ] Works in light theme
 * - [ ] Works in dark theme
 * - [ ] Screen reader announces labels and errors
 */
