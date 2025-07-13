import React, { useState } from 'react';
import { Student, AttendanceStatus } from '../types';

interface ReportsPageProps {
  students: Student[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ students }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchedStudent, setSearchedStudent] = useState<Student | null>(null);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchMessage(null);
    setSearchedStudent(null);
    if (!searchTerm.trim()) {
        setSearchMessage("Please enter a name or ID to search.");
        return;
    }
    
    const term = searchTerm.toLowerCase();
    const foundStudent = students.find(s => 
        s.name.toLowerCase().includes(term) || 
        s.id.toLowerCase() === term ||
        s.rollNo.toLowerCase() === term
    );

    if (foundStudent) {
        setSearchedStudent(foundStudent);
        setSearchMessage(null);
    } else {
        setSearchMessage(`No student found with the name, ID, or roll no. "${searchTerm}".`);
    }
  };
  
  const clearSearch = () => {
    setSearchTerm('');
    setSearchedStudent(null);
    setSearchMessage(null);
  }

  const handleDownload = () => {
    // This is a mock download function
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Student ID,Roll No,Name,Date,Status,Check-in Time\n";

    students.forEach(student => {
        student.attendance.forEach(att => {
            const row = [student.id, student.rollNo, `"${student.name}"`, att.date, att.status, att.checkInTime || ''].join(',');
            csvContent += row + "\r\n";
        });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `empyra_attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('Report download initiated!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Attendance Reports</h2>
        <p className="text-gray-500 dark:text-gray-400">Search individual student records or download the full dataset.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <h3 className="font-bold text-lg mb-4">Search Student Attendance</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Enter a student's name, ID, or Roll Number to view their complete attendance history.
        </p>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="e.g., Arjun Kumar, S001, 11B-023"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
            <button type="submit" className="bg-sky-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600 transition-colors">
              Search
            </button>
            { (searchedStudent || searchMessage) && (
                 <button type="button" onClick={clearSearch} className="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">
                    Clear
                 </button>
            )}
        </form>
        {searchMessage && <p className="text-red-500 text-sm mt-2">{searchMessage}</p>}
      </div>

      {searchedStudent && (
         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in">
            <div className="p-6 flex items-center gap-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <img src={searchedStudent.enrolledFaceImage || searchedStudent.avatar} alt={searchedStudent.name} className="w-16 h-16 rounded-full object-cover border-2 border-sky-500" />
                <div>
                    <h3 className="font-bold text-xl text-gray-800 dark:text-white">{searchedStudent.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400">Roll No: {searchedStudent.rollNo} | ID: {searchedStudent.id}</p>
                </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">Date</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3">Check-in Time</th>
                  </tr>
                </thead>
                <tbody>
                  {searchedStudent.attendance.length > 0 ? (
                    searchedStudent.attendance
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((att, index) => (
                        <tr key={`${searchedStudent.id}-${att.date}-${index}`} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                          <td className="px-6 py-4 font-mono">{new Date(att.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'})}</td>
                          <td className="px-6 py-4">
                            {att.status === AttendanceStatus.PRESENT && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Present</span>}
                            {att.status === AttendanceStatus.ABSENT && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Absent</span>}
                            {att.status === AttendanceStatus.LATE && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Late</span>}
                          </td>
                          <td className="px-6 py-4 font-mono">{att.checkInTime || 'N/A'}</td>
                        </tr>
                    ))
                  ) : (
                      <tr>
                          <td colSpan={3} className="text-center p-8 text-gray-500">No attendance data available for this student.</td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
         </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <h3 className="font-bold text-lg mb-4">Download Full Report</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Click the button below to download a CSV file containing all historical attendance records for all students.
          You can use this file for archival purposes or for analysis in spreadsheet software like Excel or Google Sheets.
        </p>
        <button
          onClick={handleDownload}
          className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
        >
          Download All Data (.csv)
        </button>
      </div>
    </div>
  );
};
