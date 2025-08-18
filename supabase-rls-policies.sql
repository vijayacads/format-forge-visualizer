-- RLS Policies for Format Forge Visualizer
-- Run this in Supabase Dashboard → SQL Editor

-- Enable RLS on all tables
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_shares ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "admin_bypass_templates" ON templates;
DROP POLICY IF EXISTS "admin_bypass_submissions" ON form_submissions;
DROP POLICY IF EXISTS "admin_bypass_shares" ON template_shares;
DROP POLICY IF EXISTS "public_templates_readable" ON templates;

-- Policy 1: Admin can access everything (bypass RLS)
CREATE POLICY "admin_bypass_templates" ON templates 
FOR ALL USING (auth.jwt() ->> 'email' = 'vigyanshaala@gmail.com');

-- Allow public users to create form submissions
CREATE POLICY "public_create_submissions" ON form_submissions 
FOR INSERT WITH CHECK (true);

-- Only admin can read form submissions
CREATE POLICY "admin_read_submissions" ON form_submissions 
FOR SELECT USING (auth.jwt() ->> 'email' = 'vigyanshaala@gmail.com');

-- Allow public users to read share tokens (for template sharing)
CREATE POLICY "public_read_shares" ON template_shares 
FOR SELECT USING (true);

-- Only admin can create/update/delete share tokens
CREATE POLICY "admin_manage_shares" ON template_shares 
FOR ALL USING (auth.jwt() ->> 'email' = 'vigyanshaala@gmail.com');

-- Policy 2: Public templates readable by anyone
CREATE POLICY "public_templates_readable" ON templates 
FOR SELECT USING (is_public = true);

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('templates', 'form_submissions', 'template_shares');
