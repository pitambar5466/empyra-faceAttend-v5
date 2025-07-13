import { useState, useCallback, useMemo } from 'react';
import { Student, AttendanceStatus, Alert, AlertType } from '../types';

// Start with empty data for a clean slate, but keep the years available.
const initialStudentsData: Record<string, Omit<Student, 'attendance' | 'lastSeen'| 'avatar'>[]> = {
  '2024-2025': [],
};

const generateAttendanceForYear = (students: Omit<Student, 'attendance' | 'lastSeen'| 'avatar'>[]): Student[] => {
  return students.map((student) => {
    // Keep newly added students clean without fake past attendance
    return {
        ...student,
        avatar: `https://picsum.photos/seed/${student.id}/100`,
        attendance: [],
        lastSeen: 'Just Enrolled'
    };
  });
};

const generateAttendanceForAllYears = (data: Record<string, Omit<Student, 'attendance'| 'lastSeen'| 'avatar'>[]>): Record<string, Student[]> => {
    const result: Record<string, Student[]> = {};
    for (const year in data) {
        result[year] = generateAttendanceForYear(data[year]);
    }
    return result;
}

const useMockData = () => {
  const [studentsByYear, setStudentsByYear] = useState<Record<string, Student[]>>(() => generateAttendanceForAllYears(initialStudentsData));
  const [alertsByYear, setAlertsByYear] = useState<Record<string, Alert[]>>({});
  
  const availableYears = useMemo(() => {
    const currentFullYear = new Date().getFullYear();
    const years = new Set(Object.keys(studentsByYear));
    for (let year = currentFullYear - 1; year <= 2050; year++) {
        years.add(`${year}-${year + 1}`);
    }
    return Array.from(years).sort();
  }, [studentsByYear]);
  
  const addAlert = useCallback((year: string, alert: Omit<Alert, 'id'>) => {
    setAlertsByYear(prev => {
      const yearAlerts = prev[year] || [];
      const newId = `A${String(Object.values(prev).flat().length + 1).padStart(3, '0')}`;
      const alertToAdd: Alert = { ...alert, id: newId };
      const updatedAlerts = [alertToAdd, ...yearAlerts];

      const priorityOrder = { [AlertType.PROXY_ATTEMPT]: 0, [AlertType.CONSECUTIVE_ABSENCE]: 1, [AlertType.STUDENT_ABSENCE_SMS]: 2 };
      updatedAlerts.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);
      
      return { ...prev, [year]: updatedAlerts };
    });
  }, []);

  const generateAndSetAlertsForYear = useCallback((year: string, students: Student[]) => {
    if (!students) return;
    const newAlerts: Alert[] = [];
    const timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize for date comparison

    students.forEach(student => {
        // Check for 3 consecutive days of absence leading up to today.
        let consecutiveAbsenceDays = 0;
        for (let i = 1; i <= 3; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateString = checkDate.toISOString().split('T')[0];

            const attendanceRecord = student.attendance.find(a => a.date === dateString);

            // If the student was present or late, the consecutive streak is broken.
            if (attendanceRecord && (attendanceRecord.status === AttendanceStatus.PRESENT || attendanceRecord.status === AttendanceStatus.LATE)) {
                break;
            } else {
                // Otherwise, count as an absence (either marked 'Absent' or no record).
                consecutiveAbsenceDays++;
            }
        }

        if (consecutiveAbsenceDays === 3) {
            newAlerts.push({
                id: `alert-absent-${student.id}`,
                type: AlertType.CONSECUTIVE_ABSENCE,
                message: 'Student has been absent for 3 consecutive days. Please contact the guardian.',
                studentName: student.name,
                timestamp: timestamp
            });
        }
        
        // Separately, check if the latest attendance record is an absence to send a notification.
        if (student.attendance[0]?.status === AttendanceStatus.ABSENT && student.phone) {
             newAlerts.push({
                id: `alert-notify-${student.id}`,
                type: AlertType.STUDENT_ABSENCE_SMS,
                message: `SMS notification for absence sent to student's phone (${student.phone}).`,
                studentName: student.name,
                timestamp: timestamp
            });
        }
    });

    setAlertsByYear(prev => {
        const existingProxyAlerts = (prev[year] || []).filter(a => a.type === AlertType.PROXY_ATTEMPT);
        
        // Deduplicate new alerts to avoid clutter, e.g., if logic somehow creates multiple for same condition
        const uniqueNewAlerts = newAlerts.filter((alert, index, self) =>
            index === self.findIndex((t) => (
                t.type === alert.type && t.studentName === alert.studentName
            ))
        );

        const allAlerts = [...existingProxyAlerts, ...uniqueNewAlerts];
        const priorityOrder = { [AlertType.PROXY_ATTEMPT]: 0, [AlertType.CONSECUTIVE_ABSENCE]: 1, [AlertType.STUDENT_ABSENCE_SMS]: 2 };
        allAlerts.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);
        return { ...prev, [year]: allAlerts };
    });
  }, []);
  

  const addStudent = useCallback((year: string, newStudent: Omit<Student, 'id' | 'avatar' | 'lastSeen' | 'attendance'>) => {
    setStudentsByYear(prev => {
        const yearStudents = prev[year] || [];
        const newId = `S${String(Object.values(prev).flat().length + 1).padStart(3, '0')}`;
        const studentToAdd: Student = {
            ...newStudent,
            id: newId,
            avatar: `https://picsum.photos/seed/${newId}/100`,
            lastSeen: 'Just Enrolled',
            attendance: []
        };
        const updatedStudents = [...yearStudents, studentToAdd];
        return { ...prev, [year]: updatedStudents };
    });
  }, []);
  
  const updateStudent = useCallback((year: string, studentId: string, updatedData: Partial<Student>) => {
    setStudentsByYear(prev => {
        if (!prev[year]) return prev;
        const updatedYearStudents = prev[year].map(student => {
            if (student.id === studentId) {
                return { ...student, ...updatedData };
            }
            return student;
        });
        return { ...prev, [year]: updatedYearStudents };
    });
  }, []);

  const removeStudent = useCallback((year: string, studentId: string) => {
    setStudentsByYear(prev => {
      if (!prev[year]) return prev;
      const updatedYearStudents = prev[year].filter(student => student.id !== studentId);
      return { ...prev, [year]: updatedYearStudents };
    });
  }, []);

  const markAttendance = useCallback((year: string, studentId: string, status: AttendanceStatus) => {
      setStudentsByYear(prev => {
          if (!prev[year]) return prev;
          
          const today = new Date();
          const dateString = today.toISOString().split('T')[0];
          const checkInTime = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

          let studentFound = false;
          const updatedYearStudents = prev[year].map(student => {
              if (student.id === studentId) {
                  studentFound = true;
                  const newAttendance = { date: dateString, status, checkInTime };
                  const filteredAttendance = student.attendance.filter(a => a.date !== dateString);
                  return { ...student, attendance: [newAttendance, ...filteredAttendance], lastSeen: `Today, ${checkInTime}` };
              }
              return student;
          });
          
          if (studentFound) {
            generateAndSetAlertsForYear(year, updatedYearStudents);
          }
          return { ...prev, [year]: updatedYearStudents };
      });
  }, [generateAndSetAlertsForYear]);

  return { studentsByYear, alertsByYear, addStudent, removeStudent, updateStudent, markAttendance, availableYears, addAlert };
};

export default useMockData;