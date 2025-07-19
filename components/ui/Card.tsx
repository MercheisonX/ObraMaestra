
import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  icon?: React.ReactElement<React.SVGProps<SVGSVGElement>>;
}

const Card: React.FC<CardProps> = ({ title, children, className = '', onClick, icon }) => {
  const cardClasses = `bg-[var(--color-secondary-bg)] p-4 sm:p-5 rounded-2xl border border-[var(--color-border)] transition-all duration-200 ease-in-out ${className} ${onClick ? 'cursor-pointer hover:border-[var(--color-accent)] shadow-[0_0_15px_rgba(34,211,238,0.1)]' : ''}`;

  return (
    <div className={cardClasses} onClick={onClick}>
      {title && (
        <div className="flex items-center border-b border-[var(--color-border)] pb-3 mb-4">
          {icon && React.cloneElement(icon, { className: 'w-7 h-7 text-[var(--color-accent)] mr-3 flex-shrink-0' })}
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
