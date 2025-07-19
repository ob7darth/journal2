/*
  # Fix authentication and database connectivity issues

  1. Tables
    - Ensure `profiles` table exists with proper structure
    - Ensure `prayer_requests` table exists with proper structure
    - Add missing `prayer_responses` table for prayer request responses
    
  2. Security
    - Enable RLS on all tables
    - Add proper policies for authenticated users
    - Fix any policy conflicts
    
  3. Functions and Triggers
    - Ensure user profile creation trigger exists
    - Add updated_at trigger function if missing
*/

-- Create or update the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text NOT NULL,
  is_guest boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add updated_at trigger for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create prayer_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  is_anonymous boolean DEFAULT false,
  is_public boolean DEFAULT true,
  is_answered boolean DEFAULT false,
  answered_at timestamptz,
  answer_description text,
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on prayer_requests
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view public prayer requests" ON prayer_requests;
DROP POLICY IF EXISTS "Users can insert their own prayer requests" ON prayer_requests;
DROP POLICY IF EXISTS "Users can update their own prayer requests" ON prayer_requests;
DROP POLICY IF EXISTS "Users can delete their own prayer requests" ON prayer_requests;

-- Create policies for prayer_requests
CREATE POLICY "Users can view public prayer requests"
  ON prayer_requests
  FOR SELECT
  TO authenticated
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can insert their own prayer requests"
  ON prayer_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own prayer requests"
  ON prayer_requests
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own prayer requests"
  ON prayer_requests
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add updated_at trigger for prayer_requests
DROP TRIGGER IF EXISTS update_prayer_requests_updated_at ON prayer_requests;
CREATE TRIGGER update_prayer_requests_updated_at
  BEFORE UPDATE ON prayer_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create prayer_responses table if it doesn't exist
CREATE TABLE IF NOT EXISTS prayer_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id uuid REFERENCES prayer_requests(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  response_type text NOT NULL CHECK (response_type IN ('praying', 'encouragement', 'testimony')),
  message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on prayer_responses
ALTER TABLE prayer_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view responses to public prayer requests" ON prayer_responses;
DROP POLICY IF EXISTS "Users can insert their own responses" ON prayer_responses;

-- Create policies for prayer_responses
CREATE POLICY "Users can view responses to public prayer requests"
  ON prayer_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prayer_requests pr 
      WHERE pr.id = prayer_request_id 
      AND (pr.is_public = true OR pr.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert their own responses"
  ON prayer_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, is_guest)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prayer_requests_user_id ON prayer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_public_created_at ON prayer_requests(is_public, created_at DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_prayer_responses_request_id ON prayer_responses(prayer_request_id);
CREATE INDEX IF NOT EXISTS idx_prayer_responses_user_id ON prayer_responses(user_id);