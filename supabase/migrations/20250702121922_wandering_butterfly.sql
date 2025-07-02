/*
  # Create user_sessions table

  1. New Tables
    - `user_sessions`
      - `id` (uuid, primary key, auto-generated)
      - `user_id` (uuid, foreign key to profiles.id)
      - `session_data` (jsonb, stores session state)
      - `current_step` (integer, current step in the workflow)
      - `created_at` (timestamptz, auto-generated)
      - `updated_at` (timestamptz, auto-generated with trigger)
      - `expires_at` (timestamptz, defaults to 7 days from creation)

  2. Security
    - Enable RLS on `user_sessions` table
    - Add policies for authenticated users to manage their own sessions

  3. Indexes
    - Index on user_id for fast lookups
    - Index on expires_at for cleanup operations
    - Unique constraint on user_id (one session per user)

  4. Triggers
    - Auto-update updated_at timestamp on row updates
*/

-- Create the user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_step integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + '7 days'::interval)
);

-- Add foreign key constraint to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_sessions_user_id_fkey'
  ) THEN
    ALTER TABLE user_sessions 
    ADD CONSTRAINT user_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add unique constraint on user_id (one session per user)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_sessions_user_id_key'
  ) THEN
    ALTER TABLE user_sessions 
    ADD CONSTRAINT user_sessions_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions USING btree (expires_at);

-- Enable Row Level Security
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "Users can read own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = uid());

CREATE POLICY IF NOT EXISTS "Users can insert own sessions"
  ON user_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = uid());

CREATE POLICY IF NOT EXISTS "Users can update own sessions"
  ON user_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = uid())
  WITH CHECK (user_id = uid());

CREATE POLICY IF NOT EXISTS "Users can delete own sessions"
  ON user_sessions
  FOR DELETE
  TO authenticated
  USING (user_id = uid());

-- Create or replace the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_user_sessions_updated_at ON user_sessions;
CREATE TRIGGER update_user_sessions_updated_at
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();