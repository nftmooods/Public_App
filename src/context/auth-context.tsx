
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
  const [isAdmin, setIsAdmin] = useState(false); // Can be deprecated if not used elsewhere
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isHost, setIsHost] = useState(false);

  const fetchUser = useCallback(async (firebaseUser: FirebaseUser | null) => {
     if (firebaseUser) {
        // Fetch Firestore profile and Auth token claims in parallel
        const [userProfile, tokenResult] = await Promise.all([
            getUserProfile(firebaseUser.uid),
            firebaseUser.getIdTokenResult(true) // Force refresh for latest claims
        ]);

        const isSuperAdminClaim = !!tokenResult.claims.SuperAdmin;
        const isAdminClaim = !!tokenResult.claims.admin; // Keep for legacy if needed

        const isHostUser = userProfile?.host ?? false;

        setIsAdmin(isAdminClaim);
        setIsSuperAdmin(isSuperAdminClaim);
        setIsHost(isHostUser);
        
        setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: userProfile?.name || firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            isAdmin: isAdminClaim,
            isSuperAdmin: isSuperAdminClaim,
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
