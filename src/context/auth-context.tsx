
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User } from '@/lib/types';
import { auth, getUserProfile } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isHost: boolean;
  forceReload: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isHost, setIsHost] = useState(false);

  const fetchUser = useCallback(async (firebaseUser: FirebaseUser | null) => {
     if (firebaseUser) {
        // User is signed in
        const userProfile = await getUserProfile(firebaseUser.uid);
        // Force refresh of the token to get the latest claims
        const tokenResult = await firebaseUser.getIdTokenResult(true);
        const isAdminClaim = !!tokenResult.claims.admin;
        
        // Use fields from Firestore profile
        const isSuperAdminUser = !!userProfile?.SuperAdmin;
        const isHostUser = !!userProfile?.host;

        setIsAdmin(isAdminClaim);
        setIsSuperAdmin(isSuperAdminUser);
        setIsHost(isHostUser);
        setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: userProfile?.name || firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            isAdmin: isAdminClaim,
            isSuperAdmin: isSuperAdminUser,
            isHost: isHostUser,
            timezone: userProfile?.timezone,
        });
    } else {
        // User is signed out
        setUser(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsHost(false);
    }
    setLoading(false);
  }, []);

  const forceReload = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
        setLoading(true);
        await fetchUser(firebaseUser);
    }
  }, [fetchUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, fetchUser);
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [fetchUser]);

  const value = { user, loading, isAdmin, isSuperAdmin, isHost, forceReload };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
