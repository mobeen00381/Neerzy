-- Migration: Add ai_reply column to posts table
-- This stores the AI-generated bot reply text so it persists across page refreshes
ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_reply TEXT;