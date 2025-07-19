// src/lib/types.ts

// The Space interface uses a day of the week and time for recurring weekly events.
export interface Space {
    id: string;
    name: string;
    projectUrl: string;
    tag: "SPACE" | "STREAM" | "DISCORD VC";
    dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
    startTime: string; // "HH:mm"
    endTime?: string; // "HH:mm" - Optional
    timezone: string;
    authorName: string; // The display name of the user who created the event.
    createdBy: string; // The UID of the user who created the event.
    createdAt: Date;
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
  isAdmin?: boolean;
  timezone?: string;
}
