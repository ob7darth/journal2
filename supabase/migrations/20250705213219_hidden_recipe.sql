/*
  # Add Reading Progress Tracking

  1. New Tables
    - `reading_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `day` (integer, day number in reading plan)
      - `completed_at` (timestamp, when reading was completed)
      - `reading_time_minutes` (integer, time spent reading)
      - `passages_read` (jsonb, array of passages read)
      - `notes` (text, optional reading notes)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `reading_progress` table
    - Add policies for users to manage their own progress

  3. Features
    - Track daily reading completion
    - Store reading time for analytics
    - Store which passages were read
    - Optional notes for each reading session
*/

-- Create reading progress table
CREATE TABLE IF NOT EXISTS reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  day integer NOT NULL,
  completed_at timestamptz DEFAULT now(),
  reading_time_minutes integer DEFAULT 0,
  passages_read jsonb DEFAULT '[]'::jsonb,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  
  -- Ensure one progress entry per user per day
  UNIQUE(user_id, day)
);

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reading_progress_user_id_fkey'
  ) THEN
    ALTER TABLE reading_progress 
    ADD CONSTRAINT reading_progress_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

-- Policies for reading progress
CREATE POLICY "Users can insert their own reading progress"
  ON reading_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reading progress"
  ON reading_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading progress"
  ON reading_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_day 
  ON reading_progress(user_id, day);

CREATE INDEX IF NOT EXISTS idx_reading_progress_completed 
  ON reading_progress(user_id, completed_at);