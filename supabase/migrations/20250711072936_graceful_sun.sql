/*
  # Create chat tables

  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `user_name` (text, required)
      - `message` (text, required)
      - `message_type` (text, default 'message')
      - `created_at` (timestamp)

    - `chat_reactions`
      - `id` (uuid, primary key)
      - `message_id` (uuid, references chat_messages)
      - `user_id` (uuid, references profiles)
      - `reaction_type` (text, required)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for chat functionality

  3. Indexes
    - Index on message creation time
    - Index on message reactions
*/

-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  message text NOT NULL,
  message_type text DEFAULT 'message' CHECK (message_type IN ('message', 'prayer', 'encouragement')),
  created_at timestamptz DEFAULT now()
);

-- Create chat reactions table
CREATE TABLE IF NOT EXISTS chat_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'heart', 'wow', 'pray')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id, reaction_type)
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;

-- Chat messages policies
CREATE POLICY "Users can read all chat messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat messages"
  ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
  ON chat_messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Chat reactions policies
CREATE POLICY "Users can read all chat reactions"
  ON chat_reactions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own chat reactions"
  ON chat_reactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_message_id ON chat_reactions(message_id);