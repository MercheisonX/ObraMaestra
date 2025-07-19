
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leadingIcon?: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  helperText?: string;
}

const Input: React.FC<InputProps> = ({ label, id, error, leadingIcon, className, helperText, ...props }) => {
  const baseClasses = `block w-full px-4 py-3 bg-[var(--color-secondary-bg)] 
                       border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] 
                       placeholder-[var(--color-text-muted)] 
                       focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] 
                       focus:border-[var(--color-accent)] sm:text-sm font-medium transition-colors`;
  const paddingLeft = leadingIcon ? "pl-11" : "";
  
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1.5">{label}</label>}
      <div className="relative">
        {leadingIcon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-text-muted)]">
            {React.cloneElement(leadingIcon, { className: 'w-5 h-5' })}
          </div>
        )}
        <input
          id={id}
          className={`${baseClasses} ${paddingLeft} ${error ? 'border-red-500 ring-red-500' : ''} ${props.readOnly || props.disabled ? 'bg-[var(--color-border)] cursor-not-allowed opacity-70' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">{helperText}</p>}
    </div>
  );
};

export default Input;
