
import React, { useState, useRef, useEffect } from 'react';
import { Student } from '../types';
import { XIcon, CameraIcon, AlertTriangleIcon, LoaderIcon } from './icons';

declare const faceapi: any;

interface EnrollStudentFormProps {
  addStudent: (student: Omit<Student, 'id' | 'avatar' | 'lastSeen' | 'attendance'>) => void;
  updateStudent: (studentId: string, data: Partial<Student>) => void;
  studentToEdit: Student | null;
  closeModal: () => void;
}

const MODELS_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

const CameraCapture: React.FC<{ onCapture: (data: { image: string, descriptor: number[] }) => void; onClose: () => void; }> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading Models...');
  const [error, setError] = useState<string | null>(null);
  const [faceData, setFaceData] = useState<any>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoadingMessage('Loading Face Detector...');
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL);
        setLoadingMessage('Loading Face Landmarks...');
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL);
        setLoadingMessage('Loading Face Recognizer...');
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL);
        startCamera();
      } catch (err) {
        setError('Failed to load face recognition models. Please check the network connection.');
        setLoading(false);
      }
    };
    loadModels();
  }, []);
  
  const startCamera = async () => {
      try {
          setLoadingMessage('Accessing Camera...');
          const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
                setLoading(false);
                startDetection();
            };
          }
      } catch (err: any) {
          let message = 'An unexpected error occurred while accessing the camera.';
          if (err.name === 'NotAllowedError') message = 'Camera permission denied. Please allow camera access in your browser settings.';
          else if (err.name === 'NotFoundError') message = 'No camera found. Please ensure a camera is connected.';
          setError(message);
          setLoading(false);
      }
  };

  const startDetection = () => {
    intervalRef.current = window.setInterval(async () => {
      if (videoRef.current && canvasRef.current && !videoRef.current.paused) {
        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options())
          .withFaceLandmarks()
          .withFaceDescriptors();
        
        const videoEl = videoRef.current;
        const canvasEl = canvasRef.current;
        const dims = faceapi.matchDimensions(canvasEl, videoEl, true);
        const resizedDetections = faceapi.resizeResults(detections, dims);
        
        const ctx = canvasEl.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
            faceapi.draw.drawDetections(canvasEl, resizedDetections);
        }

        if (detections.length === 1) {
          setFaceData(detections[0]);
        } else {
          setFaceData(null);
        }
      }
    }, 500);
  };
  
  const handleCapture = () => {
      if (faceData && videoRef.current) {
          const tempCanvas = document.createElement('canvas');
          const video = videoRef.current;
          const targetSize = 400;
          tempCanvas.width = targetSize;
          tempCanvas.height = targetSize;
          const ctx = tempCanvas.getContext('2d');
          
          if(ctx) {
             const { videoWidth, videoHeight } = video;
             const size = Math.min(videoWidth, videoHeight);
             const sx = (videoWidth - size) / 2;
             const sy = (videoHeight - size) / 2;
             ctx.drawImage(video, sx, sy, size, size, 0, 0, targetSize, targetSize);
          }
          
          const image = tempCanvas.toDataURL('image/jpeg');
          const descriptor = Array.from(faceData.descriptor as Float32Array);
          onCapture({ image, descriptor });
      }
  };
  
  useEffect(() => {
    return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
    }
  }, []);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fade-in">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-xl text-center">
            <h3 className="text-xl font-bold mb-2">Enroll Face Profile</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Position a single face in the center of the frame and click capture.</p>
            
            <div className="relative w-full aspect-[4/3] max-w-lg mx-auto bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full"></canvas>
                
                {(loading || error) && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center p-4">
                      {loading && <LoaderIcon className="w-16 h-16 animate-spin text-sky-400" />}
                      {loading && <p className="font-semibold text-lg mt-4 text-white">{loadingMessage}</p>}
                      {error && <AlertTriangleIcon className="w-12 h-12 mb-4 text-red-400" />}
                      {error && <p className="font-semibold text-red-400">{error}</p>}
                  </div>
                )}
            </div>
            
            <div className="mt-6 flex justify-center gap-4">
                 <button onClick={onClose} className="bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500">Cancel</button>
                 <button 
                    onClick={handleCapture} 
                    disabled={!faceData || loading}
                    className="bg-sky-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-600 disabled:bg-sky-300 disabled:cursor-not-allowed">
                     {faceData ? 'Capture & Enroll' : 'No Face Detected'}
                 </button>
            </div>
        </div>
    </div>
  )
}


