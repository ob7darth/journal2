/*
  # Create Prayer Request System Tables

  1. New Tables
    - `prayer_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `title` (text, required)
      - `description` (text, required)
      - `is_anonymous` (boolean, default false)
      - `is_public` (boolean, default true)
      - `is_answered` (boolean, default false)
      - `answered_at` (timestamptz, nullable)
      - `answer_description` (text, nullable)
      - `expires_at` (timestamptz, default 30 days from creation)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

    - `prayer_responses`
      - `id` (uuid, primary key)
      - `prayer_request_id` (uuid, foreign key to prayer_requests)
      - `user_id` (uuid, foreign key to profiles)
      - `response_type` (text, constrained to specific values)
      - `message` (text, nullable)
      - `created_at` (timestamptz, default now)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
    - Allow viewing public prayer requests
    - Allow responding to public prayer requests

  3. Triggers
    - Add updated_at trigger for prayer_requests table
*/

-- Create prayer_requests table
CREATE TABLE IF NOT EXISTS prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  is_anonymous boolean DEFAULT false NOT NULL,
  is_public boolean DEFAULT true NOT NULL,
  is_answered boolean DEFAULT false NOT NULL,
  answered_at timestamptz,
  answer_description text,
  expires_at timestamptz DEFAULT (now() + interval '30 days') NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security for prayer_requests
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;

-- Create prayer_responses table
CREATE TABLE IF NOT EXISTS prayer_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id uuid REFERENCES prayer_requests(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  response_type text NOT NULL CHECK (response_type IN ('praying', 'encouragement', 'testimony')),
  message text DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security for prayer_responses
ALTER TABLE prayer_responses ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger for prayer_requests
CREATE TRIGGER update_prayer_requests_updated_at
  BEFORE UPDATE ON prayer_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Policies for prayer_requests
CREATE POLICY "Users can view public prayer requests or their own"
  ON prayer_requests
  FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own prayer requests"
  ON prayer_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

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

-- Policies for prayer_responses
CREATE POLICY "Users can view prayer responses to public requests"
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

CREATE POLICY "Users can insert their own prayer responses"
  ON prayer_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prayer responses"
  ON prayer_responses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prayer responses"
  ON prayer_responses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prayer_requests_user_id ON prayer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_created_at ON prayer_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_expires_at ON prayer_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_public ON prayer_requests(is_public, expires_at) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_prayer_responses_request_id ON prayer_responses(prayer_request_id);
CREATE INDEX IF NOT EXISTS idx_prayer_responses_user_id ON prayer_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_responses_created_at ON prayer_responses(created_at DESC);