import React from 'react';
import { Alert, AlertType } from '../types';
import { AlertTriangleIcon } from './icons';

interface AlertsPanelProps {
  alerts: Alert[];
}

const alertStyles = {
    [AlertType.PROXY_ATTEMPT]: {
        iconColor: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-500'
    },
    [AlertType.CONSECUTIVE_ABSENCE]: {
        iconColor: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-500'
    },
    [AlertType.STUDENT_ABSENCE_SMS]: {
        iconColor: 'text-sky-500',
        bgColor: 'bg-sky-50 dark:bg-sky-900/20',
        borderColor: 'border-sky-500'
    }
};


const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-full">
      <h3 className="text-lg font-bold mb-4">Urgent Alerts</h3>
      <div className="space-y-4">
        {alerts.length > 0 ? alerts.map(alert => {
          const styles = alertStyles[alert.type];
          return (
            <div key={alert.id} className={`p-4 rounded-lg flex items-start gap-4 border-l-4 ${styles.bgColor} ${styles.borderColor}`}>
              <AlertTriangleIcon className={`w-6 h-6 flex-shrink-0 mt-1 ${styles.iconColor}`} />
              <div className="flex-1">
                <p className="font-bold text-sm text-gray-800 dark:text-gray-100">{alert.type}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">{alert.message}</p>
                {alert.studentName && <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mt-1">{alert.studentName}</p>}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{alert.timestamp}</p>
              </div>
               {alert.image && alert.type === AlertType.PROXY_ATTEMPT && (
                <div className="flex-shrink-0">
                    <img src={alert.image} alt="Proxy attempt" className="w-16 h-16 rounded-lg object-cover border-2 border-red-300"/>
                </div>
              )}
            </div>
          );
        }) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">No urgent alerts.</p>
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;