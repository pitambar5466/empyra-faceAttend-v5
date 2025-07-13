export enum AttendanceStatus {
  PRESENT = 'Present',
  ABSENT = 'Absent',
  LATE = 'Late',
}

export interface Student {
  id: string;
  name: string;
  phone?: string;
  avatar: string; // This will be the generic avatar
  enrolledFaceImage?: string; // This will be the actual captured face (simulates saved image)
  faceDescriptor?: number[]; // Stores the 128-dimension face embedding
  rollNo: string;
  lastSeen: string;
  attendance: {
    date: string;
    status: AttendanceStatus;
    checkInTime?: string;
  }[];
}

export enum AlertType {
  PROXY_ATTEMPT = 'Proxy Attempt',
  CONSECUTIVE_ABSENCE = 'Consecutive Absence',
  STUDENT_ABSENCE_SMS = 'Student Absence SMS',
}

export interface Alert {
  id:string;
  type: AlertType;
  message: string;
  studentName?: string;
  timestamp: string;
  image?: string;
}

export interface Subscription {
    isActive: boolean;
    isTrial: boolean;
    plan: string;
    expiryDate: Date;
}