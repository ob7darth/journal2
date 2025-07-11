/*
  # Create SOAP entries table

  1. New Tables
    - `soap_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `day` (integer, day number)
      - `scripture` (text, scripture verse)
      - `observation` (text, observation notes)
      - `application` (text, application notes)
      - `prayer` (text, prayer notes)
      - `reading_plan_day` (integer, optional reading plan reference)
      - `is_shared` (boolean, sharing status)
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

-- Create SOAP entries table with all columns
CREATE TABLE IF NOT EXISTS soap_entries (
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

-- Create policies conditionally
DO $$
BEGIN
  -- Policy for inserting own entries
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'soap_entries' 
    AND policyname = 'Users can insert their own SOAP entries'
  ) THEN
    CREATE POLICY "Users can insert their own SOAP entries"
      ON soap_entries
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policy for viewing own entries
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'soap_entries' 
    AND policyname = 'Users can view their own SOAP entries'
  ) THEN
    CREATE POLICY "Users can view their own SOAP entries"
      ON soap_entries
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Policy for updating own entries
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'soap_entries' 
    AND policyname = 'Users can update their own SOAP entries'
  ) THEN
    CREATE POLICY "Users can update their own SOAP entries"
      ON soap_entries
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policy for deleting own entries
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'soap_entries' 
    AND policyname = 'Users can delete their own SOAP entries'
  ) THEN
    CREATE POLICY "Users can delete their own SOAP entries"
      ON soap_entries
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Policy for viewing shared entries
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'soap_entries' 
    AND policyname = 'Anyone can view shared SOAP entries'
  ) THEN
    CREATE POLICY "Anyone can view shared SOAP entries"
      ON soap_entries
      FOR SELECT
      TO authenticated
      USING (is_shared = true);
  END IF;
END $$;

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