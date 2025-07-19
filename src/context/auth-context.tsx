
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@/lib/types';
import { auth, getUserProfile } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
            // User is signed in
            const userProfile = await getUserProfile(firebaseUser.uid);
            const tokenResult = await firebaseUser.getIdTokenResult();
            const isAdminClaim = !!tokenResult.claims.admin;

            setIsAdmin(isAdminClaim);
            setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: userProfile?.name || firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                isAdmin: isAdminClaim,
            });
        } else {
            // User is signed out
            setUser(null);
            setIsAdmin(false);
        }
        setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const value = { user, loading, isAdmin };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
