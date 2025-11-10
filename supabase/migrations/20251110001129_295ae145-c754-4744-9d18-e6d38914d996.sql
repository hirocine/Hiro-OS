-- Tornar platform_url opcional (NULLABLE)
ALTER TABLE platform_accesses 
  ALTER COLUMN platform_url DROP NOT NULL;