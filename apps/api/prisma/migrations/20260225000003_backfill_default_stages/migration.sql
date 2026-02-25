-- Insert default stages (Pending, Accepted, Rejected) for every role
-- that currently has no stages at all.
INSERT INTO "Stage" ("roleId", "name", "order", "color", "icon", "createdAt", "updatedAt")
SELECT r.id, s.name, s."order", s.color, s.icon, NOW(), NOW()
FROM "Role" r
CROSS JOIN (VALUES
  (1, 'Pending',  '#f97316', 'clock'),
  (2, 'Accepted', '#22c55e', 'check'),
  (3, 'Rejected', '#f43f5e', 'flag')
) AS s("order", name, color, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM "Stage" WHERE "roleId" = r.id
);
