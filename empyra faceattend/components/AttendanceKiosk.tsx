import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Student, AttendanceStatus, Alert, AlertType } from '../types';
import { CameraIcon, CheckCircleIcon, XCircleIcon, AlertTriangleIcon, InfoIcon, ClockIcon, LoaderIcon } from './icons';

declare const faceapi: any;

interface AttendanceKioskProps {
    students: Student[];
    markAttendance: (studentId: string, status: AttendanceStatus) => void;
    addAlert: (alert: Omit<Alert, 'id'>) => void;
}

type KioskStatus = 'success' | 'late' | 'not_found' | 'error' | 'already_checked_in' | 'proxy_detected';

const getStatusVisuals = (status: KioskStatus) => {
    switch (status) {
        case 'success': return { icon: CheckCircleIcon, color: 'text-green-400', title: 'Present' };
        case 'late': return { icon: ClockIcon, color: 'text-yellow-400', title: 'Late' };
        case 'already_checked_in': return { icon: InfoIcon, color: 'text-sky-400', title: 'Already Checked In' };
        case 'not_found': return { icon: XCircleIcon, color: 'text-gray-400', title: 'Face Not Recognized' };
        case 'proxy_detected': return { icon: AlertTriangleIcon, color: 'text-red-400', title: 'Proxy Attempt Detected' };
        default: return { icon: AlertTriangleIcon, color: 'text-red-400', title: 'Error' };
    }
};

const MODELS_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

