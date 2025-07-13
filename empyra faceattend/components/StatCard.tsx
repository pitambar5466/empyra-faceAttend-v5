
import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactElement<{ className?: string }>;
  color: 'blue' | 'green' | 'red' | 'yellow';
  onClick?: () => void;
  isActive?: boolean;
}

const colorClasses = {
  blue: { bg: 'bg-sky-100 dark:bg-sky-900/50', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-500' },
  green: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-600 dark:text-green-400', border: 'border-green-500' },
  red: { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-600 dark:text-red-400', border: 'border-red-500' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500' },
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick, isActive }) => {
  const classes = colorClasses[color];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div 
        onClick={onClick}
        className={`bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md flex items-center space-x-4 border-l-4 ${classes.border} ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.03] transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-sky-500' : ''} ${isActive ? `ring-2 ring-offset-2 dark:ring-offset-gray-900 ${classes.border}` : ''}`}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={handleKeyDown}
        aria-pressed={isActive}
    >
      <div className={`p-3 rounded-full ${classes.bg} ${classes.text}`}>
        {React.cloneElement(icon, { className: 'h-6 w-6' })}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
