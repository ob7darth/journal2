/*
  # Create reading progress table

  1. New Tables
    - `reading_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `day` (integer, reading plan day)
      - `completed_at` (timestamp)
      - `reading_time_minutes` (integer, default 0)
      - `passages_read` (jsonb, default [])
      - `notes` (text, default '')
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `reading_progress` table
    - Add policies for users to manage their own progress

  3. Indexes
    - Index on user_id and day for fast lookups
    - Index on completion tracking
*/

-- Create reading progress table
CREATE TABLE IF NOT EXISTS reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day integer NOT NULL,
  completed_at timestamptz DEFAULT now(),
  reading_time_minutes integer DEFAULT 0,
  passages_read jsonb DEFAULT '[]',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, day)
);

-- Enable RLS
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own reading progress"
  ON reading_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading progress"
  ON reading_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading progress"
  ON reading_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_day ON reading_progress(user_id, day);
CREATE INDEX IF NOT EXISTS idx_reading_progress_completed ON reading_progress(user_id, completed_at);