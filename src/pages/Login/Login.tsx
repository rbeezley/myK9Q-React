import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authenticatePasscode } from '../../services/authService';
import './Login.css';

export const Login: React.FC = () => {
  const [passcode, setPasscode] = useState(['', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // Only allow single character
    if (value.length > 1) {
      value = value.slice(-1);
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
      setError('Please enter all 5 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Authenticate passcode against Supabase database
      const showData = await authenticatePasscode(fullPasscode);
      
      if (!showData) {
        throw new Error('Invalid passcode');
      }

      // Login successful
      login(fullPasscode, showData);
      navigate('/home');
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid passcode. Please check your connection and try again.');
      setPasscode(['', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="wave-pattern"></div>
      </div>
      
      <div className="login-content">
        <div className="logo-container">
          <img 
            src="/myK9Q-logo-white.png" 
            alt="myK9Q Logo" 
            className="logo-image"
          />
          <h1 className="app-title">myK9Q</h1>
          <div className="version">v1.0.0</div>
          <p className="tagline">Queue and Qualify</p>
        </div>

        <div className="passcode-section">
          <p className="instruction">Enter Pass Code provided by Host Club</p>
          
          <div className="passcode-inputs">
            {passcode.map((digit, index) => (
              <input
                key={index}
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
            ))}
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {isLoading && (
            <div className="loading-message">Validating passcode...</div>
          )}
        </div>

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
            ** Requires reliable internet connectivity<br/>
            via Cellular data service or Wi-Fi.
          </p>
        </div>

        <button 
          className="help-button"
          onClick={() => window.open('https://www.myk9t.com/help', '_blank')}
        >
          <span className="help-icon">?</span>
          Help
        </button>
      </div>
    </div>
  );
};