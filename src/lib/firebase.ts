
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseOptions, } from "firebase/app";
import { getAuth, updateProfile, deleteUser } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc, 
  query, 
  where,
  getDoc,
  setDoc,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
  orderBy,
  Timestamp,
  writeBatch,
  limit,
  deleteField
} from "firebase/firestore";
import type { Space, User } from "./types";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);


// --- User Functions ---

/**
 * Creates a user profile document in Firestore.
 * This is called right after a user signs up to store their name and other info.
 */
export const createUserProfileDocument = async (userAuth: import('firebase/auth').User, additionalData: { name: string }) => {
    if (!userAuth) return;
    const userDocRef = doc(db, `users/${userAuth.uid}`);
    const snapshot = await getDoc(userDocRef);

    if (!snapshot.exists()) {
        const { email } = userAuth;
        const { name } = additionalData;
        try {
            await setDoc(userDocRef, {
                name: name,
                name_lowercase: name.toLowerCase(),
                email,
                createdAt: serverTimestamp(),
                isHost: false, // Default role
                isSuperAdmin: false, // Default role
            });
        } catch (error) {
            console.error("Error creating user document", error);
        }
    }
    return userDocRef;
};

/**
 * Retrieves a user's profile from Firestore.
 */
export const getUserProfile = async (userId: string) => {
  if (!userId) return null;
  try {
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return userDocSnap.data() as { 
          name: string; 
          email: string; 
          timezone?: string; 
          isHost?: boolean; 
          isSuperAdmin?: boolean; 
      };
    } else {
      console.log("No such user document!");
      return null;
    }
  } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
  }
};


/**
 * Updates a user's profile in Firestore and Firebase Auth.
 */
export const updateUserProfile = async (userId: string, updates: { name?: string, timezone?: string }) => {
    if (!userId) throw new Error("User ID is required to update profile.");
    
    const userDocRef = doc(db, "users", userId);
    const authUser = auth.currentUser;

    const firestoreUpdates: { [key: string]: any } = {};
    if (updates.name) {
        firestoreUpdates.name = updates.name;
        firestoreUpdates.name_lowercase = updates.name.toLowerCase();
    }
    if (updates.timezone) {
        firestoreUpdates.timezone = timezone;
    }

    const promises = [];

    // Update Firestore document
    if (Object.keys(firestoreUpdates).length > 0) {
        promises.push(updateDoc(userDocRef, firestoreUpdates));
    }

    // Update Firebase Auth profile
    if (authUser && updates.name) {
        promises.push(updateProfile(authUser, { displayName: updates.name }));
    }

    await Promise.all(promises);
};

/**
 * Updates the hostName on all spaces created by a specific user.
 */
export const updateUserSpacesHostName = async (userId: string, newName: string) => {
    if (!userId || !newName) return;
    
    const spacesRef = collection(db, "spaces");
    const q = query(spacesRef, where("createdBy", "==", userId));
    
    try {
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        
        querySnapshot.forEach((docSnap) => {
            batch.update(docSnap.ref, { authorName: newName, hostName: newName });
        });
        
        await batch.commit();
        console.log(`Successfully updated hostName to "${newName}" for user ${userId} on ${querySnapshot.size} spaces.`);
    } catch (error) {
        console.error("Error updating hostName on spaces: ", error);
        // We don't re-throw here to avoid breaking the UI flow, but we log it.
    }
};

/**
 * Updates a user's name in their profile and propagates it to all their associated spaces.
 * This is an admin action.
 */
export const updateHostNameForUser = async (uid: string, newName: string) => {
    const batch = writeBatch(db);

    // 1. Update the user document
    const userDocRef = doc(db, "users", uid);
    batch.update(userDocRef, { 
        name: newName,
        name_lowercase: newName.toLowerCase()
    });

    // 2. Find all spaces where the user is a host and update hostName
    const hostSpacesQuery = query(collection(db, "spaces"), where("createdBy", "==", uid));
    const hostSpacesSnapshot = await getDocs(hostSpacesQuery);
    hostSpacesSnapshot.forEach(spaceDoc => {
        batch.update(spaceDoc.ref, { hostName: newName, authorName: newName });
    });

    // 3. Find all spaces where the user is a co-host and update coHostName
    const originalUserDoc = await getDoc(userDocRef);
    const originalName = originalUserDoc.data()?.name;

    if (originalName) {
        const coHostSpacesQuery = query(collection(db, "spaces"), where("coHostName", "==", originalName));
        const coHostSpacesSnapshot = await getDocs(coHostSpacesQuery);
        coHostSpacesSnapshot.forEach(spaceDoc => {
            batch.update(spaceDoc.ref, { coHostName: newName });
        });
    }

    // Commit all changes
    await batch.commit();
};


