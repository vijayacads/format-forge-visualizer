-- Add image columns to existing templates table
-- Run this in your Supabase SQL Editor

-- Add image_url and image_data columns to templates table
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_data TEXT;

-- Add image_width and image_height columns to templates table
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS image_width INTEGER,
ADD COLUMN IF NOT EXISTS image_height INTEGER;

-- Update existing templates to have empty image data
UPDATE templates 
SET image_url = NULL, image_data = NULL 
WHERE image_url IS NULL;

-- Update existing templates to have default image dimensions
UPDATE templates 
SET image_width = 800, image_height = 600 
WHERE image_width IS NULL; 