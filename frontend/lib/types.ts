export interface User {
    id: string;
    email: string;
    fullName: string;
    role: 'ADMIN' | 'HOD' | 'FACULTY';
    departmentId?: string;
  }
  
  export interface Schedule {
    id: string;
    userId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    subject: string;
  }
  
  export interface EventItem {
    id: string;
    title: string;
    eventDate: string;
    description?: string;
    departmentId?: string;
  }
  
  export interface ModificationRequest {
    id: string;
    type: 'MODIFICATION' | 'ADDITIONAL' | 'COMPENSATION';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    proposedDate?: string;
    reason: string;
    createdAt: string;
  }