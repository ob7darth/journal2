/*
  # Add Prayer Requests Table

  1. New Tables
    - `prayer_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `title` (text, required)
      - `description` (text, required)
      - `is_anonymous` (boolean, default false)
      - `is_public` (boolean, default true)
      - `is_answered` (boolean, default false)
      - `answered_at` (timestamp, nullable)
      - `answer_description` (text, nullable)
      - `expires_at` (timestamp, default 30 days from creation)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `prayer_requests` table
    - Add policies for users to manage their own requests
    - Add policy for viewing public requests

  3. Performance
    - Add indexes for user lookups and public requests
*/

-- Create prayer requests table
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

-- Enable RLS
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;

-- Policies for prayer requests
CREATE POLICY "Users can insert their own prayer requests"
  ON prayer_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view public prayer requests"
  ON prayer_requests
  FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can update their own prayer requests"
  ON prayer_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prayer requests"
  ON prayer_requests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_prayer_requests_updated_at'
  ) THEN
    CREATE TRIGGER update_prayer_requests_updated_at
      BEFORE UPDATE ON prayer_requests
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prayer_requests_user_id ON prayer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_public_created_at ON prayer_requests(is_public, created_at DESC) WHERE is_public = true;