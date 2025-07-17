import type { Space, User } from './types';

const today = new Date();
today.setUTCHours(18, 0, 0, 0); // Set to 6 PM UTC today

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setUTCHours(20, 0, 0, 0); // Set to 8 PM UTC tomorrow

const dayAfter = new Date();
dayAfter.setDate(dayAfter.getDate() + 2);
dayAfter.setUTCHours(17, 30, 0, 0); // Set to 5:30 PM UTC day after tomorrow

const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);
nextWeek.setUTCHours(19, 0, 0, 0); // Set to 7 PM UTC next week

const spaces: Space[] = [
  {
    id: '1',
    name: 'ApeChain Community Call',
    projectUrl: 'https://apechain.com',
    dateTime: today.toISOString(),
    author: 'admin',
  },
  {
    id: '2',
    name: 'NFT Showcase with Yuga Labs',
    projectUrl: 'https://yuga.com',
    dateTime: tomorrow.toISOString(),
    author: 'admin',
  },
  {
    id: '3',
    name: 'DeFi on ApeChain Deep Dive',
    projectUrl: 'https://defionape.com',
    dateTime: dayAfter.toISOString(),
    author: 'admin',
  },
  {
    id: '4',
    name: 'Gaming Guild AMA',
    projectUrl: 'https://gamingguild.com',
    dateTime: nextWeek.toISOString(),
    author: 'user1',
  },
  {
    id: '5',
    name: 'Art & Culture on ApeChain',
    projectUrl: 'https://cultureape.com',
    dateTime: new Date(today.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours after the first one
    author: 'user2',
  },
];

// In-memory user store for demonstration
const users: User[] = [
    { id: '1', name: 'Admin User', email: 'admin@example.com', password: 'password', role: 'admin' },
    { id: '2', name: 'Test User', email: 'user@example.com', password: 'password', role: 'user' },
];


export async function getSpaces(): Promise<Space[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  // Sort spaces by date to ensure consistent order
  return [...spaces].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
}

export async function addSpace(space: Omit<Space, 'id'>): Promise<Space> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newSpace: Space = {
        id: new Date().getTime().toString(),
        ...space,
    };
    spaces.push(newSpace);
    return newSpace;
}

// User-related functions
export async function getUserByEmail(email: string): Promise<User | undefined> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return users.find(user => user.email === email);
}

export async function addUser(userData: Omit<User, 'id' | 'role'>): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const existingUser = await getUserByEmail(userData.email);
    if (existingUser) {
        throw new Error("User with this email already exists.");
    }
    const newUser: User = {
        id: new Date().getTime().toString(),
        ...userData,
        role: 'user', // Default role for new users
    };
    users.push(newUser);
    return newUser;
}
