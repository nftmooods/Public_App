
// src/lib/types.ts

// The Space interface uses JavaScript Date objects,
// as Firestore Timestamps are converted upon being fetched.
export interface Space {
    id: string;
    name: string;
    projectUrl: string;
    dateTime: Date;
    authorName: string;
    createdBy: string;
    createdAt: Date;
}

// The User interface matches the structure of the authenticated user object.
export interface User {
  uid: string;
  email: string | null;
  name: string | null;
}
