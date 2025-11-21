import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authenticatePasscode } from '../../services/authService';
import { detectDatabaseWithValidation, isMigrationModeEnabled } from '../../services/databaseDetectionService';
import { useHapticFeedback } from '../../utils/hapticFeedback';
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from '../../utils/rateLimiter';
import { TransitionMessage } from '../../components/TransitionMessage/TransitionMessage';
import { autoDownloadShow } from '../../services/autoDownloadService';
import './Login.css';

export const Login: React.FC = () => {
  const [passcode, setPasscode] = useState(['', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');
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

    // Auto-submit when all 5 digits are entered
    if (value && index === 4) {
      // Check if all fields are filled
      const isComplete = newPasscode.every(digit => digit !== '');
      if (isComplete) {
        // Add a small delay for better UX
        setTimeout(() => {
          handleSubmitWithPasscode(newPasscode);
        }, 150);
      }
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

  const handleReset = () => {
    hapticFeedback.impact('light');
    setPasscode(['', '', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
  };

  /**
   * Trigger auto-download of show data for offline use
   * Runs in background, non-blocking
   */
  const triggerAutoDownload = (licenseKey: string) => {
    console.log('📥 [AUTO-DOWNLOAD] Starting background download...');

    // Start background download (don't await - non-blocking)
    autoDownloadShow(licenseKey, (progress) => {
      console.log(
        `📥 [AUTO-DOWNLOAD] Progress: ${progress.current}/${progress.total} classes - ${progress.className}`
      );
    }).then(result => {
      // Download complete
      if (result.success) {
        console.log(
          `✅ [AUTO-DOWNLOAD] Complete: ${result.total} classes cached and ready for offline use`
        );
      } else if (result.downloaded > 0) {
        console.warn(
          `⚠️ [AUTO-DOWNLOAD] Partial success: ${result.downloaded}/${result.total} classes cached`
        );
      } else {
        console.error('❌ [AUTO-DOWNLOAD] Failed to cache any classes');
      }
    }).catch(error => {
      console.error('[AUTO-DOWNLOAD] Unexpected error:', error);
    });
  };

  const handleSubmitWithPasscode = async (passcodeArray: string[]) => {
    const fullPasscode = passcodeArray.join('');

    if (fullPasscode.length !== 5) {
      hapticFeedback.impact('heavy');
      setError('Please enter all 5 characters');
      return;
    }

    // ⚡ RATE LIMIT CHECK - Prevent brute force attacks
    const rateLimitResult = checkRateLimit('login');

    if (!rateLimitResult.allowed) {
      hapticFeedback.impact('heavy');
      setError(rateLimitResult.message);
      setPasscode(['', '', '', '', '']);
      inputRefs.current[0]?.focus();
      return;
    }

    setIsLoading(true);
    setError('');
    hapticFeedback.impact('medium');

    try {
      // Check if migration mode is enabled (dual-database detection)
      if (isMigrationModeEnabled()) {
        console.log('Migration mode enabled - performing database detection');

        // Detect which database contains this show
        const detectionResult = await detectDatabaseWithValidation(fullPasscode);

        if (detectionResult.database === 'legacy' && detectionResult.redirectUrl) {
          // Show is in legacy database - redirect to Flutter app
          console.log('Redirecting to Flutter app:', detectionResult.redirectUrl);

          // Clear rate limit before redirecting
          clearRateLimit('login');
          hapticFeedback.success();

          // Show transition message to user
          setError('');
          setIsLoading(false);
          setRedirectUrl(detectionResult.redirectUrl);
          setShowTransition(true);

          // Redirect will happen after user sees the transition message
          return;
        }

        // Continue with V3 authentication if not legacy
        if (detectionResult.database === 'v3' && detectionResult.showData) {
          // Already validated, use the show data directly
          clearRateLimit('login');
          hapticFeedback.success();
          const showDataWithType = {
            ...detectionResult.showData,
            showType: detectionResult.showData.competition_type || detectionResult.showData.show_type
          };
          login(fullPasscode, showDataWithType);

          // 🚀 AUTO-DOWNLOAD: Start background download for offline use
          // All roles (admin, judge, steward, exhibitor) benefit from cached data
          // Always enabled - offline-first architecture
          triggerAutoDownload(showDataWithType.licenseKey);

          navigate('/home');
          return;
        }
      }

      // Standard authentication flow (no migration mode or V3 database)
      const showData = await authenticatePasscode(fullPasscode);

      if (!showData) {
        throw new Error('Invalid passcode');
      }

      // ✅ Login successful - clear rate limit tracking
      clearRateLimit('login');
      hapticFeedback.success();
      const showDataWithType = {
        ...showData,
        showType: showData.competition_type
      };
      login(fullPasscode, showDataWithType);

      // 🚀 AUTO-DOWNLOAD: Start background download for offline use
      // All roles (admin, judge, steward, exhibitor) benefit from cached data
      // Always enabled - offline-first architecture
      triggerAutoDownload(showDataWithType.licenseKey);

      navigate('/home');
    } catch (err) {
      console.error('Login error:', err);

      // ❌ Failed attempt - record for rate limiting
      recordFailedAttempt('login');

      // Check if now rate limited after this failure
      const newRateLimitResult = checkRateLimit('login');

      hapticFeedback.impact('heavy');

      if (!newRateLimitResult.allowed) {
        // Show rate limit message instead of generic error
        setError(newRateLimitResult.message);
      } else if (newRateLimitResult.remainingAttempts <= 2) {
        // Show warning when getting close to limit
        setError(`Invalid passcode. ${newRateLimitResult.remainingAttempts} attempt${newRateLimitResult.remainingAttempts === 1 ? '' : 's'} remaining before temporary block.`);
      } else {
        setError('Invalid passcode. Please check and try again.');
      }

      setPasscode(['', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    await handleSubmitWithPasscode(passcode);
  };

  const handleTransitionComplete = () => {
    // Redirect to Flutter app
    window.location.href = redirectUrl;
  };

  return (
    <>
      {/* Show transition message when redirecting to legacy app */}
      {showTransition && (
        <TransitionMessage onComplete={handleTransitionComplete} />
      )}

      {/* Login page */}
      <div className="login-container">
      {/* Purple gradient background matching Flutter */}
      <div className="login-background" />
      
      <div className="login-content">
        {/* Logo and Branding */}
        <div className="logo-container">
          <div className="logo-image">
            <img
              src="/myK9Q-teal-192.png"
              alt="myK9Q Logo"
              className="logo-img"
            />
          </div>

          <h1 className="app-title">myK9Q</h1>
          <div className="tagline">
            <span className="tagline-queue">Queue</span>
            <span className="tagline-and"> & </span>
            <span className="tagline-qualify">Qualify</span>
          </div>
        </div>

        {/* Passcode Input Section - Frosted Glass Card */}
        <div className="passcode-card">
          <div className="passcode-section">
            <p className="instruction">Enter Pass Code provided by Club</p>

            <div className="passcode-input-container">
              <div className={`passcode-inputs ${passcode.every(d => d !== '') ? 'all-filled' : ''}`}>
                {passcode.map((digit, index) => (
                  <div key={index} className="input-wrapper">
                    <input
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className={`passcode-input ${error ? 'error' : ''} ${digit ? 'filled' : ''}`}
                      disabled={isLoading}
                      inputMode="text"
                      autoComplete="off"
                      autoCapitalize="characters"
                      aria-label={`Passcode digit ${index + 1}`}
                    />
                  </div>
                ))}
              </div>

              {/* Reset Button */}
              {passcode.some(digit => digit !== '') && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="reset-button"
                  disabled={isLoading}
                  aria-label="Clear passcode"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 6L6 18M6 6L18 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
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
        </div>

        {/* Information Section */}
        <div className="info-section">
          <p className="info-text">
            Real-time check-in, conflict management, and results.
          </p>
          <p className="info-text">
            Efficient shows. Simplified.
          </p>
          <p className="website-link">
            www.myk9t.com
          </p>
        </div>
      </div>
    </div>
    </>
  );
};