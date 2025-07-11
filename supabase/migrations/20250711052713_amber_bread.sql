/*
  # Add title field to SOAP entries

  1. Changes
    - Add `title` column to `soap_entries` table
    - Set default value to empty string for consistency
    - Update existing entries to have empty title

  2. Notes
    - This is a non-breaking change
    - Existing entries will continue to work
    - New entries can optionally include a title
*/

-- Add title column to soap_entries table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'soap_entries' AND column_name = 'title'
  ) THEN
    ALTER TABLE soap_entries ADD COLUMN title text DEFAULT '';
  END IF;
END $$;

-- Update any existing entries to have empty title if null
UPDATE soap_entries SET title = '' WHERE title IS NULL;