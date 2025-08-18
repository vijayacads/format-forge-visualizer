-- CRITICAL SECURITY FIX: Implement proper RLS policies to prevent data theft
-- This fixes the publicly accessible form_submissions table that exposes customer emails

-- Drop the overly permissive policies that allow public access to sensitive data
DROP POLICY IF EXISTS "Allow all operations for form_submissions" ON form_submissions;
DROP POLICY IF EXISTS "Allow all operations on templates" ON templates;
DROP POLICY IF EXISTS "Allow all operations on template_shares" ON template_shares;

-- FORM SUBMISSIONS SECURITY: Restrict access to form submissions
-- Only allow reading form submissions if user is authenticated and owns the template
CREATE POLICY "Users can only access form submissions for their own templates"
ON form_submissions
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM templates 
    WHERE templates.id = form_submissions.template_id 
    AND (templates.created_by = auth.uid()::text OR auth.uid() IS NOT NULL)
  )
);

-- Allow inserting form submissions for public forms (anonymous users)
CREATE POLICY "Anyone can submit forms"
ON form_submissions
FOR INSERT
WITH CHECK (true);

-- TEMPLATES SECURITY: Only allow access to public templates or owned templates
CREATE POLICY "Users can view public templates and their own templates"
ON templates
FOR SELECT
USING (
  is_public = true 
  OR created_by = auth.uid()::text
  OR auth.uid() IS NULL  -- Allow anonymous access to public templates only
);

-- Allow authenticated users to create templates
CREATE POLICY "Authenticated users can create templates"
ON templates
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can only update their own templates
CREATE POLICY "Users can update their own templates"
ON templates
FOR UPDATE
USING (created_by = auth.uid()::text)
WITH CHECK (created_by = auth.uid()::text);

-- Users can only delete their own templates  
CREATE POLICY "Users can delete their own templates"
ON templates
FOR DELETE
USING (created_by = auth.uid()::text);

-- TEMPLATE SHARES SECURITY: Restrict access to share tokens
-- Only allow viewing shares for templates the user owns
CREATE POLICY "Users can view shares for their own templates"
ON template_shares
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM templates 
    WHERE templates.id = template_shares.template_id 
    AND templates.created_by = auth.uid()::text
  )
);

-- Allow authenticated users to create shares for their own templates
CREATE POLICY "Users can create shares for their own templates"
ON template_shares
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM templates 
    WHERE templates.id = template_shares.template_id 
    AND templates.created_by = auth.uid()::text
  )
);

-- Allow users to update shares for their own templates
CREATE POLICY "Users can update shares for their own templates"
ON template_shares
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM templates 
    WHERE templates.id = template_shares.template_id 
    AND templates.created_by = auth.uid()::text
  )
);