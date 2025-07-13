
import React from 'react';
import { Student, AttendanceStatus } from '../types';

interface StudentTableProps {
  students: Student[];
  showClass?: boolean;
}

const StatusBadge: React.FC<{ status: AttendanceStatus, checkInTime?: string }> = ({ status, checkInTime }) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
        case AttendanceStatus.PRESENT:
            return <span className={`${baseClasses} bg-green-100 text-green-800`}>Present</span>;
        case AttendanceStatus.ABSENT:
            return <span className={`${baseClasses} bg-red-100 text-red-800`}>Absent</span>;
        case AttendanceStatus.LATE:
            return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Late ({checkInTime})</span>;
        default:
            return null;
    }
};


const StudentTable: React.FC<StudentTableProps> = ({ students, showClass = false }) => {
  if (students.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 py-4">No students to display.</p>;
  }
  
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-4 py-3">Name</th>
            {showClass && <th scope="col" className="px-4 py-3">Class</th>}
            <th scope="col" className="px-4 py-3 text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const todaysAttendance = student.attendance.find(a => a.date === today);
            return (
                <tr key={student.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-3">
                            <img className="w-8 h-8 rounded-full object-cover" src={student.avatar} alt={`${student.name} avatar`} />
                            <span>{student.name}</span>
                        </div>
                    </td>
                    {showClass && <td className="px-4 py-3">{student.rollNo}</td>}
                    <td className="px-4 py-3 text-center">
                        {todaysAttendance && <StatusBadge status={todaysAttendance.status} checkInTime={todaysAttendance.checkInTime} />}
                    </td>
                </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StudentTable;