

import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  onClick?: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, onClick }) => {
  const cardClasses = `bg-[var(--color-secondary-bg)] p-4 rounded-2xl border border-[var(--color-border)] transition-all duration-200 ease-in-out ${onClick ? 'cursor-pointer hover:border-[var(--color-accent)] hover:bg-gray-700/50' : ''}`;

  return (
    <div className={cardClasses} onClick={onClick}>
        <p className="text-sm text-[var(--color-text-secondary)] mb-1">{title}</p>
        <div className="flex items-center justify-between">
            <span className={`text-2xl font-bold break-all ${title.toLowerCase().includes('ingresos') ? 'text-[var(--color-accent)]' : 'text-white'}`}>{value}</span>
            <div className="text-[var(--color-accent)]">
                {icon}
            </div>
        </div>
    </div>
  );
};

export default DashboardCard;