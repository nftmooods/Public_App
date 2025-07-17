// src/lib/types.ts

// Update type to use JavaScript Date objects,
// as we convert Firestore Timestamps to Dates.
export interface Space {
    id: string;
    name: string;
    projectUrl: string;
    dateTime: Date;       // Changed from string to Date
    authorName: string;
    createdBy: string;
    createdAt: Date;      // Changed from string to Date
}

// Update User type to match Firebase Auth
export interface User {
  uid: string;
  email: string | null;
  name: string | null;
  role: 'admin' | 'user';
}
