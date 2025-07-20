
// src/lib/types.ts

// The Space interface uses a day of the week and time for recurring weekly events.
export interface Space {
    id: string;
    name: string;
    projectUrl?: string;
    tags: string[];
    dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
    startTime: string; // "HH:mm"
    endTime?: string; // "HH:mm" - Optional
    timezone: string;
    authorName: string; // The display name of the user who created the event.
    hostName?: string; // The display name of the user who created the event.
    coHostName?: string; // Optional name for a co-host
    createdBy: string; // The UID of the user who created the event.
    createdAt: Date;
    isActive?: boolean; // Controls visibility in the schedule
    isCertified?: boolean; // Added for super admin certification
    // This will be dynamically calculated on the client
    dateTime?: Date; 
    dayColor?: string;
}

// The User interface matches the structure of the authenticated user object.
export interface User {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL?: string | null;
  isSuperAdmin: boolean;
  isHost: boolean;
  isCertified?: boolean; // Added for user certification
  timezone?: string;
}
