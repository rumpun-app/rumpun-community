CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK(length(title) >= 1 AND length(title) <= 500),
  type TEXT NOT NULL CHECK(type IN ('document', 'book', 'archive', 'website', 'interview', 'image', 'certificate', 'database', 'other')),
  author TEXT CHECK(author IS NULL OR length(author) <= 500),
  repository TEXT CHECK(repository IS NULL OR length(repository) <= 500),
  publication TEXT CHECK(publication IS NULL OR length(publication) <= 1000),
  locator TEXT CHECK(locator IS NULL OR length(locator) <= 1000),
  notes TEXT CHECK(notes IS NULL OR length(notes) <= 10000),
  version TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sources_tree ON sources(tree_id);

CREATE TABLE IF NOT EXISTS citations (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK(target_type IN ('person', 'person_name', 'fact', 'relationship', 'source')),
  target_id TEXT NOT NULL,
  locator TEXT CHECK(locator IS NULL OR length(locator) <= 1000),
  transcription TEXT CHECK(transcription IS NULL OR length(transcription) <= 20000),
  confidence TEXT NOT NULL DEFAULT 'unknown' CHECK(confidence IN ('unknown', 'low', 'medium', 'high', 'disputed')),
  notes TEXT CHECK(notes IS NULL OR length(notes) <= 10000),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_citations_source ON citations(source_id);
CREATE INDEX IF NOT EXISTS idx_citations_target ON citations(target_type, target_id);
