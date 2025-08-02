-- Fixed Supabase Database Schema for Format Forge Visualizer
-- Run this in your Supabase SQL Editor to fix RLS issues

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public templates are viewable by everyone" ON templates;
DROP POLICY IF EXISTS "Anyone can insert templates" ON templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON templates;
DROP POLICY IF EXISTS "Template shares are viewable by everyone" ON template_shares;
DROP POLICY IF EXISTS "Anyone can create template shares" ON template_shares;
DROP POLICY IF EXISTS "Users can update their own shares" ON template_shares;

-- Simplified RLS Policies for templates - Allow all operations for now
-- This is more permissive and will work with anonymous users
CREATE POLICY "Allow all operations on templates" ON templates
  FOR ALL USING (true) WITH CHECK (true);

-- Simplified RLS Policies for template_shares - Allow all operations
CREATE POLICY "Allow all operations on template_shares" ON template_shares
  FOR ALL USING (true) WITH CHECK (true);

-- Alternative: If you want more restrictive policies later, use these:
-- CREATE POLICY "Public templates are viewable by everyone" ON templates
--   FOR SELECT USING (is_public = true);
-- 
-- CREATE POLICY "Anyone can insert templates" ON templates
--   FOR INSERT WITH CHECK (true);
-- 
-- CREATE POLICY "Anyone can update templates" ON templates
--   FOR UPDATE USING (true) WITH CHECK (true);
-- 
-- CREATE POLICY "Anyone can delete templates" ON templates
--   FOR DELETE USING (true); 