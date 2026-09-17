-- Migration pour la gestion des profils utilisateurs

-- Fonction pour mettre à jour l'email dans la table profiles quand l'email auth change
CREATE OR REPLACE FUNCTION handle_email_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour l'email dans la table profiles si il a changé
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public.profiles 
    SET email = NEW.email, updated_at = now()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour synchroniser les changements d'email
DROP TRIGGER IF EXISTS on_auth_user_email_change ON auth.users;
CREATE TRIGGER on_auth_user_email_change
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_email_change();

-- Fonction pour nettoyer les données utilisateur lors de la suppression
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Supprimer toutes les clés API de l'utilisateur
  DELETE FROM public.user_api_keys WHERE user_id = OLD.id;
  
  -- Supprimer le profil utilisateur
  DELETE FROM public.profiles WHERE id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour nettoyer lors de la suppression d'un utilisateur auth
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_deletion();

-- Ajouter une politique pour permettre aux utilisateurs de supprimer leur propre profil
CREATE POLICY "Users can delete own profile"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);