import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string | undefined;
  error?: string | undefined;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = '', ...rest }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label != null && (
          <label className="text-sm font-semibold text-primary">{label}</label>
        )}
        <div className="relative flex items-center">
          {leftIcon != null && (
            <span className="absolute left-3 text-muted pointer-events-none">{leftIcon}</span>
          )}
          <input
            ref={ref}
            className={`input-base ${leftIcon != null ? 'pl-10' : ''} ${rightIcon != null ? 'pr-10' : ''} ${error != null ? 'border-red-400' : ''} ${className}`}
            {...rest}
          />
          {rightIcon != null && (
            <span className="absolute right-3 text-muted">{rightIcon}</span>
          )}
        </div>
        {error != null && (
          <p className="text-xs text-red-500 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
