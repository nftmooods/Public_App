-- Add model column to user_api_keys table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_api_keys' AND column_name = 'model'
  ) THEN
    ALTER TABLE user_api_keys ADD COLUMN model text;
  END IF;
END $$;

-- Set default models for existing records
UPDATE user_api_keys 
SET model = CASE 
  WHEN provider = 'google_ai' THEN 'gemini-2.5-flash'
  WHEN provider = 'openai' THEN 'gpt-4'
  WHEN provider = 'anthropic' THEN 'claude-3-sonnet'
  WHEN provider = 'mistral' THEN 'mistral-large'
  ELSE NULL
END
WHERE model IS NULL;