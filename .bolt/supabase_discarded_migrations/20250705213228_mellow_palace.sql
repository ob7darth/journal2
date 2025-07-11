/*
  # Enhance Chat System

  1. New Tables
    - `chat_reactions` - Reactions to chat messages
    - `chat_room_members` - Track room membership

  2. Enhancements
    - Add reaction system to existing chat_messages
    - Add room membership tracking
    - Add message threading support
    - Add message editing capabilities

  3. Security
    - Update RLS policies for enhanced features
    - Add policies for reactions and room membership
*/

-- Create chat reactions table
CREATE TABLE IF NOT EXISTS chat_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'heart', 'wow', 'pray', 'amen')),
  created_at timestamptz DEFAULT now(),
  
  -- Ensure one reaction type per user per message
  UNIQUE(message_id, user_id, reaction_type)
);

-- Add foreign key constraints for reactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chat_reactions_message_id_fkey'
  ) THEN
    ALTER TABLE chat_reactions 
    ADD CONSTRAINT chat_reactions_message_id_fkey 
    FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chat_reactions_user_id_fkey'
  ) THEN
    ALTER TABLE chat_reactions 
    ADD CONSTRAINT chat_reactions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create chat room members table
CREATE TABLE IF NOT EXISTS chat_room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz DEFAULT now(),
  is_muted boolean DEFAULT false,
  
  -- Ensure one membership per user per room
  UNIQUE(room_id, user_id)
);

-- Add foreign key constraints for room members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chat_room_members_room_id_fkey'
  ) THEN
    ALTER TABLE chat_room_members 
    ADD CONSTRAINT chat_room_members_room_id_fkey 
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chat_room_members_user_id_fkey'
  ) THEN
    ALTER TABLE chat_room_members 
    ADD CONSTRAINT chat_room_members_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add columns to chat_messages for enhanced features
DO $$
BEGIN
  -- Add parent_message_id for threading
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'parent_message_id'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN parent_message_id uuid;
    ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_parent_fkey 
      FOREIGN KEY (parent_message_id) REFERENCES chat_messages(id) ON DELETE SET NULL;
  END IF;
  
  -- Add edited_at for message editing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'edited_at'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN edited_at timestamptz;
  END IF;
  
  -- Add is_pinned for important messages
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'is_pinned'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN is_pinned boolean DEFAULT false;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

-- Policies for chat reactions
CREATE POLICY "Users can add reactions to messages in public rooms"
  ON chat_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM chat_messages cm
      JOIN chat_rooms cr ON cm.room_id = cr.id
      WHERE cm.id = message_id AND cr.is_public = true
    )
  );

CREATE POLICY "Anyone can view reactions in public rooms"
  ON chat_reactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_messages cm
      JOIN chat_rooms cr ON cm.room_id = cr.id
      WHERE cm.id = message_id AND cr.is_public = true
    )
  );

CREATE POLICY "Users can delete their own reactions"
  ON chat_reactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for room members
CREATE POLICY "Users can join public rooms"
  ON chat_room_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE id = room_id AND is_public = true
    )
  );

CREATE POLICY "Users can view members of rooms they belong to"
  ON chat_room_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_room_members crm
      WHERE crm.room_id = chat_room_members.room_id 
      AND crm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own membership"
  ON chat_room_members
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_reactions_message 
  ON chat_reactions(message_id);

CREATE INDEX IF NOT EXISTS idx_chat_reactions_user 
  ON chat_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_room_members_room 
  ON chat_room_members(room_id);

CREATE INDEX IF NOT EXISTS idx_chat_room_members_user 
  ON chat_room_members(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_parent 
  ON chat_messages(parent_message_id) 
  WHERE parent_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_pinned 
  ON chat_messages(room_id, is_pinned, created_at) 
  WHERE is_pinned = true;