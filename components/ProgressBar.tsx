
import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  colorClass?: string; 
  heightClass?: string; // e.g. h-2, h-2.5
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, colorClass, heightClass = 'h-2' }) => {
  const normalizedProgress = Math.max(0, Math.min(100, progress));
  const finalColorClass = colorClass || 'bg-[var(--color-accent)]';

  return (
    <div className={`w-full bg-[var(--color-border)] rounded-full ${heightClass}`}>
      <div
        className={`${finalColorClass} ${heightClass} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${normalizedProgress}%` }}
        role="progressbar"
        aria-valuenow={normalizedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      ></div>
    </div>
  );
};

export default ProgressBar;
