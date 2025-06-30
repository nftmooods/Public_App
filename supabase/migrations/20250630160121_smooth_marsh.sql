/*
  # Fix automatic user profile creation

  1. Corrections
    - Fix the handle_new_user function to properly create profiles
    - Ensure proper permissions and error handling
    - Add better logging for debugging

  2. Security
    - Maintain RLS policies
    - Ensure proper access controls
*/

-- Drop existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name text;
BEGIN
  -- Extract name from metadata or use email as fallback
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, name, subscription_plan, subscription_status)
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    'free',
    'active'
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Also add a function to manually create missing profiles
CREATE OR REPLACE FUNCTION create_missing_profiles()
RETURNS void AS $$
DECLARE
  auth_user RECORD;
  user_name text;
BEGIN
  -- Find auth users without profiles
  FOR auth_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
  LOOP
    -- Extract name from metadata or use email as fallback
    user_name := COALESCE(
      auth_user.raw_user_meta_data->>'name',
      auth_user.raw_user_meta_data->>'full_name',
      split_part(auth_user.email, '@', 1)
    );

    -- Create the missing profile
    INSERT INTO public.profiles (id, email, name, subscription_plan, subscription_status)
    VALUES (
      auth_user.id,
      auth_user.email,
      user_name,
      'free',
      'active'
    );
    
    RAISE LOG 'Created missing profile for user %', auth_user.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to create any missing profiles
SELECT create_missing_profiles();