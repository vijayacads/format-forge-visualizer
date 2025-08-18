-- FINAL SECURITY FIX: Ensure anonymous users cannot access sensitive data

-- First, let's check and fix form_submissions policies
-- The current policy may not be blocking anonymous users properly

-- Drop existing policies to rebuild them correctly
DROP POLICY IF EXISTS "Template owners can view form submissions for their templates only" ON form_submissions;
DROP POLICY IF EXISTS "Users can view shares for their own templates" ON template_shares;

-- FORM SUBMISSIONS: Only authenticated template owners can view submissions
CREATE POLICY "Only authenticated template owners can view form submissions"
ON form_submissions
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM templates 
    WHERE templates.id = form_submissions.template_id 
    AND templates.created_by = auth.uid()::text
  )
);

-- TEMPLATE SHARES: Only authenticated template owners can view their share tokens  
CREATE POLICY "Only template owners can view their share tokens"
ON template_shares
FOR SELECT
TO authenticated  
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM templates 
    WHERE templates.id = template_shares.template_id 
    AND templates.created_by = auth.uid()::text
  )
);

-- Also ensure template_shares INSERT/UPDATE policies are restricted to authenticated users
DROP POLICY IF EXISTS "Users can create shares for their own templates" ON template_shares;
DROP POLICY IF EXISTS "Users can update shares for their own templates" ON template_shares;

CREATE POLICY "Authenticated users can create shares for their own templates"
ON template_shares
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM templates 
    WHERE templates.id = template_shares.template_id 
    AND templates.created_by = auth.uid()::text
  )
);

CREATE POLICY "Authenticated users can update shares for their own templates"
ON template_shares
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM templates 
    WHERE templates.id = template_shares.template_id 
    AND templates.created_by = auth.uid()::text
  )
);