/**
 * Deletes a user's account from Firebase Auth and Firestore.
 */
export const deleteUserAccount = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("No user is currently signed in.");
  }

  // Firestore document reference
  const userDocRef = doc(db, "users", currentUser.uid);

  // Delete Firestore document first
  await deleteDoc(userDocRef);
  
  // Then, delete the user from Firebase Auth
  await deleteUser(currentUser);
  
  // Note: Deleting associated spaces or other user data is not handled here
  // and would require a more complex cleanup, possibly with a Cloud Function.
};

/**
 * Retrieves all users from Firestore.
 */
export const getAllUsers = async (): Promise<User[]> => {
    const usersCol = collection(db, "users");
    const usersSnapshot = await getDocs(query(usersCol, orderBy("name_lowercase")));
    const userList = usersSnapshot.docs.map((snap) => {
        const data = snap.data();
        return {
            uid: snap.id,
            name: data.name,
            email: data.email,
            isHost: !!data.isHost,
            isSuperAdmin: !!data.isSuperAdmin,
            // Fallback for older data that might not have these fields
        } as User;
    });
    return userList;
}

/**
 * Updates a user's roles in Firestore.
 */
export const updateUserRoles = async (userId: string, roles: { isHost?: boolean; isSuperAdmin?: boolean }) => {
    if (!userId) throw new Error("User ID is required to update roles.");
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, roles);
};


// --- Space Functions ---

