/*
  # SOAP Entries Table Setup

  1. New Tables
    - `soap_entries` - Daily SOAP study entries
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `day` (integer, day number)
      - `scripture` (text, selected scripture)
      - `observation` (text, observations)
      - `application` (text, applications)
      - `prayer` (text, prayers)
      - `reading_plan_day` (integer, optional reading plan reference)
      - `is_shared` (boolean, sharing flag)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `soap_entries` table
    - Add policies for users to manage their own entries
    - Add policy for viewing shared entries

  3. Performance
    - Add indexes for user/day lookups
    - Add index for shared entries
*/

-- First, check if table exists and add missing columns
DO $$
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'soap_entries') THEN
    CREATE TABLE soap_entries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      day integer NOT NULL,
      scripture text DEFAULT '',
      observation text DEFAULT '',
      application text DEFAULT '',
      prayer text DEFAULT '',
      reading_plan_day integer,
      is_shared boolean DEFAULT false,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      
      -- Ensure one entry per user per day
      UNIQUE(user_id, day)
    );
  ELSE
    -- Table exists, add missing columns if they don't exist
    
    -- Add reading_plan_day column if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'soap_entries' AND column_name = 'reading_plan_day'
    ) THEN
      ALTER TABLE soap_entries ADD COLUMN reading_plan_day integer;
    END IF;
    
    -- Add is_shared column if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'soap_entries' AND column_name = 'is_shared'
    ) THEN
      ALTER TABLE soap_entries ADD COLUMN is_shared boolean DEFAULT false;
    END IF;
  END IF;
END $$;

-- Add foreign key constraint conditionally
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'soap_entries_user_id_fkey'
    AND table_name = 'soap_entries'
  ) THEN
    ALTER TABLE soap_entries 
    ADD CONSTRAINT soap_entries_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE soap_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own SOAP entries" ON soap_entries;
DROP POLICY IF EXISTS "Users can view their own SOAP entries" ON soap_entries;
DROP POLICY IF EXISTS "Users can update their own SOAP entries" ON soap_entries;
DROP POLICY IF EXISTS "Users can delete their own SOAP entries" ON soap_entries;
DROP POLICY IF EXISTS "Anyone can view shared SOAP entries" ON soap_entries;

-- Create policies (now that we know all columns exist)
CREATE POLICY "Users can insert their own SOAP entries"
  ON soap_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own SOAP entries"
  ON soap_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own SOAP entries"
  ON soap_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own SOAP entries"
  ON soap_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view shared SOAP entries"
  ON soap_entries
  FOR SELECT
  TO authenticated
  USING (is_shared = true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_soap_entries_user_day 
  ON soap_entries(user_id, day);

CREATE INDEX IF NOT EXISTS idx_soap_entries_reading_plan_day 
  ON soap_entries(reading_plan_day);

CREATE INDEX IF NOT EXISTS idx_soap_entries_shared 
  ON soap_entries(is_shared, created_at) 
  WHERE is_shared = true;

-- Add updated_at trigger conditionally
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_soap_entries_updated_at'
    AND tgrelid = 'soap_entries'::regclass
  ) THEN
    CREATE TRIGGER update_soap_entries_updated_at
      BEFORE UPDATE ON soap_entries
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;