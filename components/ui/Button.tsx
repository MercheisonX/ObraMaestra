
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  shape?: 'pill' | 'rounded';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  fullWidth = false,
  className = '',
  leftIcon,
  rightIcon,
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-primary-app)] focus:ring-[var(--color-accent)] transition-all duration-200 ease-in-out inline-flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: 'bg-[var(--color-accent)] text-[var(--color-accent-dark)] hover:brightness-110 disabled:opacity-50',
    secondary: 'bg-[var(--color-secondary-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-border)] disabled:opacity-50',
    danger: 'bg-transparent text-[var(--color-danger)] hover:bg-[var(--color-danger-hover)] disabled:opacity-50',
    ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-transparent)] disabled:opacity-50',
    outline: 'bg-transparent border-2 border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-transparent)] disabled:opacity-50',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
  };

  const shapeStyles = {
    pill: 'rounded-full',
    rounded: 'rounded-lg'
  }

  const widthStyle = fullWidth ? 'w-full' : '';
  const loadingStyle = isLoading ? 'opacity-70 cursor-wait' : '';

  return (
    <button
      className={`${baseStyles} ${variantClasses[variant]} ${sizeStyles[size]} ${shapeStyles[shape]} ${widthStyle} ${loadingStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isLoading && leftIcon}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};

export default Button;