// Get a single space by its ID
export const getSpace = async (spaceId: string): Promise<Omit<Space, "dateTime"> | null> => {
    try {
        const spaceDocRef = doc(db, "spaces", spaceId);
        const spaceDocSnap = await getDoc(spaceDocRef);

        if (spaceDocSnap.exists()) {
            const data = spaceDocSnap.data();
            return {
                id: spaceDocSnap.id,
                name: data.name,
                projectUrl: data.projectUrl,
                tags: data.tags,
                dayOfWeek: data.dayOfWeek,
                startTime: data.startTime,
                endTime: data.endTime,
                timezone: data.timezone,
                authorName: data.authorName,
                hostName: data.hostName,
                coHostName: data.coHostName,
                createdBy: data.createdBy,
                isActive: data.isActive,
                isCertified: data.isCertified,
                createdAt: (data.createdAt as Timestamp).toDate(),
            } as Omit<Space, "dateTime">;
        } else {
            console.log("No such space document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting space:", error);
        return null;
    }
};

// Get all spaces
export const getSpaces = async (): Promise<Omit<Space, "dateTime">[]> => {
    const spacesCol = collection(db, "spaces");
    // We sort by day of week now
    const q = query(spacesCol, orderBy("dayOfWeek", "asc"));
    const spaceSnapshot = await getDocs(q);
    const spaceList = spaceSnapshot.docs.map((snap: QueryDocumentSnapshot<DocumentData>) => {
        const data = snap.data();
        return {
            id: snap.id,
            name: data.name,
            projectUrl: data.projectUrl,
            tags: data.tags,
            dayOfWeek: data.dayOfWeek,
            startTime: data.startTime,
            endTime: data.endTime,
            timezone: data.timezone,
            authorName: data.authorName,
            hostName: data.hostName,
            coHostName: data.coHostName,
            createdBy: data.createdBy,
            isActive: data.isActive,
            isCertified: data.isCertified,
            // Ensure Firestore Timestamps are converted to JS Date objects
            createdAt: (data.createdAt as Timestamp).toDate(),
        } as Omit<Space, "dateTime">;
    });
    return spaceList;
};

// Add a new space
export const addSpace = async (spaceData: Omit<Space, 'id' | 'createdAt' | 'dateTime'>) => {
  const spacesCol = collection(db, "spaces");
  const dataToSave = {
      ...spaceData,
      isActive: true, // Default to active
      createdAt: serverTimestamp()
  };
   if (!dataToSave.coHostName) {
    delete (dataToSave as Partial<typeof dataToSave>).coHostName;
  }
  if (!dataToSave.projectUrl) {
    delete (dataToSave as Partial<typeof dataToSave>).projectUrl;
  }
   if (!dataToSave.hostName) {
     // This case should not happen with the new logic, but as a safeguard
    dataToSave.hostName = dataToSave.authorName;
  }
  const newSpaceRef = await addDoc(spacesCol, dataToSave);
  return newSpaceRef.id;
};

// Update a space
export const updateSpace = async (spaceId: string, updatedData: Partial<Omit<Space, 'id' | 'createdAt' | 'dateTime'>>) => {
  const spaceDoc = doc(db, "spaces", spaceId);
  const dataToUpdate = {...updatedData};

  if ('coHostName' in dataToUpdate && !dataToUpdate.coHostName) {
      (dataToUpdate as any).coHostName = deleteField();
  }
   if ('projectUrl' in dataToUpdate && !dataToUpdate.projectUrl) {
      (dataToUpdate as any).projectUrl = deleteField();
  }
  if ('endTime' in dataToUpdate && !dataToUpdate.endTime) {
      (dataToUpdate as any).endTime = deleteField();
  }

  await updateDoc(spaceDoc, dataToUpdate);
};

// Update just the host name for a specific space
export const updateSpaceHostName = async (spaceId: string, newHostName: string) => {
    const spaceDoc = doc(db, "spaces", spaceId);
    await updateDoc(spaceDoc, {
        hostName: newHostName,
    });
};

// Update just the author name for a specific space
export const updateSpaceAuthorName = async (spaceId: string, newAuthorName: string) => {
    const spaceDoc = doc(db, "spaces", spaceId);
    await updateDoc(spaceDoc, {
        authorName: newAuthorName,
    });
};


// Delete a space
export const deleteSpace = async (spaceId: string) => {
  const spaceDoc = doc(db, "spaces", spaceId);
  await deleteDoc(spaceDoc);
};


// --- Favorite Functions ---

// Add a favorite for a user
export const addFavorite = async (userId: string, spaceId: string) => {
  const favoritesCol = collection(db, "favorites");
  // Check if it already exists to avoid duplicates
  const q = query(favoritesCol, where("userId", "==", userId), where("spaceId", "==", spaceId));
  const existing = await getDocs(q);
  if (!existing.empty) {
      return existing.docs[0].id;
  }
  const newFavoriteRef = await addDoc(favoritesCol, { userId, spaceId, favoritedAt: serverTimestamp() });
  return newFavoriteRef.id;
};

// Remove a favorite
export const removeFavorite = async (favoriteId: string) => {
  const favoriteDoc = doc(db, "favorites", favoriteId);
  await deleteDoc(favoriteDoc);
};

// Get all favorites for a user
export const getFavorites = async (userId: string) => {
  const favoritesCol = collection(db, "favorites");
  const q = query(favoritesCol, where("userId", "==", userId));
  const favoriteSnapshot = await getDocs(q);
  const favoriteList = favoriteSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return favoriteList;
};

// Get a count of favorites for all spaces
export const getFavoriteCounts = async (): Promise<Record<string, number>> => {
  const favoritesCol = collection(db, "favorites");
  const favoriteSnapshot = await getDocs(favoritesCol);
  
  const counts: Record<string, number> = {};
  favoriteSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.spaceId) {
      counts[data.spaceId] = (counts[data.spaceId] || 0) + 1;
    }
  });
  
  return counts;
};


export { app, db, auth };

// NOTE: The Firebase Admin SDK is initialized in a separate file (e.g., src/lib/firebase-admin.ts)
// for server-side operations (like scripts) to avoid exposing admin credentials to the client.
// The `getAuth()` from 'firebase-admin/auth' is used there, not to be confused with client-side `getAuth()`.
