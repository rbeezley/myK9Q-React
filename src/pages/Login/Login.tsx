import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authenticatePasscode } from '../../services/authService';
import { Card, CardContent, Button } from '../../components/ui';
import { useHapticFeedback } from '../../utils/hapticFeedback';
import { HelpCircle, Loader2, Wifi, WifiOff } from 'lucide-react';
import './Login.css';

export const Login: React.FC = () => {
  const [passcode, setPasscode] = useState(['', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { login } = useAuth();
  const hapticFeedback = useHapticFeedback();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Focus first input on mount and setup network monitoring
  useEffect(() => {
    inputRefs.current[0]?.focus();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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

    if (!isOnline) {
      hapticFeedback.impact('heavy');
      setError('No internet connection. Please check your connectivity.');
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
      setError('Invalid passcode. Please check your connection and try again.');
      setPasscode(['', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-[#1a1d23]' : 'bg-gradient-to-br from-primary/5 to-secondary/5'}`}>
      {/* Outdoor-Ready Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px] mask-fade-out" />
      
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
        {/* Network Status Indicator */}
        <div className="absolute top-4 right-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
            isOnline 
              ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
              : 'bg-red-500/10 text-red-600 border border-red-500/20'
          }`}>
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? 'Connected' : 'Offline'}
          </div>
        </div>
        
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <Card className="backdrop-blur-xl bg-card/80 border border-border/30 shadow-2xl p-8 max-w-md mx-auto">
            <CardContent className="p-0">
              <div className="mb-6">
                <img 
                  src="/myK9Q-logo-white.png" 
                  alt="myK9Q Logo" 
                  className="w-16 h-16 mx-auto mb-4 filter brightness-0 invert dark:brightness-100 dark:invert-0"
                />
                <h1 className="text-3xl font-bold text-foreground mb-2">myK9Q</h1>
                <div className="text-xs font-medium text-muted-foreground/60 bg-muted/20 px-2 py-1 rounded-full inline-block mb-2">
                  v1.0.0
                </div>
                <p className="text-base font-medium text-primary">
                  Queue and Qualify
                </p>
              </div>

              {/* Passcode Input Section */}
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground mb-4">
                    Enter Pass Code provided by Host Club
                  </p>
                  
                  {/* Outdoor-Ready Large Touch Targets */}
                  <div className="flex justify-center gap-3 mb-6">
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
                        className={`w-14 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200 bg-input text-foreground ${
                          error 
                            ? 'border-red-500 shadow-red-500/20 shadow-lg' 
                            : 'border-border/30 focus:border-primary focus:shadow-primary/20 focus:shadow-lg'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'}`}
                        disabled={isLoading}
                        inputMode="text"
                        autoComplete="off"
                        aria-label={`Passcode digit ${index + 1}`}
                        style={{ fontSize: '1.25rem' }}
                      />
                    ))}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="text-sm font-medium text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
                      {error}
                    </div>
                  )}

                  {/* Loading State */}
                  {isLoading && (
                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Validating passcode...
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Information Section */}
        <div className="max-w-md mx-auto mt-8 space-y-4">
          <Card className="backdrop-blur-xl bg-card/60 border border-border/20">
            <CardContent className="p-6 text-center">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  myK9Q allows exhibitors to check-in, indicate conflicts, view running 
                  order and preliminary results.
                </p>
                <p>
                  Eliminates manual data entry by the trial secretary.
                </p>
                <p className="text-primary font-medium">
                  Visit www.myk9t.com for more information.
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Connectivity Requirements */}
          <Card className="backdrop-blur-xl bg-card/40 border border-border/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                  isOnline ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Connectivity Required</p>
                  <p>Requires reliable internet connection via cellular data or Wi-Fi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Button - Outdoor-Ready Size */}
        <div className="fixed bottom-6 right-6">
          <Button 
            variant="outline"
            size="icon"
            onClick={() => {
              hapticFeedback.impact('light');
              window.open('https://www.myk9t.com/help', '_blank');
            }}
            className="h-14 w-14 rounded-full backdrop-blur-xl bg-card/80 border border-border/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <HelpCircle className="h-6 w-6 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
};