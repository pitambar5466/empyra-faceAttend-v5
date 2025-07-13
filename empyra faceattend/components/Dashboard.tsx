
import React, { useState, useMemo } from 'react';
import { Student, AttendanceStatus, Alert } from '../types';
import { UsersIcon, CheckCircleIcon, XCircleIcon, ClockIcon, XIcon } from './icons';
import StatCard from './StatCard';
import StudentTable from './StudentTable';
import AlertsPanel from './AlertsPanel';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  students: Student[];
  alerts: Alert[];
}

const Dashboard: React.FC<DashboardProps> = ({ students, alerts }) => {
  const [activeView, setActiveView] = useState<'TOTAL' | 'PRESENT' | 'ABSENT' | 'LATE' | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const presentTodayStudents = students.filter(s => s.attendance.find(a => a.date === today && a.status === AttendanceStatus.PRESENT));
  const absentTodayStudents = students.filter(s => s.attendance.find(a => a.date === today && a.status === AttendanceStatus.ABSENT));
  const lateTodayStudents = students.filter(s => s.attendance.find(a => a.date === today && a.status === AttendanceStatus.LATE));
  
  const attendanceData = Array.from({length: 7}).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    
    let present = 0;
    let absent = 0;
    students.forEach(student => {
        const record = student.attendance.find(a => a.date === date);
        if(record?.status === AttendanceStatus.PRESENT || record?.status === AttendanceStatus.LATE) present++;
        if(record?.status === AttendanceStatus.ABSENT) absent++;
    });
    return { name: dayName, Present: present, Absent: absent };
  }).reverse();
  
  const handleStatCardClick = (viewType: 'TOTAL' | 'PRESENT' | 'ABSENT' | 'LATE') => {
    if (activeView === viewType) {
        setActiveView(null);
        return;
    }
    setActiveView(viewType);
  };
  
  const viewData = useMemo(() => {
    switch (activeView) {
        case 'TOTAL':
            return { title: 'All Enrolled Students', students: students };
        case 'PRESENT':
            return { title: 'Students Present Today', students: presentTodayStudents };
        case 'ABSENT':
            return { title: 'Students Absent Today', students: absentTodayStudents };
        case 'LATE':
            return { title: 'Students Arriving Late Today', students: lateTodayStudents };
        default:
            return null;
    }
  }, [activeView, students, presentTodayStudents, absentTodayStudents, lateTodayStudents]);


  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Today's Overview</h2>
        <p className="text-gray-500 dark:text-gray-400">A quick summary of today's attendance. Click a card to see details.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={students.length} icon={<UsersIcon />} color="blue" onClick={() => handleStatCardClick('TOTAL')} isActive={activeView === 'TOTAL'} />
        <StatCard title="Present Today" value={presentTodayStudents.length} icon={<CheckCircleIcon />} color="green" onClick={() => handleStatCardClick('PRESENT')} isActive={activeView === 'PRESENT'} />
        <StatCard title="Absent Today" value={absentTodayStudents.length} icon={<XCircleIcon />} color="red" onClick={() => handleStatCardClick('ABSENT')} isActive={activeView === 'ABSENT'} />
        <StatCard title="Late Comers" value={lateTodayStudents.length} icon={<ClockIcon />} color="yellow" onClick={() => handleStatCardClick('LATE')} isActive={activeView === 'LATE'} />
      </div>
      
      {viewData && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">{viewData.title}</h3>
                <button 
                  onClick={() => setActiveView(null)} 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500"
                  aria-label="Close details view"
                >
                    <XIcon className="w-6 h-6" />
                </button>
            </div>
            <StudentTable students={viewData.students} showClass={true} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-bold mb-4">Weekly Attendance Trend</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                    <XAxis dataKey="name" stroke="rgb(156, 163, 175)" />
                    <YAxis stroke="rgb(156, 163, 175)" />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', borderRadius: '0.5rem' }} />
                    <Legend />
                    <Bar dataKey="Present" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-1">
          <AlertsPanel alerts={alerts} />
        </div>
      </div>
      
      <footer className="text-center text-gray-500 dark:text-gray-400 text-sm mt-8">
          <p className="font-bold">EMPYRA FaceAttend is not just an app — it’s a system for loyalty, security, and future.</p>
      </footer>
    </div>
  );
};

export default Dashboard;
