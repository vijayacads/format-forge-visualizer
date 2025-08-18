-- Add explicit denial policy for anonymous users on form_submissions
-- This should resolve the security scanner concern

-- Create a restrictive policy that explicitly denies anonymous access
CREATE POLICY "Deny anonymous access to form submissions"
ON form_submissions
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- Also add explicit denial for template_shares to be extra secure  
CREATE POLICY "Deny anonymous access to template shares"
ON template_shares
FOR ALL  
TO public
USING (false)
WITH CHECK (false);