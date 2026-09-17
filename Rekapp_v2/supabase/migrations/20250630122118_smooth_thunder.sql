/*
  # Migration pour l'authentification et les clés API utilisateur

  1. Tables créées
    - `profiles` : Extension des utilisateurs auth.users avec abonnements
    - `user_api_keys` : Stockage sécurisé des clés API utilisateur

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques pour l'accès aux données utilisateur uniquement
    - Triggers automatiques pour la création de profils

  3. Fonctionnalités
    - Création automatique de profil lors de l'inscription
    - Gestion des timestamps automatiques
    - Index pour les performances
*/

-- Créer la table profiles pour étendre auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  name text,
  subscription_plan text DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'enterprise')),
  subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
  subscription_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS sur profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes pour profiles si elles existent
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Créer les politiques pour profiles
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Créer ou modifier la table user_api_keys
DO $$
BEGIN
  -- Vérifier si la table existe
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_api_keys') THEN
    -- Créer la table si elle n'existe pas
    CREATE TABLE user_api_keys (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name text NOT NULL,
      provider text NOT NULL,
      usage_type text NOT NULL,
      api_key text NOT NULL,
      masked_key text NOT NULL,
      enabled boolean DEFAULT true,
      last_tested timestamptz,
      is_valid boolean DEFAULT true,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  ELSE
    -- Ajouter les colonnes manquantes si la table existe déjà
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_api_keys' AND column_name = 'enabled') THEN
      ALTER TABLE user_api_keys ADD COLUMN enabled boolean DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_api_keys' AND column_name = 'last_tested') THEN
      ALTER TABLE user_api_keys ADD COLUMN last_tested timestamptz;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_api_keys' AND column_name = 'is_valid') THEN
      ALTER TABLE user_api_keys ADD COLUMN is_valid boolean DEFAULT true;
    END IF;
    
    -- Modifier la référence de clé étrangère si nécessaire
    IF EXISTS (SELECT FROM information_schema.table_constraints WHERE table_name = 'user_api_keys' AND constraint_name = 'user_api_keys_user_id_fkey') THEN
      ALTER TABLE user_api_keys DROP CONSTRAINT user_api_keys_user_id_fkey;
    END IF;
    
    -- Ajouter la nouvelle contrainte de clé étrangère vers profiles
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE table_name = 'user_api_keys' AND constraint_name = 'user_api_keys_user_id_profiles_fkey') THEN
      ALTER TABLE user_api_keys ADD CONSTRAINT user_api_keys_user_id_profiles_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- S'assurer que RLS est activé sur user_api_keys
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes pour user_api_keys si elles existent
DROP POLICY IF EXISTS "Users can view their own API keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can insert their own API keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON user_api_keys;

-- Créer les politiques pour user_api_keys
CREATE POLICY "Users can view their own API keys"
  ON user_api_keys
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own API keys"
  ON user_api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own API keys"
  ON user_api_keys
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own API keys"
  ON user_api_keys
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger existant s'il existe et le recréer
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer les triggers existants s'ils existent et les recréer
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_api_keys_updated_at ON user_api_keys;
CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON user_api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Créer des index pour améliorer les performances (seulement s'ils n'existent pas)
DO $$
BEGIN
  -- Index pour profiles
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'profiles' AND indexname = 'idx_profiles_email') THEN
    CREATE INDEX idx_profiles_email ON profiles(email);
  END IF;
  
  -- Index pour user_api_keys
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'user_api_keys' AND indexname = 'idx_user_api_keys_user_id') THEN
    CREATE INDEX idx_user_api_keys_user_id ON user_api_keys(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'user_api_keys' AND indexname = 'idx_user_api_keys_provider') THEN
    CREATE INDEX idx_user_api_keys_provider ON user_api_keys(provider);
  END IF;
  
  -- Créer l'index pour enabled seulement si la colonne existe
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_api_keys' AND column_name = 'enabled') THEN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'user_api_keys' AND indexname = 'idx_user_api_keys_enabled') THEN
      CREATE INDEX idx_user_api_keys_enabled ON user_api_keys(enabled);
    END IF;
  END IF;
END $$;