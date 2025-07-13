
import React, { useState } from 'react';
import { Student } from '../types';
import EnrollStudentForm from './EnrollStudentForm';
import { ShieldCheckIcon, TrashIcon, PencilIcon, AlertTriangleIcon } from './icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmButtonText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Delete',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
            <AlertTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
              {title}
            </h3>
            <div className="mt-2">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {message}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm"
            onClick={onConfirm}
          >
            {confirmButtonText}
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:mt-0 sm:w-auto sm:text-sm"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

interface StudentsPageProps {
  students: Student[];
  addStudent: (student: Omit<Student, 'id' | 'avatar' | 'lastSeen' | 'attendance'>) => void;
  updateStudent: (studentId: string, data: Partial<Student>) => void;
  removeStudent: (studentId: string) => void;
}

const StudentsPage: React.FC<StudentsPageProps> = ({ students, addStudent, updateStudent, removeStudent }) => {
  const [isEnrollModalOpen, setEnrollModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.phone && student.phone.includes(searchTerm))
  );

  const handleOpenEnroll = () => {
    setStudentToEdit(null);
    setEnrollModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setStudentToEdit(student);
    setEnrollModalOpen(true);
  };

  const handleCloseEnrollModal = () => {
    setStudentToEdit(null);
    setEnrollModalOpen(false);
  };
  
  const handleConfirmDelete = () => {
    if (studentToDelete) {
      removeStudent(studentToDelete.id);
      setStudentToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Student Management</h2>
          <p className="text-gray-500 dark:text-gray-400">View, search, edit, and enroll students with face capture.</p>
        </div>
        <button
          onClick={handleOpenEnroll}
          className="bg-sky-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600 transition-colors w-full md:w-auto"
        >
          Enroll New Student
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
        <input
          type="text"
          placeholder="Search by name, roll number, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">Roll Number</th>
                <th scope="col" className="px-6 py-3">Phone Number</th>
                <th scope="col" className="px-6 py-3">Last Seen</th>
                <th scope="col" className="px-6 py-3 text-center">Face Enrolled</th>
                <th scope="col" className="px-6 py-3 text-center">Student ID</th>
                <th scope="col" className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img className="w-10 h-10 rounded-full object-cover" src={student.enrolledFaceImage || student.avatar} alt={`${student.name} avatar`} />
                      <span>{student.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono">{student.rollNo}</td>
                  <td className="px-6 py-4 font-mono">{student.phone || 'N/A'}</td>
                  <td className="px-6 py-4">{student.lastSeen}</td>
                  <td className="px-6 py-4 text-center">
                    {student.faceDescriptor && <ShieldCheckIcon className="w-5 h-5 text-green-500 mx-auto" />}
                  </td>
                  <td className="px-6 py-4 text-center font-mono">{student.id}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => handleOpenEdit(student)}
                            className="text-sky-600 hover:text-sky-800 dark:hover:text-sky-400 p-1 rounded-full transition-colors"
                            title="Edit Student"
                        >
                            <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setStudentToDelete(student)}
                          className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded-full transition-colors"
                          title="Remove Student"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStudents.length === 0 && <p className="text-center p-8 text-gray-500">No students found matching your search. Try enrolling a new student.</p>}
        </div>
      </div>
      
      {isEnrollModalOpen && (
        <EnrollStudentForm 
            addStudent={addStudent} 
            updateStudent={updateStudent}
            studentToEdit={studentToEdit}
            closeModal={handleCloseEnrollModal} 
        />
      )}

      <ConfirmationModal 
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Student"
        message={
            <p>Are you sure you want to remove <strong className="text-gray-900 dark:text-white">{studentToDelete?.name}</strong>? This action is permanent and cannot be undone.</p>
        }
      />
    </div>
  );
};

export default StudentsPage;
