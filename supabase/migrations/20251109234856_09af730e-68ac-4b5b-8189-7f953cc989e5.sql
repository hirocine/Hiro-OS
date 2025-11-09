-- Step 1: Create new enum with all 9 categories
CREATE TYPE platform_category_new AS ENUM (
  'cloud',
  'ai',
  'references',
  'social_media',
  'site',
  'software',
  'music',
  'stock',
  'other'
);

-- Step 2: Remove the default temporarily
ALTER TABLE platform_accesses 
  ALTER COLUMN category DROP DEFAULT;

-- Step 3: Alter column to use new enum, preserving 'other' for existing records
ALTER TABLE platform_accesses 
  ALTER COLUMN category TYPE platform_category_new 
  USING CASE 
    WHEN category IS NULL THEN 'other'::platform_category_new
    ELSE 'other'::platform_category_new
  END;

-- Step 4: Set new default
ALTER TABLE platform_accesses 
  ALTER COLUMN category SET DEFAULT 'other'::platform_category_new;

-- Step 5: Drop old enum and rename new one
DROP TYPE platform_category;
ALTER TYPE platform_category_new RENAME TO platform_category;