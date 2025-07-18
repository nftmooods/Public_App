
// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
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
  orderBy
} from "firebase/firestore";
import { Space } from "./types";

const firebaseConfig = {
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
export const createUserProfileDocument = async (userAuth: any, additionalData: any) => {
    if (!userAuth) return;
    const userDocRef = doc(db, `users/${userAuth.uid}`);
    const snapshot = await getDoc(userDocRef);

    if (!snapshot.exists()) {
        const { displayName, email } = userAuth;
        const createdAt = new Date();
        try {
            await setDoc(userDocRef, {
                name: displayName || additionalData.name,
                email,
                createdAt,
                ...additionalData,
            });
        } catch (error) {
            console.error("Error creating user document", error);
        }
    }
    return userDocRef;
};

export const getUserProfile = async (userId: string) => {
  if (!userId) return null;
  const userDocRef = doc(db, "users", userId);
  const userDocSnap = await getDoc(userDocRef);
  if (userDocSnap.exists()) {
    return userDocSnap.data();
  } else {
    console.log("No such user document!");
    return null;
  }
};


// --- Space Functions ---

// Get all spaces
export const getSpaces = async (): Promise<Space[]> => {
    const spacesCol = collection(db, "spaces");
    const q = query(spacesCol, orderBy("dateTime", "asc"));
    const spaceSnapshot = await getDocs(q);
    const spaceList = spaceSnapshot.docs.map((snap: QueryDocumentSnapshot<DocumentData>) => {
        const data = snap.data();
        return {
            id: snap.id,
            ...data,
            // Ensure date fields are JS Date objects
            dateTime: data.dateTime?.toDate(),
            createdAt: data.createdAt?.toDate(),
        } as Space;
    });
    return spaceList;
};

// Add a new space (for admins)
// Partial type allows not requiring 'id' on creation
export const addSpace = async (spaceData: Omit<Space, 'id'>) => {
  const spacesCol = collection(db, "spaces");
  // Use serverTimestamp() for creation dates
  const newSpaceRef = await addDoc(spacesCol, {
      ...spaceData,
      createdAt: serverTimestamp()
  });
  return newSpaceRef.id;
};

// Update a space (for admins)
export const updateSpace = async (spaceId: string, updatedData: Partial<Space>) => {
  const spaceDoc = doc(db, "spaces", spaceId);
  await updateDoc(spaceDoc, updatedData);
};

// Delete a space (for admins)
export const deleteSpace = async (spaceId: string) => {
  const spaceDoc = doc(db, "spaces", spaceId);
  await deleteDoc(spaceDoc);
};


// --- Favorite Functions ---

// Add a favorite for a user
export const addFavorite = async (userId: string, spaceId: string) => {
  const favoritesCol = collection(db, "favorites");
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
