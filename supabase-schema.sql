-- Supabase Database Schema for Format Forge Visualizer
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  fields JSONB NOT NULL,
  field_positions JSONB,
  image_url TEXT,
  image_data TEXT,
  image_width INTEGER,
  image_height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE
);

-- Template shares table
CREATE TABLE IF NOT EXISTS template_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0
);

-- Create form_submissions table for storing form data
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  form_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON templates(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON templates(is_public);
CREATE INDEX IF NOT EXISTS idx_templates_share_token ON templates(share_token);
CREATE INDEX IF NOT EXISTS idx_template_shares_token ON template_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_form_submissions_template_id ON form_submissions(template_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_email ON form_submissions(email);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public templates are viewable by everyone" ON templates;
DROP POLICY IF EXISTS "Anyone can insert templates" ON templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON templates;
DROP POLICY IF EXISTS "Template shares are viewable by everyone" ON template_shares;
DROP POLICY IF EXISTS "Anyone can create template shares" ON template_shares;
DROP POLICY IF EXISTS "Users can update their own shares" ON template_shares;
DROP POLICY IF EXISTS "Allow all operations for form_submissions" ON form_submissions;

-- Simplified RLS Policies for templates - Allow all operations for now
-- This is more permissive and will work with anonymous users
CREATE POLICY "Allow all operations on templates" ON templates
  FOR ALL USING (true) WITH CHECK (true);

-- Simplified RLS Policies for template_shares - Allow all operations
CREATE POLICY "Allow all operations on template_shares" ON template_shares
  FOR ALL USING (true) WITH CHECK (true);

-- Simplified RLS Policies for form_submissions - Allow all operations
CREATE POLICY "Allow all operations for form_submissions" ON form_submissions
  FOR ALL USING (true) WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_templates_updated_at 
  BEFORE UPDATE ON templates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql; 