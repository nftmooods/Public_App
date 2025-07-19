// src/lib/types.ts

// The Space interface uses a day of the week and time for recurring weekly events.
export interface Space {
    id: string;
    name: string;
    projectUrl: string;
    dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
    time: string; // "HH:mm"
    timezone: string;
    authorName: string;
    createdBy: string;
    createdAt: Date;
    // This will be dynamically calculated on the client
    dateTime?: Date; 
}

// The User interface matches the structure of the authenticated user object.
export interface User {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL?: string | null;
}
