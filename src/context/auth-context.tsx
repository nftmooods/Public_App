
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User } from '@/lib/types';
import { auth, getUserProfile } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isHost: boolean;
  forceReload: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isHost, setIsHost] = useState(false);

  const fetchUser = useCallback(async (firebaseUser: FirebaseUser | null) => {
     if (firebaseUser) {
        const userProfile = await getUserProfile(firebaseUser.uid);

        const isSuperAdminDb = userProfile?.isSuperAdmin ?? false;
        const isHostUser = userProfile?.isHost ?? false;
        const isCertifiedUser = userProfile?.isCertified ?? false;

        setIsSuperAdmin(isSuperAdminDb);
        setIsHost(isHostUser);
        
        setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: userProfile?.name || firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            isSuperAdmin: isSuperAdminDb,
            isHost: isHostUser,
            isCertified: isCertifiedUser,
            timezone: userProfile?.timezone,
        });
    } else {
        // User is signed out
        setUser(null);
        setIsSuperAdmin(false);
        setIsHost(false);
    }
    setLoading(false);
  }, []);

  const forceReload = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
        setLoading(true);
        // We force a token refresh to ensure custom claims are up-to-date,
        // although we prioritize the database field for roles.
        await firebaseUser.getIdToken(true); 
        await fetchUser(firebaseUser);
    }
  }, [fetchUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, fetchUser);
    return () => unsubscribe();
  }, [fetchUser]);

  const value = { user, loading, isSuperAdmin, isHost, forceReload };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
