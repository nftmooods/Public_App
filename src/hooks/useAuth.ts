import { useState, useEffect } from 'react';
import { AuthService, ProfileService } from '../lib/supabase';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier l'utilisateur actuel au chargement
    const checkUser = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
          const profile = await ProfileService.getProfile(currentUser.id);
          if (profile) {
            const userData: User = {
              id: profile.id,
              email: profile.email,
              name: profile.name,
              createdAt: profile.created_at,
              apiKeys: {}, // Sera chargé séparément
              subscription: {
                plan: profile.subscription_plan,
                status: profile.subscription_status,
                expiresAt: profile.subscription_expires_at
              }
            };
            setUser(userData);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'utilisateur:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = AuthService.onAuthStateChange(async (authUser) => {
      if (authUser) {
        const profile = await ProfileService.getProfile(authUser.id);
        if (profile) {
          const userData: User = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            createdAt: profile.created_at,
            apiKeys: {},
            subscription: {
              plan: profile.subscription_plan,
              status: profile.subscription_status,
              expiresAt: profile.subscription_expires_at
            }
          };
          setUser(userData);
          setIsAuthenticated(true);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      await AuthService.signUp(email, password, name);
      // L'utilisateur sera mis à jour via onAuthStateChange
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await AuthService.signIn(email, password);
      // L'utilisateur sera mis à jour via onAuthStateChange
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await AuthService.signOut();
      // L'état sera mis à jour via onAuthStateChange
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    signUp,
    signIn,
    signOut
  };
};