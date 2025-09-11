import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authenticatePasscode } from '../../services/authService';
import { useHapticFeedback } from '../../utils/hapticFeedback';
import './Login.css';

export const Login: React.FC = () => {
  const [passcode, setPasscode] = useState(['', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { login } = useAuth();
  const hapticFeedback = useHapticFeedback();

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // Only allow single character
    if (value.length > 1) {
      value = value.slice(-1);
    }

    // Light haptic feedback for typing
    if (value) {
      hapticFeedback.impact('light');
    }

    const newPasscode = [...passcode];
    newPasscode[index] = value.toUpperCase();
    setPasscode(newPasscode);

    // Auto-advance to next input
    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }

    // Clear error when typing
    if (error) {
      setError('');
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !passcode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }

    // Handle Enter to submit
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').toUpperCase().slice(0, 5);
    const newPasscode = [...passcode];
    
    for (let i = 0; i < pastedText.length && i < 5; i++) {
      newPasscode[i] = pastedText[i];
    }
    
    setPasscode(newPasscode);
    
    // Focus last filled input or last input if all filled
    const lastFilledIndex = Math.min(pastedText.length - 1, 4);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  const handleSubmit = async () => {
    const fullPasscode = passcode.join('');
    
    if (fullPasscode.length !== 5) {
      hapticFeedback.impact('heavy');
      setError('Please enter all 5 characters');
      return;
    }

    setIsLoading(true);
    setError('');
    hapticFeedback.impact('medium');

    try {
      // Authenticate passcode against Supabase database
      const showData = await authenticatePasscode(fullPasscode);
      
      if (!showData) {
        throw new Error('Invalid passcode');
      }

      // Login successful
      hapticFeedback.success();
      login(fullPasscode, showData);
      navigate('/home');
    } catch (err) {
      console.error('Login error:', err);
      hapticFeedback.impact('heavy');
      setError('Invalid passcode. Please check and try again.');
      setPasscode(['', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Purple gradient background matching Flutter */}
      <div className="login-background" />
      
      <div className="login-content">
        {/* Logo and Branding */}
        <div className="logo-container">
          <div className="logo-circle">
            <svg className="logo-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="48" fill="none" stroke="white" strokeWidth="2" />
              <text x="50" y="65" textAnchor="middle" fontSize="40" fill="white">Q</text>
              {/* Simple dog silhouette */}
              <path d="M 30 45 Q 35 35, 45 40 L 45 55 L 35 55 L 35 50 Q 30 50, 30 45" 
                    fill="white" opacity="0.9" transform="scale(0.8) translate(15, 10)" />
            </svg>
          </div>
          
          <h1 className="app-title">myK9Q</h1>
          <p className="version">v2.0.8</p>
          <p className="tagline">Queue and Qualify</p>
        </div>

        {/* Passcode Input Section */}
        <div className="passcode-section">
          <p className="instruction">Enter Pass Code provided by Host Club</p>
          
          <div className="passcode-inputs">
            {passcode.map((digit, index) => (
              <div key={index} className="input-wrapper">
                <input
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={`passcode-input ${error ? 'error' : ''}`}
                  disabled={isLoading}
                  inputMode="text"
                  autoComplete="off"
                  aria-label={`Passcode digit ${index + 1}`}
                />
                <div className="input-dot" />
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="loading-message">
              Validating passcode...
            </div>
          )}
        </div>

        {/* Information Section */}
        <div className="info-section">
          <p className="info-text">
            myK9Q allows exhibitors to check-in, indicate conflicts, view running 
            order and preliminary results.
          </p>
          <p className="info-text">
            Eliminates manual data entry by the trial secretary.
          </p>
          <p className="website-link">
            Visit www.myk9t.com for more information.
          </p>
          <p className="requirements">
            ** Requires reliable internet connectivity<br />
            via Cellular data service or Wi-Fi.
          </p>
        </div>

        {/* Help Button */}
        <button 
          className="help-button"
          onClick={() => {
            hapticFeedback.impact('light');
            window.open('https://www.myk9t.com/help', '_blank');
          }}
        >
          <span className="help-icon">?</span>
          <span>Help</span>
        </button>
      </div>
    </div>
  );
};