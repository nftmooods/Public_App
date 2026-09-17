import { useState } from 'react';
import { supabase, ProfileService } from '../lib/supabase';

export const useProfile = () => {
  const [isLoading, setIsLoading] = useState(false);

  const updateProfile = async (updates: { name?: string }) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const updatedProfile = await ProfileService.updateProfile(user.id, updates);
      if (!updatedProfile) {
        throw new Error('Erreur lors de la mise à jour du profil');
      }

      return updatedProfile;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateEmail = async (newEmail: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) {
        throw error;
      }

      // Note: L'email dans la table profiles sera mis à jour automatiquement
      // une fois que l'utilisateur aura confirmé le changement via l'email
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'email:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    setIsLoading(true);
    try {
      // Vérifier d'abord le mot de passe actuel en tentant une connexion
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('Utilisateur non connecté');
      }

      // Tenter de se connecter avec le mot de passe actuel pour le vérifier
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) {
        throw new Error('Mot de passe actuel incorrect');
      }

      // Mettre à jour le mot de passe
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Supprimer d'abord toutes les clés API de l'utilisateur
      const { error: apiKeysError } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('user_id', user.id);

      if (apiKeysError) {
        console.error('Erreur lors de la suppression des clés API:', apiKeysError);
        // On continue même si ça échoue, car les clés seront supprimées en cascade
      }

      // Supprimer le profil (qui supprimera aussi l'utilisateur auth en cascade)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        console.error('Erreur lors de la suppression du profil:', profileError);
        throw new Error('Erreur lors de la suppression du compte');
      }

      // Supprimer l'utilisateur de l'authentification
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (authError) {
        console.error('Erreur lors de la suppression de l\'utilisateur auth:', authError);
        // On peut continuer car le profil a été supprimé
      }

    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateProfile,
    updateEmail,
    updatePassword,
    deleteAccount,
    isLoading
  };
};