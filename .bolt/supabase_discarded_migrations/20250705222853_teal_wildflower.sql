/*
  # Initial Database Setup for Life Journal

  1. New Tables
    - `profiles` - User profiles linked to auth.users
    - `soap_entries` - Daily SOAP study entries
    - `prayer_requests` - Community prayer requests
    - `prayer_responses` - Responses to prayer requests
    - `reading_progress` - Daily reading completion tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public prayer requests

  3. Functions and Triggers
    - Create updated_at trigger function
    - Create new user profile creation trigger
    - Add updated_at triggers to relevant tables
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text NOT NULL,
  is_guest boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create SOAP entries table
CREATE TABLE IF NOT EXISTS soap_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  day integer NOT NULL,
  scripture text DEFAULT '',
  observation text DEFAULT '',
  application text DEFAULT '',
  prayer text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, day)
);

-- Create reading progress table
CREATE TABLE IF NOT EXISTS reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  day integer NOT NULL,
  completed_at timestamptz DEFAULT now(),
  reading_time_minutes integer DEFAULT 0,
  passages_read jsonb DEFAULT '[]'::jsonb,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, day)
);

-- Create prayer requests table
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

-- Create prayer responses table
CREATE TABLE IF NOT EXISTS prayer_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id uuid REFERENCES prayer_requests(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  response_type text NOT NULL CHECK (response_type IN ('praying', 'encouragement', 'testimony')),
  message text DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE soap_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_responses ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile"
      ON profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- SOAP entries policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'soap_entries' AND policyname = 'Users can manage own SOAP entries'
  ) THEN
    CREATE POLICY "Users can manage own SOAP entries"
      ON soap_entries
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Reading progress policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reading_progress' AND policyname = 'Users can insert their own reading progress'
  ) THEN
    CREATE POLICY "Users can insert their own reading progress"
      ON reading_progress
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reading_progress' AND policyname = 'Users can view their own reading progress'
  ) THEN
    CREATE POLICY "Users can view their own reading progress"
      ON reading_progress
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reading_progress' AND policyname = 'Users can update their own reading progress'
  ) THEN
    CREATE POLICY "Users can update their own reading progress"
      ON reading_progress
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Prayer requests policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prayer_requests' AND policyname = 'Users can view public prayer requests or their own'
  ) THEN
    CREATE POLICY "Users can view public prayer requests or their own"
      ON prayer_requests
      FOR SELECT
      TO authenticated
      USING (is_public = true OR auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prayer_requests' AND policyname = 'Users can insert their own prayer requests'
  ) THEN
    CREATE POLICY "Users can insert their own prayer requests"
      ON prayer_requests
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prayer_requests' AND policyname = 'Users can update their own prayer requests'
  ) THEN
    CREATE POLICY "Users can update their own prayer requests"
      ON prayer_requests
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prayer_requests' AND policyname = 'Users can delete their own prayer requests'
  ) THEN
    CREATE POLICY "Users can delete their own prayer requests"
      ON prayer_requests
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Prayer responses policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prayer_responses' AND policyname = 'Users can view prayer responses to public requests'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prayer_responses' AND policyname = 'Users can insert their own prayer responses'
  ) THEN
    CREATE POLICY "Users can insert their own prayer responses"
      ON prayer_responses
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prayer_responses' AND policyname = 'Users can update their own prayer responses'
  ) THEN
    CREATE POLICY "Users can update their own prayer responses"
      ON prayer_responses
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prayer_responses' AND policyname = 'Users can delete their own prayer responses'
  ) THEN
    CREATE POLICY "Users can delete their own prayer responses"
      ON prayer_responses
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (with conditional checks)
DO $$
BEGIN
  -- Profiles updated_at trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- SOAP entries updated_at trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_soap_entries_updated_at'
  ) THEN
    CREATE TRIGGER update_soap_entries_updated_at
      BEFORE UPDATE ON soap_entries
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Prayer requests updated_at trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_prayer_requests_updated_at'
  ) THEN
    CREATE TRIGGER update_prayer_requests_updated_at
      BEFORE UPDATE ON prayer_requests
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger for new user profile creation (with conditional check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_soap_entries_user_day ON soap_entries(user_id, day);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_day ON reading_progress(user_id, day);
CREATE INDEX IF NOT EXISTS idx_reading_progress_completed ON reading_progress(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_user_id ON prayer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_created_at ON prayer_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_expires_at ON prayer_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_public ON prayer_requests(is_public, expires_at) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_prayer_responses_request_id ON prayer_responses(prayer_request_id);
CREATE INDEX IF NOT EXISTS idx_prayer_responses_user_id ON prayer_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_responses_created_at ON prayer_responses(created_at DESC);