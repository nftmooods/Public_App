import { db } from './firebase';
import { collection, getDocs, addDoc, query, where, writeBatch } from 'firebase/firestore';
import type { Space, User } from './types';

// NOTE: The data is now managed in Firestore.
// The initial data is kept here for seeding purposes.
const initialSpacesData: Omit<Space, 'id'>[] = [
  { name: 'ApeChain Community Call', projectUrl: 'https://apechain.com', dateTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), author: 'admin' },
  { name: 'NFT Showcase with Yuga Labs', projectUrl: 'https://yuga.com', dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), author: 'admin' },
  { name: 'DeFi on ApeChain Deep Dive', projectUrl: 'https://defionape.com', dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), author: 'admin' },
  { name: 'Gaming Guild AMA', projectUrl: 'https://gamingguild.com', dateTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), author: 'user1' },
  { name: 'Art & Culture on ApeChain', projectUrl: 'https://cultureape.com', dateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), author: 'user2' },
];

const initialUsersData: Omit<User, 'id'>[] = [
  { name: 'Admin User', email: 'admin@example.com', password: 'password', role: 'admin' },
  { name: 'Test User', email: 'user@example.com', password: 'password', role: 'user' },
];

// IMPORTANT: Run this function once to seed your Firestore database.
// You can do this by creating a temporary page or a script.
// Example: Create a temporary route in your app, call this function from there,
// and then remove the route.
export async function seedDatabase() {
  const batch = writeBatch(db);

  // Seed spaces
  const spacesCollection = collection(db, 'spaces');
  const existingSpaces = await getDocs(spacesCollection);
  if (existingSpaces.empty) {
    console.log("Seeding spaces...");
    initialSpacesData.forEach(space => {
      const docRef = addDoc(spacesCollection, {}); // placeholder to get a ref
      batch.set(docRef, space);
    });
  } else {
    console.log("Spaces collection already has data. Skipping seed.");
  }

  // Seed users
  const usersCollection = collection(db, 'users');
  const existingUsers = await getDocs(usersCollection);
  if (existingUsers.empty) {
    console.log("Seeding users...");
    initialUsersData.forEach(user => {
      const docRef = addDoc(usersCollection, {}); // placeholder
      batch.set(docRef, user);
    });
  } else {
    console.log("Users collection already has data. Skipping seed.");
  }
  
  await batch.commit();
  console.log("Database seeding complete (if not skipped).");
}

export async function getSpaces(): Promise<Space[]> {
  const spacesCollection = collection(db, 'spaces');
  const snapshot = await getDocs(spacesCollection);
  const spaces = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Space));
  return spaces.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
}

export async function addSpace(space: Omit<Space, 'id'>): Promise<Space> {
  const spacesCollection = collection(db, 'spaces');
  const docRef = await addDoc(spacesCollection, space);
  return { id: docRef.id, ...space };
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const usersCollection = collection(db, 'users');
  const q = query(usersCollection, where('email', '==', email));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return undefined;
  }
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as User;
}

export async function addUser(userData: Omit<User, 'id' | 'role'>): Promise<User> {
  const existingUser = await getUserByEmail(userData.email);
  if (existingUser) {
    throw new Error("User with this email already exists.");
  }

  const newUser: Omit<User, 'id'> = {
    ...userData,
    role: 'user', // Default role
  };

  const usersCollection = collection(db, 'users');
  const docRef = await addDoc(usersCollection, newUser);
  return { id: docRef.id, ...newUser };
}