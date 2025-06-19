'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Settings, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

interface ApiErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorType?: 'network' | 'auth' | 'api' | 'unknown';
  retryCount: number;
}

interface ApiErrorBoundaryProps {
  children: React.ReactNode;
  maxRetries?: number;
  onError?: (error: Error, errorType: string) => void;
}

export class ApiErrorBoundary extends React.Component<ApiErrorBoundaryProps, ApiErrorBoundaryState> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: ApiErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ApiErrorBoundaryState> {
    const errorType = ApiErrorBoundary.categorizeError(error);
    
    return {
      hasError: true,
      error,
      errorType,
    };
  }

  static categorizeError(error: Error): 'network' | 'auth' | 'api' | 'unknown' {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    
    if (message.includes('unauthorized') || message.includes('401') || message.includes('api key')) {
      return 'auth';
    }
    
    if (message.includes('api') || message.includes('500') || message.includes('503')) {
      return 'api';
    }
    
    return 'unknown';
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorType = ApiErrorBoundary.categorizeError(error);
    
    this.props.onError?.(error, errorType);
    
    console.error('ApiErrorBoundary caught an error:', {
      error,
      errorType,
      errorInfo,
      retryCount: this.state.retryCount,
    });
  }

  componentWillUnmount() {
    // Cleanup any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorType: undefined,
      retryCount: 0 
    });
  };

  retryWithDelay = (delay: number = 1000) => {
    const maxRetries = this.props.maxRetries || 3;
    
    if (this.state.retryCount >= maxRetries) {
      return;
    }

    const timeout = setTimeout(() => {
      this.setState(prevState => ({ 
        hasError: false, 
        error: undefined, 
        errorType: undefined,
        retryCount: prevState.retryCount + 1 
      }));
    }, delay);

    this.retryTimeouts.push(timeout);
  };

  render() {
    if (!this.state.hasError || !this.state.error) {
      return this.props.children;
    }

    return <ApiErrorFallback 
      error={this.state.error}
      errorType={this.state.errorType || 'unknown'}
      retryCount={this.state.retryCount}
      maxRetries={this.props.maxRetries || 3}
      onRetry={this.retryWithDelay}
      onReset={this.resetError}
    />;
  }
}

interface ApiErrorFallbackProps {
  error: Error;
  errorType: 'network' | 'auth' | 'api' | 'unknown';
  retryCount: number;
  maxRetries: number;
  onRetry: (delay?: number) => void;
  onReset: () => void;
}

function ApiErrorFallback({ 
  error, 
  errorType, 
  retryCount, 
  maxRetries, 
  onRetry, 
  onReset 
}: ApiErrorFallbackProps) {
  const router = useRouter();

  const getErrorConfig = () => {
    switch (errorType) {
      case 'network':
        return {
          icon: WifiOff,
          title: 'Connection Problem',
          description: 'Unable to connect to the server. Please check your internet connection.',
          actions: [
            { 
              label: 'Retry', 
              onClick: () => onRetry(2000),
              variant: 'default' as const,
              icon: RefreshCw 
            }
          ]
        };
      
      case 'auth':
        return {
          icon: AlertTriangle,
          title: 'Authentication Error',
          description: 'Your session may have expired or API keys need to be configured.',
          actions: [
            { 
              label: 'Go to Settings', 
              onClick: () => router.push('/settings'),
              variant: 'default' as const,
              icon: Settings 
            },
            { 
              label: 'Try Again', 
              onClick: onReset,
              variant: 'outline' as const,
              icon: RefreshCw 
            }
          ]
        };
      
      case 'api':
        return {
          icon: AlertTriangle,
          title: 'Service Unavailable',
          description: 'The AI service is temporarily unavailable. Please try again in a moment.',
          actions: [
            { 
              label: 'Retry', 
              onClick: () => onRetry(5000),
              variant: 'default' as const,
              icon: RefreshCw 
            }
          ]
        };
      
      default:
        return {
          icon: AlertTriangle,
          title: 'Something went wrong',
          description: error.message || 'An unexpected error occurred.',
          actions: [
            { 
              label: 'Try Again', 
              onClick: onReset,
              variant: 'default' as const,
              icon: RefreshCw 
            }
          ]
        };
    }
  };

  const { icon: Icon, title, description, actions } = getErrorConfig();
  const canRetry = retryCount < maxRetries;

  return (
    <div className="flex items-center justify-center min-h-64 p-4">
      <Alert className="max-w-md">
        <Icon className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm text-muted-foreground mb-4">
            {description}
          </p>
          
          {retryCount > 0 && (
            <p className="text-xs text-muted-foreground mb-3">
              Retry attempt: {retryCount} / {maxRetries}
            </p>
          )}
          
          <div className="flex gap-2 flex-wrap">
            {actions.map((action, index) => {
              const ActionIcon = action.icon;
              const isRetryAction = action.label.toLowerCase().includes('retry');
              const disabled = isRetryAction && !canRetry;
              
              return (
                <Button 
                  key={index}
                  onClick={action.onClick} 
                  variant={action.variant} 
                  size="sm"
                  disabled={disabled}
                >
                  <ActionIcon className="h-4 w-4 mr-2" />
                  {action.label}
                </Button>
              );
            })}
          </div>
          
          {!canRetry && (
            <p className="text-xs text-muted-foreground mt-3">
              Maximum retry attempts reached. Please refresh the page or check your configuration.
            </p>
          )}
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="text-xs cursor-pointer">Error Details</summary>
              <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto max-h-32">
                Error Type: {errorType}
                {'\n'}
                Message: {error.message}
                {'\n'}
                Stack: {error.stack}
              </pre>
            </details>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Hook for handling API errors in functional components
export function useApiErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, clearError };
}