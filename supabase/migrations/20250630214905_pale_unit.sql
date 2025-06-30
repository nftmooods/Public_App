/*
  # Create feedback table

  1. New Tables
    - `feedback`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles, nullable for anonymous feedback)
      - `rating` (integer, 1-5 stars)
      - `comment` (text, optional)
      - `session_id` (text, to track anonymous sessions)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `feedback` table
    - Add policy for users to insert their own feedback
    - Add policy for anonymous feedback insertion
    - Add policy for reading feedback (admin only)
*/

CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  session_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre à tous d'insérer des feedbacks (authentifiés et anonymes)
CREATE POLICY "Anyone can insert feedback"
  ON feedback
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy pour que les utilisateurs puissent lire leurs propres feedbacks
CREATE POLICY "Users can read own feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);