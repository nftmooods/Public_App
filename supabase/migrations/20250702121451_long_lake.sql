/*
  # Add user sessions table for temporary content storage

  1. New Tables
    - `user_sessions` - Stockage temporaire du contenu des étapes
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `session_data` (jsonb) - Contenu de toutes les étapes
      - `current_step` (integer) - Étape actuelle
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `expires_at` (timestamptz) - Expiration automatique après 7 jours

  2. Security
    - Enable RLS on `user_sessions` table
    - Add policies for users to manage their own sessions
    - Add automatic cleanup of expired sessions

  3. Indexes
    - Index on user_id for fast retrieval
    - Index on expires_at for cleanup
*/

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_data jsonb NOT NULL DEFAULT '{}',
  current_step integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  UNIQUE(user_id) -- Un seul session active par utilisateur
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_user_sessions_updated_at ON user_sessions;
CREATE TRIGGER update_user_sessions_updated_at
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour user_sessions
CREATE POLICY "Users can read own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions"
  ON user_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON user_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions"
  ON user_sessions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Fonction pour nettoyer automatiquement les sessions expirées
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions 
  WHERE expires_at < now();
  
  RAISE LOG 'Cleaned up expired user sessions';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour réinitialiser la session d'un utilisateur
CREATE OR REPLACE FUNCTION reset_user_session(p_user_id uuid)
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions WHERE user_id = p_user_id;
  
  INSERT INTO user_sessions (user_id, session_data, current_step)
  VALUES (p_user_id, '{}', 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;