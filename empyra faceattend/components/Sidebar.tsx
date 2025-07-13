
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboardIcon, UsersIcon, FileTextIcon, ShieldCheckIcon, XIcon, CameraIcon, BookOpenIcon } from './icons';

interface SidebarProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  user: { name: string; email: string } | null;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setSidebarOpen, user }) => {
  const navLinkClasses = 'flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors duration-200';
  const activeLinkClasses = 'bg-sky-600 text-white';

  return (
    <>
      <div className={`fixed inset-y-0 left-0 bg-gray-800 dark:bg-gray-900 w-64 p-6 flex flex-col z-30 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
                <ShieldCheckIcon className="h-10 w-10 text-sky-400" />
                <div>
                    <h1 className="text-xl font-bold text-white">EMPYRA</h1>
                    <span className="text-xs text-sky-400 -mt-1 block">FaceAttend</span>
                </div>
            </div>
             <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
                <XIcon className="h-6 w-6" />
            </button>
        </div>

        <nav className="flex-1 space-y-2">
          <NavLink to="/" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} end>
            <LayoutDashboardIcon className="h-5 w-5 mr-3" />
            Dashboard
          </NavLink>
          <NavLink to="/students" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
            <UsersIcon className="h-5 w-5 mr-3" />
            Students
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
            <FileTextIcon className="h-5 w-5 mr-3" />
            Reports
          </NavLink>
          <NavLink to="/kiosk" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
            <CameraIcon className="h-5 w-5 mr-3" />
            Attendance Kiosk
          </NavLink>
          <NavLink to="/story-generator" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
            <BookOpenIcon className="h-5 w-5 mr-3" />
            Story Generator
          </NavLink>
        </nav>

        <div className="mt-auto border-t border-gray-700 pt-6">
          <div className="text-center text-gray-500 text-xs space-y-2">
              <p className="font-bold">Powered by EMPYRA</p>
              <p>CEO – Pitambar Singh</p>
          </div>
        </div>
      </div>
      {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-20 md:hidden"></div>}
    </>
  );
};

export default Sidebar;
