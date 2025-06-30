import { useState, useEffect } from 'react';
import { AuthService, ProfileService } from '../lib/supabase';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const createUserFromAuthAndProfile = async (authUser: any): Promise<User | null> => {
    try {
      let profile = await ProfileService.getProfile(authUser.id);
      
      // Si le profil n'existe pas, le créer
      if (!profile) {
        console.log('Profil non trouvé, création en cours...');
        const userName = authUser.user_metadata?.name || 
                        authUser.user_metadata?.full_name || 
                        authUser.email.split('@')[0];
        
        profile = await ProfileService.createProfile({
          id: authUser.id,
          email: authUser.email,
          name: userName,
          subscription_plan: 'free',
          subscription_status: 'active',
          subscription_expires_at: undefined
        });
        
        if (!profile) {
          console.error('Impossible de créer le profil utilisateur');
          return null;
        }
        
        console.log('Profil créé avec succès:', profile);
      }

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

      return userData;
    } catch (error) {
      console.error('Erreur lors de la création/récupération du profil:', error);
      return null;
    }
  };

  useEffect(() => {
    // Vérifier l'utilisateur actuel au chargement
    const checkUser = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
          const userData = await createUserFromAuthAndProfile(currentUser);
          if (userData) {
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
        const userData = await createUserFromAuthAndProfile(authUser);
        if (userData) {
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
      const result = await AuthService.signUp(email, password, name);
      
      // Attendre un peu pour que le trigger se déclenche
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Si l'utilisateur est créé mais pas encore confirmé par email
      if (result.user && !result.user.email_confirmed_at) {
        // Créer le profil manuellement si nécessaire
        const userData = await createUserFromAuthAndProfile(result.user);
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
        }
      }
      
      // L'utilisateur sera mis à jour via onAuthStateChange une fois confirmé
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await AuthService.signIn(email, password);
      
      // Vérifier et créer le profil si nécessaire
      if (result.user) {
        const userData = await createUserFromAuthAndProfile(result.user);
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
        }
      }
      
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