const AttendanceKiosk: React.FC<AttendanceKioskProps> = ({ students, markAttendance, addAlert }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Initializing Kiosk...');
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [kioskState, setKioskState] = useState<'IDLE' | 'PROCESSING' | 'RESULT'>('IDLE');
    const [scanResult, setScanResult] = useState<{ status: KioskStatus, message: string, person: Student | {name: string, avatar: string} } | null>(null);
    const [scannedTodayLog, setScannedTodayLog] = useState<Student[]>([]);
    const [cutoffTime, setCutoffTime] = useState('09:15');
    const faceMatcherRef = useRef<any>(null);

    const [unknownFaceCounter, setUnknownFaceCounter] = useState(0);
    const [proxyAlertCooldown, setProxyAlertCooldown] = useState(false);
    const UNKNOWN_FACE_THRESHOLD = 2; // ~2 seconds of continuous detection

    // Effect 1: Load models and start camera. Runs only once on mount.
    useEffect(() => {
        let isMounted = true;
        const loadModelsAndCamera = async () => {
            // Wait for face-api.js to be available
            await new Promise<void>(resolve => {
                const interval = setInterval(() => {
                    if (isMounted && typeof faceapi !== 'undefined' && faceapi.nets) {
                        clearInterval(interval);
                        resolve();
                    } else if (isMounted) {
                        setLoadingMessage('Waiting for core library...');
                        setLoadingProgress(p => (p < 25 ? p + 0.5 : 25)); 
                    }
                }, 100);
            });

            if (!isMounted) return;

            try {
                setLoadingMessage('Loading Face Detector (1/3)...');
                setLoadingProgress(30);
                await faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL);
                if (!isMounted) return;

                setLoadingMessage('Loading Face Landmarks (2/3)...');
                setLoadingProgress(55);
                await faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL);
                if (!isMounted) return;

                setLoadingMessage('Loading Face Recognizer (3/3)...');
                setLoadingProgress(80);
                await faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL);
                if (!isMounted) return;

                setLoadingMessage('Starting Camera...');
                setLoadingProgress(95);
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, facingMode: 'user' } });
                if (videoRef.current && isMounted) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadeddata = () => {
                        if (isMounted) {
                            setLoadingProgress(100);
                            setModelsLoaded(true);
                        }
                    };
                }
            } catch (err: any) {
                if (!isMounted) return;
                let message = 'An unexpected error occurred while setting up the kiosk.';
                if (err.name === 'NotAllowedError') message = 'Camera permission denied. Please allow camera access in browser settings.';
                else if (err.name === 'NotFoundError') message = 'No camera found. Please ensure a camera is connected and try again.';
                console.error("Kiosk Setup Error:", err);
                setCameraError(message);
            }
        };
        
        loadModelsAndCamera();

        return () => {
            isMounted = false;
            const stream = videoRef.current?.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
        };
    }, []); // Empty dependency array ensures this runs only once.

    // Effect 2: Build Face Matcher when students or models change.
    useEffect(() => {
        if (modelsLoaded && typeof faceapi !== 'undefined') {
            const enrolledStudents = students.filter(s => s.faceDescriptor && s.faceDescriptor.length > 0);
            if (enrolledStudents.length > 0) {
                const labeledDescriptors = enrolledStudents.map(s => 
                    new faceapi.LabeledFaceDescriptors(s.id, [new Float32Array(s.faceDescriptor!)])
                );
                faceMatcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.55);
            } else {
                faceMatcherRef.current = null; // No students enrolled
            }
        }
    }, [modelsLoaded, students]);


    const processMatch = useCallback((studentId: string) => {
        if (kioskState !== 'IDLE') return;
        setKioskState('PROCESSING');
        
        const student = students.find(s => s.id === studentId);
        if (!student) {
            setKioskState('IDLE');
            return;
        }

        let resultStatus: KioskStatus;
        let resultMessage: string;
        
        const today = new Date().toISOString().split('T')[0];
        const todaysAttendance = student.attendance.find(a => a.date === today);

        if (todaysAttendance && (todaysAttendance.status === AttendanceStatus.PRESENT || todaysAttendance.status === AttendanceStatus.LATE)) {
            resultStatus = 'already_checked_in';
            resultMessage = `Checked in today at ${todaysAttendance.checkInTime}.`;
        } else {
            const now = new Date();
            const [cutoffHour, cutoffMinute] = cutoffTime.split(':').map(Number);
            const cutoffDate = new Date();
            cutoffDate.setHours(cutoffHour, cutoffMinute, 0, 0);

            const isLate = now > cutoffDate;
            const newStatus = isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
            markAttendance(student.id, newStatus);
            resultStatus = isLate ? 'late' : 'success';
            resultMessage = `Attendance marked at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}.`;
        }
        
        setScanResult({ status: resultStatus, message: resultMessage, person: student });
        setKioskState('RESULT');
        setTimeout(() => {
            setScanResult(null);
            setKioskState('IDLE');
        }, 4000);
    }, [kioskState, students, cutoffTime, markAttendance]);


    // Effect 3: Recognition Loop
    useEffect(() => {
        if (!modelsLoaded || kioskState !== 'IDLE') return;
        
        let recognitionInterval: number | null = null;
        
        const startRecognition = () => {
             recognitionInterval = window.setInterval(async () => {
                if (kioskState !== 'IDLE' || !videoRef.current || videoRef.current.paused) return;

                const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options())
                    .withFaceLandmarks().withFaceDescriptors();

                if (canvasRef.current && videoRef.current) {
                    const videoEl = videoRef.current;
                    const canvasEl = canvasRef.current;
                    const dims = faceapi.matchDimensions(canvasEl, videoEl, true);
                    const resizedDetections = faceapi.resizeResults(detections, dims);
                    const ctx = canvasEl.getContext('2d');
                    if (ctx) ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

                    if (faceMatcherRef.current) {
                        const results = resizedDetections.map(d => faceMatcherRef.current!.findBestMatch(d.descriptor));
                        
                        results.forEach((result, i) => {
                            const box = resizedDetections[i].detection.box;
                            const student = students.find(s => s.id === result.label);
                            const label = student ? `${student.name}` : 'Unknown';
                            const drawBox = new faceapi.draw.DrawBox(box, { label, boxColor: student ? '#22c55e' : '#ef4444' });
                            drawBox.draw(canvasRef.current!);
                        });

                        if (detections.length === 1 && results[0].label !== 'unknown') {
                            setUnknownFaceCounter(0);
                            processMatch(results[0].label);
                            return;
                        }

                        if (detections.length === 1 && results[0].label === 'unknown') {
                            setUnknownFaceCounter(prev => prev + 1);
                        } else {
                            setUnknownFaceCounter(0);
                        }
                    } else if (resizedDetections.length > 0) {
                        faceapi.draw.drawDetections(canvasRef.current!, resizedDetections);
                    }
                }
            }, 1000);
        }
        
        startRecognition();
        
        return () => {
            if (recognitionInterval) {
                clearInterval(recognitionInterval);
            }
        };
    }, [modelsLoaded, kioskState, students, processMatch]);


    // Effect to trigger proxy alert when counter threshold is met
    useEffect(() => {
        if (unknownFaceCounter >= UNKNOWN_FACE_THRESHOLD && !proxyAlertCooldown && kioskState === 'IDLE') {
            setKioskState('PROCESSING');
            setProxyAlertCooldown(true);
            
            const video = videoRef.current;
            let image = '';
            if (video) {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d')?.drawImage(video, 0, 0);
                image = canvas.toDataURL('image/jpeg');
            }

            const newAlert: Omit<Alert, 'id'> = {
                type: AlertType.PROXY_ATTEMPT,
                message: 'An unrecognized person was detected. An email alert with this image has been dispatched to the administrator.',
                timestamp: new Date().toLocaleString(),
                image: image,
            };
            addAlert(newAlert);
            
            setScanResult({
                status: 'proxy_detected',
                message: 'Security alert sent to administrator.',
                person: { name: 'Unknown Person', avatar: image },
            });
            
            setKioskState('RESULT');
            setUnknownFaceCounter(0);

            setTimeout(() => {
                setScanResult(null);
                setKioskState('IDLE');
            }, 4000);

            setTimeout(() => setProxyAlertCooldown(false), 15000);
        }
    }, [unknownFaceCounter, addAlert, kioskState, proxyAlertCooldown]);


    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const alreadyScanned = students
            .filter(s => s.attendance.some(a => a.date === today && (a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE)))
            .sort((a,b) => {
                const timeA = a.attendance.find(at => at.date === today)?.checkInTime || '00:00 AM';
                const timeB = b.attendance.find(at => at.date === today)?.checkInTime || '00:00 AM';
                const parseTime = (timeStr: string) => new Date(`1970/01/01 ${timeStr}`).getTime();
                return parseTime(timeB) - parseTime(timeA);
            });
        setScannedTodayLog(alreadyScanned);
    }, [students]);

    const renderKioskOverlay = () => {
        if (!modelsLoaded || cameraError) {
             return (
                <div className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center text-white p-4 text-center">
                    {cameraError ? 
                        <AlertTriangleIcon className="w-16 h-16 text-red-400" /> :
                        <LoaderIcon className="w-16 h-16 animate-spin text-sky-400" />
                    }
                    <p className="font-bold text-2xl mt-4">{cameraError ? 'Error' : loadingMessage}</p>
                    {cameraError && <p className="text-sm text-red-300 mt-2">{cameraError}</p>}
                    
                    {!cameraError && (
                        <div className="w-full max-w-xs mt-6">
                            <div className="bg-gray-600 rounded-full h-2.5">
                                <div 
                                    className="bg-sky-400 h-2.5 rounded-full transition-all duration-300 ease-linear"
                                    style={{ width: `${loadingProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        
        if (kioskState === 'RESULT' && scanResult) {
            const visuals = getStatusVisuals(scanResult.status);
            const VisualIcon = visuals.icon;
            return (
                <div className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center text-white p-4 text-center transition-opacity duration-300 animate-fade-in">
                   <VisualIcon className={`w-16 h-16 ${visuals.color}`} />
                    <p className={`font-extrabold text-4xl mt-4 ${visuals.color}`}>{visuals.title}</p>
                    <img 
                        src={(scanResult.person as Student).enrolledFaceImage || scanResult.person.avatar} 
                        alt="Scanned person" 
                        className="w-28 h-28 rounded-full object-cover border-4 border-white/50 shadow-lg my-4" 
                    />
                    <p className="text-2xl font-semibold">{scanResult.person.name}</p>
                    <p className="text-gray-300 mt-1">{scanResult.message}</p>
                </div>
            )
        }
        
        if (kioskState === 'PROCESSING') {
             return (
                <div className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center text-white p-4 text-center">
                    <LoaderIcon className="w-16 h-16 text-sky-400 animate-spin" />
                    <p className="font-bold text-2xl mt-4 text-sky-400">Processing...</p>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Automatic Attendance Kiosk</h2>
                <p className="text-gray-500 dark:text-gray-400">Live face recognition is active. Please look at the camera.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center relative shadow-lg">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full"></canvas>
                        {renderKioskOverlay()}
                    </div>
                </div>

                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                        <h3 className="text-lg font-bold mb-4 text-center">Time Rules</h3>
                         <div className="flex items-center justify-center gap-3">
                            <div>
                                <label htmlFor="cutoff-time" className="block text-xs font-medium text-gray-500">Late After</label>
                                <input type="time" id="cutoff-time" value={cutoffTime} onChange={(e) => setCutoffTime(e.target.value)} className="text-sm p-1 rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"/>
                            </div>
                        </div>
                    </div>
                    <div className="w-full bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex-1">
                        <h3 className="text-lg font-bold mb-4 text-center">Today's Check-ins</h3>
                        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-2">
                        {scannedTodayLog.length > 0 ? (
                            scannedTodayLog.map(student => {
                                const attendanceRecord = student.attendance.find(a => a.date === new Date().toISOString().split('T')[0]);
                                const statusColor = attendanceRecord?.status === AttendanceStatus.LATE ? 'text-yellow-500' : 'text-green-500';
                                return (
                                    <div key={student.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg animate-fade-in">
                                        <img src={student.enrolledFaceImage || student.avatar} alt={student.name} className="w-10 h-10 rounded-full object-cover"/>
                                        <div className="flex-1"><p className="font-semibold text-sm">{student.name}</p><p className="text-xs text-gray-500">Roll: {student.rollNo}</p></div>
                                        <div className="text-right"><p className={`font-bold text-sm ${statusColor}`}>{attendanceRecord?.checkInTime}</p></div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-center text-sm text-gray-500 py-16">No check-ins yet today.</p>
                        )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceKiosk;