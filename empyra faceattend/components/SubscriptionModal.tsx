
import React from 'react';
import { ShieldCheckIcon } from './icons';

interface SubscriptionModalProps {
  onActivate: (planName: string, durationInDays: number) => void;
  onSelectPlan: (plan: { title: string; price: string; durationInDays: number }) => void;
  user: { name: string; email: string } | null;
}

const SubscriptionPlan: React.FC<{
  title: string;
  price: string;
  duration: string;
  isPopular?: boolean;
  onSelect: () => void;
}> = ({ title, price, duration, isPopular, onSelect }) => (
  <div className={`border-2 rounded-xl p-6 text-center relative transition-transform hover:scale-105 ${isPopular ? 'border-sky-500' : 'border-gray-300 dark:border-gray-600'}`}>
    {isPopular && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-sky-500 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</div>}
    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
    <p className="text-4xl font-extrabold my-4 text-gray-900 dark:text-white">{price}</p>
    <p className="text-gray-500 dark:text-gray-400">{duration}</p>
    <button onClick={onSelect} className={`w-full mt-6 py-2 px-4 rounded-lg font-semibold ${isPopular ? 'bg-sky-500 text-white hover:bg-sky-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
      Choose Plan
    </button>
  </div>
);


export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onActivate, onSelectPlan, user }) => {

  const handleActivateTrial = () => {
    onActivate('Trial', 7);
  };

  const handlePlanSelect = (title: string, price: string, durationInDays: number) => {
    onSelectPlan({ title, price, durationInDays });
  };

  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center overflow-y-auto max-h-full animate-fade-in">
        <div>
            <ShieldCheckIcon className="w-16 h-16 mx-auto text-red-500" />
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-4">Subscription Expired</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Your access is locked. Please renew your subscription to continue.</p>

            <div className="grid md:grid-cols-3 gap-6 my-8">
                <SubscriptionPlan title="1 Month" price="₹399" duration="Full Access" onSelect={() => handlePlanSelect('1 Month', '₹399', 30)} />
                <SubscriptionPlan title="3 Months" price="₹999" duration="Full Access" isPopular onSelect={() => handlePlanSelect('3 Months', '₹999', 90)} />
                <SubscriptionPlan title="1 Year" price="₹4499" duration="Full Access" onSelect={() => handlePlanSelect('1 Year', '₹4499', 365)} />
            </div>
            
            <div className="mt-8">
                <button onClick={handleActivateTrial} className="text-sky-600 dark:text-sky-400 hover:underline font-semibold">
                    Activate 7-Day Free Trial (For Demo)
                </button>
            </div>
        </div>
        
        <footer className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="font-bold text-gray-700 dark:text-gray-300">Powered by EMPYRA</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">CEO – Pitambar Singh</p>
        </footer>
      </div>
    </div>
  );
};
