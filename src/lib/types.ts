export interface Space {
  id: string;
  name: string;
  projectUrl: string;
  dateTime: string; // ISO 8601 format string in UTC
  author?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // In a real app, this would be a hash
  role: 'admin' | 'user';
}
