/*
  # Create SOAP entries table

  1. New Tables
    - `soap_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `day` (integer, reading plan day)
      - `scripture` (text)
      - `observation` (text)
      - `application` (text)
      - `prayer` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `reading_plan_day` (integer, nullable)
      - `is_shared` (boolean, default false)
      - `title` (text)

  2. Security
    - Enable RLS on `soap_entries` table
    - Add policies for users to manage their own entries
    - Add policy for viewing shared entries

  3. Indexes
    - Index on user_id and day for fast lookups
    - Index on shared entries
    - Index on reading plan day
*/

-- Create SOAP entries table
CREATE TABLE IF NOT EXISTS soap_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day integer NOT NULL,
  scripture text DEFAULT '',
  observation text DEFAULT '',
  application text DEFAULT '',
  prayer text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  reading_plan_day integer,
  is_shared boolean DEFAULT false,
  title text DEFAULT '',
  UNIQUE(user_id, day)
);

-- Enable RLS
ALTER TABLE soap_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own SOAP entries"
  ON soap_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own SOAP entries"
  ON soap_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

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

CREATE POLICY "Users can manage own SOAP entries"
  ON soap_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_soap_entries_user_day ON soap_entries(user_id, day);
CREATE INDEX IF NOT EXISTS idx_soap_entries_shared ON soap_entries(is_shared, created_at) WHERE is_shared = true;
CREATE INDEX IF NOT EXISTS idx_soap_entries_reading_plan_day ON soap_entries(reading_plan_day);

-- Create trigger for updated_at
CREATE TRIGGER update_soap_entries_updated_at
  BEFORE UPDATE ON soap_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();