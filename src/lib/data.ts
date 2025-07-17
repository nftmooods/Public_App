// This file is no longer needed for user management as it is handled by Firebase Auth.
// It could be used for other data-related functions in the future,
// but for now, its primary user-related functions are deprecated.
// We will keep the space-related functions for now.

import { db } from './firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import type { Space } from './types';


export async function getSpaces(): Promise<Space[]> {
  const spacesCollection = collection(db, 'spaces');
  const snapshot = await getDocs(spacesCollection);
  const spaces = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Space));
  return spaces.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
}

// addSpace is now in firebase.ts to keep all DB interactions together
// This file can be removed or repurposed later.
