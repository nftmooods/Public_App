// src/lib/types.ts

// Mettre à jour le type pour utiliser des objets Date JavaScript,
// car nous convertissons les Timestamps Firestore en objets Date.
export interface Space {
    id: string;
    name: string;
    projectUrl: string;
    dateTime: Date;       // Changé de string à Date
    authorName: string;
    createdBy: string;
    createdAt: Date;      // Changé de string à Date
}

// Mettre à jour le type User pour correspondre à Firebase Auth
export interface User {
  uid: string;
  email: string | null;
  name: string | null;
  role: 'admin' | 'user';
}
