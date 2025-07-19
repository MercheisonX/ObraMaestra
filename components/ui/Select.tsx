
import React from 'react';
import ChevronUpDownIcon from '../icons/ChevronUpDownIcon';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({ label, id, options, error, className, placeholder, ...props }) => {
  const baseClasses = `block w-full pl-4 pr-10 py-3 bg-[var(--color-secondary-bg)] 
                       border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] 
                       placeholder-[var(--color-text-muted)] 
                       focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] 
                       focus:border-[var(--color-accent)] sm:text-sm appearance-none font-medium transition-colors`;

  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1.5">{label}</label>}
      <div className="relative">
        <select
          id={id}
          className={`${baseClasses} ${error ? 'border-red-500 ring-red-500' : ''} ${props.disabled ? 'bg-[var(--color-border)] cursor-not-allowed opacity-70' : ''} ${className}`}
          {...props}
          value={props.value === undefined && placeholder ? "" : props.value} 
        >
          {placeholder && <option value="" disabled className="text-[var(--color-text-muted)]">{placeholder}</option>}
          {options.map(option => (
            <option key={option.value} value={option.value} className="bg-[var(--color-secondary-bg)] text-[var(--color-text-primary)]">
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--color-text-muted)]">
          <ChevronUpDownIcon className="h-5 w-5" />
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400 font-medium">{error}</p>}
    </div>
  );
};

export default Select;
