"use client";

import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  error: string | Error;
  className?: string;
  variant?: "default" | "destructive" | "warning";
}

export function ErrorMessage({ error, className, variant = "destructive" }: ErrorMessageProps) {
  const errorText = typeof error === "string" ? error : error.message;
  
  const variantClasses = {
    default: "border-border bg-background text-foreground",
    destructive: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
  };

  return (
    <div className={cn(
      "rounded-lg border p-4 text-sm",
      variantClasses[variant],
      className
    )}>
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium">Error</p>
          <p className="mt-1">{errorText}</p>
        </div>
      </div>
    </div>
  );
}

interface RetryButtonProps {
  onRetry: () => void;
  isRetrying?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function RetryButton({ 
  onRetry, 
  isRetrying = false, 
  className,
  children = "Try Again"
}: RetryButtonProps) {
  return (
    <Button
      onClick={onRetry}
      disabled={isRetrying}
      variant="outline"
      size="sm"
      className={className}
    >
      {isRetrying ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Retrying...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          {children}
        </>
      )}
    </Button>
  );
}

interface ErrorPageProps {
  title?: string;
  description?: string;
  error?: string | Error;
  onRetry?: () => void;
  isRetrying?: boolean;
  showRetry?: boolean;
  className?: string;
}

export function ErrorPage({
  title = "Something went wrong",
  description = "We encountered an error while processing your request.",
  error,
  onRetry,
  isRetrying = false,
  showRetry = true,
  className
}: ErrorPageProps) {
  return (
    <div className={cn("flex items-center justify-center min-h-[400px]", className)}>
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto h-16 w-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          
          {error && (
            <div className="mt-4 p-3 bg-muted rounded-md text-left">
              <p className="text-xs font-mono text-muted-foreground">
                {typeof error === "string" ? error : error.message}
              </p>
            </div>
          )}
        </div>

        {showRetry && onRetry && (
          <RetryButton onRetry={onRetry} isRetrying={isRetrying} />
        )}
      </div>
    </div>
  );
}

interface ErrorBannerProps {
  error: string | Error;
  onDismiss?: () => void;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export function ErrorBanner({ 
  error, 
  onDismiss, 
  onRetry, 
  isRetrying = false,
  className 
}: ErrorBannerProps) {
  const errorText = typeof error === "string" ? error : error.message;

  return (
    <div className={cn(
      "border border-red-200 bg-red-50 p-4 rounded-lg dark:border-red-800 dark:bg-red-950",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Error: {errorText}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {onRetry && (
            <Button
              onClick={onRetry}
              disabled={isRetrying}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
            >
              {isRetrying ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {onDismiss && (
            <Button
              onClick={onDismiss}
              variant="ghost"
              size="sm"
              className="text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}