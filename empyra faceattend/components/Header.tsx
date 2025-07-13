
import React from 'react';
import { MenuIcon, ClockIcon, PowerIcon } from './icons';
import { Subscription } from '../types';

interface HeaderProps {
  user: { name: string; email: string };
  setSidebarOpen: (isOpen: boolean) => void;
  subscription: Subscription;
  onLogout: () => void;
  currentYear: string;
  availableYears: string[];
  onYearChange: (year: string) => void;
}

const Header: React.FC<HeaderProps> = ({ user, setSidebarOpen, subscription, onLogout, currentYear, availableYears, onYearChange }) => {
  const getDaysRemaining = () => {
    const today = new Date();
    const expiry = new Date(subscription.expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  const daysRemaining = getDaysRemaining();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
      <div className="flex items-center">
        <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-500 dark:text-gray-400 mr-4">
          <MenuIcon className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-4">
          <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white hidden sm:block">Welcome, {user.name}</h1>
           <div>
            <label htmlFor="year-select" className="sr-only">Select Year</label>
            <select
              id="year-select"
              value={currentYear}
              onChange={(e) => onYearChange(e.target.value)}
              className="font-semibold bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-1 pl-2 pr-8 text-sm focus:ring-sky-500 focus:border-sky-500"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>
                  {`Year: ${year}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-sm font-semibold px-3 py-1.5 rounded-full">
            <ClockIcon className="w-4 h-4" />
            <span>
              {subscription.isTrial 
                ? `Trial expires in ${daysRemaining} days`
                : `${subscription.plan} Plan: ${daysRemaining} days remaining`
              }
            </span>
        </div>
        <img
          className="h-10 w-10 rounded-full object-cover border-2 border-sky-500"
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0ea5e9&color=fff`}
          alt={user.name}
        />
        <button onClick={onLogout} className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-500 transition-colors" title="Logout">
          <PowerIcon className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;