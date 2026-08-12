CREATE TABLE IF NOT EXISTS trees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(name) >= 1 AND length(name) <= 200),
  locale TEXT NOT NULL DEFAULT 'en' CHECK(locale GLOB '[A-Za-z][A-Za-z]*'),
  description TEXT CHECK(description IS NULL OR length(description) <= 2000),
  version TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Singleton tree invariant: only one row allowed
CREATE TRIGGER IF NOT EXISTS prevent_second_tree
BEFORE INSERT ON trees
WHEN (SELECT COUNT(*) FROM trees) >= 1
BEGIN
  SELECT RAISE(ABORT, 'Only one tree is supported per deployment');
END;
