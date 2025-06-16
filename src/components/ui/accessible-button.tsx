'use client';

import { forwardRef } from 'react';
import { Button, ButtonProps } from './button';

interface AccessibleButtonProps extends ButtonProps {
  label?: string;
  description?: string;
  loading?: boolean;
  loadingText?: string;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ label, description, loading, loadingText, children, disabled, ...props }, ref) => {
    const isDisabled = disabled || loading;
    
    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        aria-label={label}
        aria-describedby={description ? `${props.id}-description` : undefined}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <div 
              className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"
              role="status"
              aria-label="Loading"
            />
            <span>{loadingText || 'Loading...'}</span>
          </div>
        ) : (
          children
        )}
        
        {description && (
          <span id={`${props.id}-description`} className="sr-only">
            {description}
          </span>
        )}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';