const EnrollStudentForm: React.FC<EnrollStudentFormProps> = ({ addStudent, updateStudent, studentToEdit, closeModal }) => {
  const [name, setName] = useState('');
  const [rollNo, setRollNo] =useState('');
  const [phone, setPhone] = useState('');
  const [enrolledFaceData, setEnrolledFaceData] = useState<{ image?: string; descriptor?: number[] }>({});
  const [isCameraOpen, setCameraOpen] = useState(false);
  
  const isEditMode = studentToEdit !== null;

  useEffect(() => {
    if (isEditMode && studentToEdit) {
      setName(studentToEdit.name);
      setRollNo(studentToEdit.rollNo);
      setPhone(studentToEdit.phone || '');
      setEnrolledFaceData({
        image: studentToEdit.enrolledFaceImage,
        descriptor: studentToEdit.faceDescriptor,
      });
    }
  }, [studentToEdit, isEditMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && rollNo.trim() && enrolledFaceData.image && enrolledFaceData.descriptor) {
      const studentData = { 
        name, 
        rollNo, 
        phone, 
        enrolledFaceImage: enrolledFaceData.image,
        faceDescriptor: enrolledFaceData.descriptor,
      };
      if (isEditMode && studentToEdit) {
        updateStudent(studentToEdit.id, studentData);
        alert(`Student "${name}" has been updated successfully!`);
      } else {
        addStudent(studentData);
        alert(`Student "${name}" has been enrolled successfully!`);
      }
      closeModal();
    } else {
      alert("Please fill in all required fields and capture the student's face.");
    }
  };

  const handleFaceCaptured = (data: { image: string, descriptor: number[] }) => {
    setEnrolledFaceData(data);
    setCameraOpen(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4 animate-fade-in">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md relative">
          <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <XIcon className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
            {isEditMode ? 'Edit Student Details' : 'Enroll New Student'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" placeholder="e.g., Pitambar Singh" required />
            </div>
            <div>
              <label htmlFor="rollNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Roll Number</label>
              <input type="text" id="rollNo" value={rollNo} onChange={(e) => setRollNo(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" placeholder="e.g., 11B-023" required />
            </div>
             <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number (Optional)</label>
              <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" placeholder="e.g., 9876543210" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Face Profile</label>
                <div className="mt-1 flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        {enrolledFaceData.image ? (
                            <img src={enrolledFaceData.image} alt="Captured face" className="w-full h-full object-cover" />
                        ) : (
                            <CameraIcon className="w-8 h-8 text-gray-400" />
                        )}
                    </div>
                    <button type="button" onClick={() => setCameraOpen(true)} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-500 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
                        {enrolledFaceData.image ? 'Retake Photo' : 'Capture Face'}
                    </button>
                </div>
                {!enrolledFaceData.descriptor && <p className="text-xs text-red-500 mt-1">Face profile is required for attendance.</p>}
            </div>
            <div className="flex justify-end pt-4 gap-2">
              <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
              <button type="submit" className="bg-sky-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600">
                {isEditMode ? 'Save Changes' : 'Enroll Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {isCameraOpen && <CameraCapture onCapture={handleFaceCaptured} onClose={() => setCameraOpen(false)} />}
    </>
  );
};

export default EnrollStudentForm;