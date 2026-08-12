CREATE TABLE IF NOT EXISTS relationships (
  id TEXT PRIMARY KEY,
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  from_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  to_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('biological_parent', 'adoptive_parent', 'foster_parent', 'guardian', 'spouse', 'partner', 'step_parent', 'sibling', 'custom')),
  custom_type TEXT CHECK(custom_type IS NULL OR length(custom_type) <= 100),
  date_kind TEXT CHECK(date_kind IS NULL OR date_kind IN ('exact', 'approximate', 'before', 'after', 'between', 'period', 'text', 'unknown')),
  date_original_text TEXT CHECK(date_original_text IS NULL OR length(date_original_text) <= 500),
  date_start TEXT,
  date_end TEXT,
  date_calendar TEXT CHECK(date_calendar IS NULL OR length(date_calendar) <= 100),
  confidence TEXT NOT NULL DEFAULT 'unknown' CHECK(confidence IN ('unknown', 'low', 'medium', 'high', 'disputed')),
  privacy TEXT NOT NULL DEFAULT 'members' CHECK(privacy IN ('members', 'editors', 'administrators')),
  notes TEXT CHECK(notes IS NULL OR length(notes) <= 10000),
  version TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_relationships_tree ON relationships(tree_id);
CREATE INDEX IF NOT EXISTS idx_relationships_from ON relationships(from_person_id);
CREATE INDEX IF NOT EXISTS idx_relationships_to ON relationships(to_person_id);
