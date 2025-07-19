
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
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
  Timestamp
} from "firebase/firestore";
import type { Space } from "./types";

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
        try {
            await setDoc(userDocRef, {
                name: additionalData.name,
                email,
                createdAt: serverTimestamp(),
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
      return userDocSnap.data() as { name: string; email: string; };
    } else {
      console.log("No such user document!");
      return null;
    }
  } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
  }
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
                tag: data.tag,
                dayOfWeek: data.dayOfWeek,
                startTime: data.startTime,
                endTime: data.endTime,
                timezone: data.timezone,
                authorName: data.authorName,
                createdBy: data.createdBy,
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
            tag: data.tag,
            dayOfWeek: data.dayOfWeek,
            startTime: data.startTime,
            endTime: data.endTime,
            timezone: data.timezone,
            authorName: data.authorName,
            createdBy: data.createdBy,
            // Ensure Firestore Timestamps are converted to JS Date objects
            createdAt: (data.createdAt as Timestamp).toDate(),
        } as Omit<Space, "dateTime">;
    });
    return spaceList;
};

// Add a new space
export const addSpace = async (spaceData: Omit<Space, 'id' | 'createdAt' | 'dateTime'>) => {
  const spacesCol = collection(db, "spaces");
  const newSpaceRef = await addDoc(spacesCol, {
      ...spaceData,
      createdAt: serverTimestamp()
  });
  return newSpaceRef.id;
};

// Update a space
export const updateSpace = async (spaceId: string, updatedData: Partial<Omit<Space, 'id' | 'createdAt' | 'dateTime'>>) => {
  const spaceDoc = doc(db, "spaces", spaceId);
  await updateDoc(spaceDoc, updatedData);
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


export { app, db, auth };
