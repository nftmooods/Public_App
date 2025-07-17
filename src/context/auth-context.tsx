"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useLocalStorage<User | null>('user', null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This effect runs on mount to check the initial auth state.
    // The useLocalStorage hook will update the state with the value from localStorage.
    setLoading(false);
  }, []);


  const login = (userData: User) => {
    // Omit password before setting it in context and local storage
    const { password, ...userToStore } = userData;
    setUser(userToStore);
  };

  const logout = () => {
    setUser(null);
    // On logout, redirect to home to prevent being on a protected page
    window.location.href = '/';
  };

  const value = { user, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
