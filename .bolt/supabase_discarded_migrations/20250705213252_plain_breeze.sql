/*
  # Add Prayer Requests System

  1. New Tables
    - `prayer_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `title` (text, brief title of request)
      - `description` (text, detailed description)
      - `is_anonymous` (boolean, whether to show requester name)
      - `is_answered` (boolean, whether prayer was answered)
      - `answered_at` (timestamp, when marked as answered)
      - `answer_description` (text, how prayer was answered)
      - `expires_at` (timestamp, when request should be archived)
      - `is_public` (boolean, visible to all users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `prayer_responses`
      - `id` (uuid, primary key)
      - `prayer_request_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key to profiles)
      - `response_type` (text, 'praying', 'encouragement', 'testimony')
      - `message` (text, optional message)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add appropriate policies for privacy and sharing

  3. Features
    - Anonymous prayer requests
    - Prayer responses and encouragement
    - Answered prayer testimonies
    - Automatic archiving of old requests
*/

-- Create prayer requests table
CREATE TABLE IF NOT EXISTS prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  is_anonymous boolean DEFAULT false,
  is_answered boolean DEFAULT false,
  answered_at timestamptz,
  answer_description text DEFAULT '',
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create prayer responses table
CREATE TABLE IF NOT EXISTS prayer_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id uuid NOT NULL,
  user_id uuid NOT NULL,
  response_type text NOT NULL CHECK (response_type IN ('praying', 'encouragement', 'testimony')),
  message text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'prayer_requests_user_id_fkey'
  ) THEN
    ALTER TABLE prayer_requests 
    ADD CONSTRAINT prayer_requests_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'prayer_responses_prayer_request_id_fkey'
  ) THEN
    ALTER TABLE prayer_responses 
    ADD CONSTRAINT prayer_responses_prayer_request_id_fkey 
    FOREIGN KEY (prayer_request_id) REFERENCES prayer_requests(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'prayer_responses_user_id_fkey'
  ) THEN
    ALTER TABLE prayer_responses 
    ADD CONSTRAINT prayer_responses_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_responses ENABLE ROW LEVEL SECURITY;

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
  USING (is_public = true AND expires_at > now());

CREATE POLICY "Users can view their own prayer requests"
  ON prayer_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

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

-- Policies for prayer responses
CREATE POLICY "Users can add responses to public prayer requests"
  ON prayer_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM prayer_requests 
      WHERE id = prayer_request_id 
      AND is_public = true 
      AND expires_at > now()
    )
  );

CREATE POLICY "Users can view responses to public prayer requests"
  ON prayer_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prayer_requests 
      WHERE id = prayer_request_id 
      AND is_public = true
    )
  );

CREATE POLICY "Users can view responses to their own prayer requests"
  ON prayer_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prayer_requests 
      WHERE id = prayer_request_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own responses"
  ON prayer_responses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own responses"
  ON prayer_responses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_prayer_requests_public 
  ON prayer_requests(is_public, expires_at, created_at) 
  WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_prayer_requests_user 
  ON prayer_requests(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_prayer_requests_answered 
  ON prayer_requests(is_answered, answered_at) 
  WHERE is_answered = true;

CREATE INDEX IF NOT EXISTS idx_prayer_responses_request 
  ON prayer_responses(prayer_request_id, created_at);

CREATE INDEX IF NOT EXISTS idx_prayer_responses_user 
  ON prayer_responses(user_id, created_at);

-- Add updated_at trigger for prayer requests
CREATE TRIGGER update_prayer_requests_updated_at
  BEFORE UPDATE ON prayer_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();