'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  fieldId?: string;
  showToggle?: boolean;
  strengthIndicator?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, fieldId, showToggle = true, strengthIndicator = false, disabled, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const toggle = () => setIsVisible(!isVisible);

    const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
      if (!password) return { score: 0, label: '', color: '' };

      let score = 0;

      // Length check
      if (password.length >= 8) score += 1;
      if (password.length >= 12) score += 1;

      // Character variety checks
      if (/[a-z]/.test(password)) score += 1;
      if (/[A-Z]/.test(password)) score += 1;
      if (/[0-9]/.test(password)) score += 1;
      if (/[^a-zA-Z0-9]/.test(password)) score += 1;

      if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
      if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-500' };
      return { score, label: 'Strong', color: 'bg-green-500' };
    };

    const strength = strengthIndicator && props.value ? getPasswordStrength(String(props.value)) : null;

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            {...props}
            ref={ref}
            type={isVisible ? 'text' : 'password'}
            className={cn('pr-10', className)}
            disabled={disabled}
          />

          {showToggle && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={toggle}
              disabled={disabled}
              aria-label={isVisible ? 'Hide password' : 'Show password'}
            >
              {isVisible ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          )}
        </div>

        {strengthIndicator && props.value && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Password strength:</span>
              <span className={cn(
                'font-medium',
                strength?.score === 0 ? 'text-gray-400' :
                  strength?.score <= 2 ? 'text-red-600' :
                    strength?.score <= 4 ? 'text-yellow-600' :
                      'text-green-600'
              )}>
                {strength?.label}
              </span>
            </div>

            <div className="flex space-x-1">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    i < (strength?.score || 0) ? strength?.color : 'bg-gray-200'
                  )}
                />
              ))}
            </div>

            {/* Password requirements */}
            <div className="mt-2 space-y-1 text-xs text-gray-500">
              <div className="grid grid-cols-2 gap-2">
                <div className={cn(
                  'flex items-center space-x-1',
                  String(props.value).length >= 8 ? 'text-green-600' : 'text-gray-400'
                )}>
                  <span className="w-1 h-1 rounded-full bg-current" />
                  <span>8+ characters</span>
                </div>
                <div className={cn(
                  'flex items-center space-x-1',
                  /[A-Z]/.test(String(props.value)) ? 'text-green-600' : 'text-gray-400'
                )}>
                  <span className="w-1 h-1 rounded-full bg-current" />
                  <span>Uppercase</span>
                </div>
                <div className={cn(
                  'flex items-center space-x-1',
                  /[a-z]/.test(String(props.value)) ? 'text-green-600' : 'text-gray-400'
                )}>
                  <span className="w-1 h-1 rounded-full bg-current" />
                  <span>Lowercase</span>
                </div>
                <div className={cn(
                  'flex items-center space-x-1',
                  /[0-9]/.test(String(props.value)) ? 'text-green-600' : 'text-gray-400'
                )}>
                  <span className="w-1 h-1 rounded-full bg-current" />
                  <span>Number</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';