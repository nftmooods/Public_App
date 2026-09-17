/*
  # Create transcriptions table for user uploads

  1. New Tables
    - `transcriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `title` (text)
      - `original_filename` (text)
      - `file_type` (text) - 'audio' or 'text'
      - `file_size` (bigint)
      - `transcription_text` (text)
      - `key_points` (jsonb)
      - `speakers` (jsonb)
      - `duration` (integer, for audio files)
      - `language` (text)
      - `status` (text) - 'processing', 'completed', 'error'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `transcriptions` table
    - Add policies for users to manage their own transcriptions

  3. Constraints
    - Maximum 5 transcriptions per user
    - Foreign key to profiles table
*/

CREATE TABLE IF NOT EXISTS transcriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  original_filename text,
  file_type text CHECK (file_type IN ('audio', 'text')) NOT NULL,
  file_size bigint,
  transcription_text text,
  key_points jsonb DEFAULT '[]'::jsonb,
  speakers jsonb DEFAULT '[]'::jsonb,
  duration integer, -- in seconds, for audio files
  language text DEFAULT 'en',
  status text CHECK (status IN ('processing', 'completed', 'error')) DEFAULT 'processing',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_transcriptions_user_id ON transcriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON transcriptions(status);
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON transcriptions(created_at DESC);

-- Enable RLS
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own transcriptions"
  ON transcriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transcriptions"
  ON transcriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own transcriptions"
  ON transcriptions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own transcriptions"
  ON transcriptions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_transcriptions_updated_at ON transcriptions;
CREATE TRIGGER update_transcriptions_updated_at
  BEFORE UPDATE ON transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check transcription limit (max 5 per user)
CREATE OR REPLACE FUNCTION check_transcription_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM transcriptions WHERE user_id = NEW.user_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 transcriptions allowed per user. Please delete some transcriptions before adding new ones.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce transcription limit
DROP TRIGGER IF EXISTS enforce_transcription_limit ON transcriptions;
CREATE TRIGGER enforce_transcription_limit
  BEFORE INSERT ON transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION check_transcription_limit();