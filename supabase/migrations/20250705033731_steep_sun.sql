/*
  # Fix Authentication System

  1. Database Changes
    - Update students table to properly link with Supabase auth
    - Fix profiles table foreign key reference
    - Update RLS policies to work correctly
    - Add proper triggers and functions

  2. Security
    - Fix RLS policies for proper user isolation
    - Ensure auth.uid() references work correctly
*/

-- First, let's fix the profiles table foreign key reference
-- The profiles table references 'users' but should reference auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update students table RLS policies to work with auth.uid()
-- The current policies compare auth.uid() with students.id, but students.id should be the auth user id
DROP POLICY IF EXISTS "Students can insert own data" ON students;
DROP POLICY IF EXISTS "Students can read own data" ON students;
DROP POLICY IF EXISTS "Students can update own data" ON students;

CREATE POLICY "Students can insert own data"
  ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Students can read own data"
  ON students
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Students can update own data"
  ON students
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Update applications table to properly link with students
-- The applications.student_id should reference students.id (which is now auth user id)
DROP POLICY IF EXISTS "Students can manage own applications" ON applications;

CREATE POLICY "Students can manage own applications"
  ON applications
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Update application_progress table policies
DROP POLICY IF EXISTS "Students can manage own progress" ON application_progress;

CREATE POLICY "Students can manage own progress"
  ON application_progress
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Update documents table policies
DROP POLICY IF EXISTS "Students can manage own documents" ON documents;

CREATE POLICY "Students can manage own documents"
  ON documents
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Update essays table policies
DROP POLICY IF EXISTS "Students can manage own essays" ON essays;

CREATE POLICY "Students can manage own essays"
  ON essays
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Update housing_applications table policies
DROP POLICY IF EXISTS "Students can manage own housing applications" ON housing_applications;

CREATE POLICY "Students can manage own housing applications"
  ON housing_applications
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Update i20_applications table policies
DROP POLICY IF EXISTS "Students can manage own i20 applications" ON i20_applications;

CREATE POLICY "Students can manage own i20 applications"
  ON i20_applications
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO profiles (id, email, full_name, is_guest)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'),
    false
  );
  
  -- Create student record for new user
  INSERT INTO students (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;