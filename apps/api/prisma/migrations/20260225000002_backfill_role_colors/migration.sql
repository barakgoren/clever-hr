-- Backfill existing roles with distinct colors based on id % 10
UPDATE "Role"
SET color = CASE (id % 10)
  WHEN 0 THEN '#6366f1'
  WHEN 1 THEN '#8b5cf6'
  WHEN 2 THEN '#ec4899'
  WHEN 3 THEN '#f43f5e'
  WHEN 4 THEN '#f97316'
  WHEN 5 THEN '#eab308'
  WHEN 6 THEN '#22c55e'
  WHEN 7 THEN '#14b8a6'
  WHEN 8 THEN '#0ea5e9'
  WHEN 9 THEN '#3b82f6'
END;
