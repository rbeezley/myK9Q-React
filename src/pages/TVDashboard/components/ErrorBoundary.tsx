import React, { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service (if configured)
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real app, you'd send this to your error tracking service
    console.log('📊 Logging error to service:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      console.log(`🔄 Attempting retry ${retryCount + 1}/${maxRetries}`);
      
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      console.warn('⚠️ Max retries reached, not retrying');
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, retryCount } = this.state;
      const { maxRetries = 3 } = this.props;
      const canRetry = retryCount < maxRetries;

      return (
        <div className="error-boundary">
          <div className="error-container">
            {/* Error Icon */}
            <div className="error-icon-container">
              <div className="error-icon">⚠️</div>
              <div className="error-pulse"></div>
            </div>

            {/* Error Message */}
            <div className="error-content">
              <h1 className="error-title">Something Went Wrong</h1>
              <p className="error-subtitle">
                The TV Dashboard encountered an unexpected error
              </p>

              {/* Error Details (for development) */}
              {process.env.NODE_ENV === 'development' && error && (
                <details className="error-details">
                  <summary>Technical Details</summary>
                  <div className="error-info">
                    <div className="error-message">
                      <strong>Error:</strong> {error.message}
                    </div>
                    {error.stack && (
                      <div className="error-stack">
                        <strong>Stack Trace:</strong>
                        <pre>{error.stack}</pre>
                      </div>
                    )}
                    {errorInfo && (
                      <div className="error-component-stack">
                        <strong>Component Stack:</strong>
                        <pre>{errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="error-actions">
                {canRetry && (
                  <button 
                    className="error-button retry-button" 
                    onClick={this.handleRetry}
                  >
                    Try Again ({maxRetries - retryCount} attempts left)
                  </button>
                )}
                
                <button 
                  className="error-button reload-button" 
                  onClick={this.handleReload}
                >
                  Reload Dashboard
                </button>
              </div>

              {/* Support Info */}
              <div className="error-support">
                <p>If this problem persists, please contact technical support.</p>
                <p className="error-timestamp">
                  Error occurred at: {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = 
    `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

// Hook for handling errors in functional components
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: any) => {
    console.error('🚨 Component error:', error, errorInfo);
    
    // In a real app, you might want to send this to your error tracking service
    // or show a toast notification
  }, []);
}