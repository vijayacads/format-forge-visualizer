-- Final security fix: Correct the flawed RLS policies identified by security scan

-- Fix form_submissions policy: Remove the overly permissive auth.uid() IS NOT NULL condition
DROP POLICY IF EXISTS "Users can only access form submissions for their own templates" ON form_submissions;

CREATE POLICY "Template owners can view form submissions for their templates only"
ON form_submissions
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM templates 
    WHERE templates.id = form_submissions.template_id 
    AND templates.created_by = auth.uid()::text
  )
);

-- Fix templates policy: Remove anonymous access, only allow authenticated users + public templates
DROP POLICY IF EXISTS "Users can view public templates and their own templates" ON templates;

CREATE POLICY "Authenticated users can view public templates and their own templates"
ON templates
FOR SELECT
USING (
  (is_public = true OR created_by = auth.uid()::text) 
  AND auth.uid() IS NOT NULL
);

-- Add a separate policy for anonymous users to ONLY view explicitly public templates
CREATE POLICY "Anonymous users can view public templates only"
ON templates
FOR SELECT
USING (is_public = true AND auth.uid() IS NULL);