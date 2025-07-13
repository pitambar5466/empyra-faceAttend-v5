
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import StudentsPage from './components/StudentsPage';
import { ReportsPage } from './components/ReportsPage';
import { SubscriptionModal } from './components/SubscriptionModal';
import LoginPage from './components/LoginPage';
import AttendanceKiosk from './components/AttendanceKiosk';
import StoryGenerator from './components/StoryGenerator';
import MockStripeCheckout from './components/MockStripeCheckout';
import useMockData from './hooks/useMockData';
import { Subscription, Student, AttendanceStatus, Alert } from './types';

function App() {
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const { studentsByYear, alertsByYear, addStudent, removeStudent, updateStudent, markAttendance, availableYears, addAlert } = useMockData();
  
  const [currentYear, setCurrentYear] = useState<string>('');
  
  const [subscription, setSubscription] = useState<Subscription>({
    isActive: false,
    isTrial: false,
    plan: 'None',
    expiryDate: new Date(),
  });
  
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ title: string; price: string; durationInDays: number } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('empyra_currentUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && parsedUser.name && parsedUser.email) {
          setCurrentUser(parsedUser);
        } else {
          localStorage.removeItem('empyra_currentUser');
        }
      } catch (e) {
        localStorage.removeItem('empyra_currentUser');
      }
    }

    const savedSub = localStorage.getItem('empyra_subscription');
    if (savedSub) {
      try {
        const parsedSub = JSON.parse(savedSub);
        
        if (parsedSub && parsedSub.expiryDate) {
            const expiryDate = new Date(parsedSub.expiryDate);
            if (!isNaN(expiryDate.getTime()) && expiryDate > new Date()) {
                setSubscription({
                    isActive: parsedSub.isActive,
                    isTrial: parsedSub.isTrial,
                    plan: parsedSub.plan,
                    expiryDate: expiryDate,
                });
            } else {
                localStorage.removeItem('empyra_subscription');
            }
        } else {
            localStorage.removeItem('empyra_subscription');
        }
      } catch (e) {
        console.error("Error parsing subscription from localStorage:", e);
        localStorage.removeItem('empyra_subscription');
      }
    }
  }, []);

  useEffect(() => {
    if (availableYears.length > 0 && !currentYear) {
      const currentYearValue = new Date().getFullYear();
      const academicYear = `${currentYearValue}-${currentYearValue + 1}`;
      if (availableYears.includes(academicYear)) {
        setCurrentYear(academicYear);
      } else {
        // Fallback to the latest available year if current academic year is not in the list
        setCurrentYear(availableYears[availableYears.length - 1]);
      }
    }
  }, [availableYears, currentYear]);

  const students = useMemo<Student[]>(() => studentsByYear[currentYear] || [], [studentsByYear, currentYear]);
  const alerts = useMemo<Alert[]>(() => alertsByYear[currentYear] || [], [alertsByYear, currentYear]);

  const handleAddStudent = useCallback((student: Omit<Student, 'id' | 'avatar' | 'lastSeen' | 'attendance'>) => {
    if(currentYear) {
      addStudent(currentYear, student);
    }
  }, [addStudent, currentYear]);
  
  const handleUpdateStudent = useCallback((studentId: string, data: Partial<Student>) => {
    if (currentYear) {
      updateStudent(currentYear, studentId, data);
    }
  }, [updateStudent, currentYear]);

  const handleRemoveStudent = useCallback((studentId: string) => {
    if(currentYear) {
      removeStudent(currentYear, studentId);
    }
  }, [removeStudent, currentYear]);

  const handleMarkAttendance = useCallback((studentId: string, status: AttendanceStatus) => {
    if (currentYear) {
      markAttendance(currentYear, studentId, status);
    }
  }, [markAttendance, currentYear]);

  const handleAddAlert = useCallback((alert: Omit<Alert, 'id'>) => {
    if (currentYear) {
      addAlert(currentYear, alert);
    }
  }, [addAlert, currentYear]);

  const handleLogin = (user: { name: string; email: string }) => {
      localStorage.setItem('empyra_currentUser', JSON.stringify(user));
      setCurrentUser(user);
  };

  const handleLogout = () => {
      localStorage.removeItem('empyra_currentUser');
      setCurrentUser(null);
      localStorage.removeItem('empyra_subscription');
      setSubscription({ isActive: false, isTrial: false, plan: 'None', expiryDate: new Date() });
      setIsCheckingOut(false);
  };

  const handleActivateSubscription = (planName: string, durationInDays: number) => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationInDays);
    const newSub: Subscription = {
      isActive: true,
      isTrial: planName === 'Trial',
      plan: planName,
      expiryDate,
    };
    setSubscription(newSub);
    localStorage.setItem('empyra_subscription', JSON.stringify(newSub));
  };
  
  const handleSelectPlan = (plan: { title: string; price: string; durationInDays: number }) => {
    setSelectedPlan(plan);
    setIsCheckingOut(true);
  };

  const handlePaymentSuccess = (planName: string, durationInDays: number) => {
    handleActivateSubscription(planName, durationInDays);
    setIsCheckingOut(false);
  };

  const handleCancelPayment = () => {
    setIsCheckingOut(false);
  };

  const isSubscriptionLocked = !subscription.isActive;
  
  if (!currentUser) {
      return <LoginPage onLogin={handleLogin} />;
  }
  
  if (isCheckingOut) {
    return <MockStripeCheckout 
      plan={selectedPlan} 
      onSuccess={handlePaymentSuccess} 
      onCancel={handleCancelPayment}
      user={currentUser}
    />
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-200">
      {isSubscriptionLocked ? (
        <SubscriptionModal onActivate={handleActivateSubscription} onSelectPlan={handleSelectPlan} user={currentUser} />
      ) : (
        <HashRouter>
          <div className="flex">
            <Sidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} user={currentUser} />
            <div className="flex-1 flex flex-col transition-all duration-300 md:ml-64">
              <Header 
                user={currentUser} 
                setSidebarOpen={setSidebarOpen} 
                subscription={subscription} 
                onLogout={handleLogout}
                currentYear={currentYear}
                availableYears={availableYears}
                onYearChange={setCurrentYear}
              />
              <main className="p-4 md:p-8 flex-1">
                <Routes>
                  <Route path="/" element={<Dashboard students={students} alerts={alerts} />} />
                  <Route path="/students" element={<StudentsPage students={students} addStudent={handleAddStudent} updateStudent={handleUpdateStudent} removeStudent={handleRemoveStudent} />} />
                  <Route path="/reports" element={<ReportsPage students={students} />} />
                  <Route path="/kiosk" element={<AttendanceKiosk students={students} markAttendance={handleMarkAttendance} addAlert={handleAddAlert} />} />
                  <Route path="/story-generator" element={<StoryGenerator />} />
                </Routes>
              </main>
            </div>
          </div>
        </HashRouter>
      )}
    </div>
  );
}

export default App;
