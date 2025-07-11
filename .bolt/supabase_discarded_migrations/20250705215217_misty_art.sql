/*
  # Remove Chat Functionality

  This migration removes all chat-related tables and functionality while preserving
  prayer requests and other core features.

  ## Changes
  1. Drop chat-related tables
  2. Remove chat-related indexes
  3. Clean up any orphaned data

  ## Tables Removed
  - chat_messages
  - chat_reactions  
  - chat_rooms (if exists)
  - chat_room_members (if exists)
*/

-- Drop chat-related tables in correct order (foreign keys first)
DROP TABLE IF EXISTS chat_reactions CASCADE;
DROP TABLE IF EXISTS chat_room_members CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_rooms CASCADE;

-- Drop any remaining chat-related indexes
DROP INDEX IF EXISTS idx_chat_messages_created_at;
DROP INDEX IF EXISTS idx_chat_reactions_message_id;
DROP INDEX IF EXISTS idx_chat_reactions_user;
DROP INDEX IF EXISTS idx_chat_room_members_room;
DROP INDEX IF EXISTS idx_chat_room_members_user;
DROP INDEX IF EXISTS idx_chat_messages_parent;
DROP INDEX IF EXISTS idx_chat_messages_pinned;

-- Note: Prayer request tables are preserved as they are separate functionality
-- The following tables remain:
-- - prayer_requests
-- - prayer_responses
-- - profiles
-- - soap_entries
-- - reading_progress