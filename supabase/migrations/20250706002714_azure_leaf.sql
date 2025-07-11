/*
  # Create SOAP entries table with proper error handling

  1. New Tables
    - `soap_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `day` (integer, day number)
      - `scripture` (text, scripture verse)
      - `observation` (text, observation notes)
      - `application` (text, application notes)
      - `prayer` (text, prayer notes)
      - `reading_plan_day` (integer, optional reading plan day)
      - `is_shared` (boolean, whether entry is shared)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `soap_entries` table
    - Add policies for authenticated users to manage their own entries
    - Add policy for viewing shared entries

  3. Indexes
    - Index on user_id and day for performance
    - Index on reading_plan_day
    - Index on shared entries

  4. Triggers
    - Updated_at trigger for automatic timestamp updates
*/

-- Create SOAP entries table
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

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'soap_entries_user_id_fkey'
  ) THEN
    ALTER TABLE soap_entries 
    ADD CONSTRAINT soap_entries_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE soap_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can insert their own SOAP entries" ON soap_entries;
  DROP POLICY IF EXISTS "Users can view their own SOAP entries" ON soap_entries;
  DROP POLICY IF EXISTS "Users can update their own SOAP entries" ON soap_entries;
  DROP POLICY IF EXISTS "Users can delete their own SOAP entries" ON soap_entries;
  DROP POLICY IF EXISTS "Anyone can view shared SOAP entries" ON soap_entries;
  
  -- Create new policies
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
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_soap_entries_user_day 
  ON soap_entries(user_id, day);

CREATE INDEX IF NOT EXISTS idx_soap_entries_reading_plan_day 
  ON soap_entries(reading_plan_day);

CREATE INDEX IF NOT EXISTS idx_soap_entries_shared 
  ON soap_entries(is_shared, created_at) 
  WHERE is_shared = true;

-- Add updated_at trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_soap_entries_updated_at'
  ) THEN
    CREATE TRIGGER update_soap_entries_updated_at
      BEFORE UPDATE ON soap_entries
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;