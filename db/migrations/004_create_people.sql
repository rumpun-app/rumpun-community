CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  living_status TEXT NOT NULL DEFAULT 'unknown' CHECK(living_status IN ('living', 'deceased', 'unknown')),
  privacy TEXT NOT NULL DEFAULT 'members' CHECK(privacy IN ('members', 'editors', 'administrators')),
  sex TEXT CHECK(sex IS NULL OR sex IN ('female', 'male', 'intersex', 'unknown', 'not_recorded')),
  notes TEXT CHECK(notes IS NULL OR length(notes) <= 10000),
  version TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_people_tree ON people(tree_id);

CREATE TABLE IF NOT EXISTS person_names (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('birth', 'married', 'adopted', 'alias', 'religious', 'transliterated', 'other')),
  display TEXT NOT NULL CHECK(length(display) >= 1 AND length(display) <= 500),
  given TEXT CHECK(given IS NULL OR length(given) <= 200),
  surname TEXT CHECK(surname IS NULL OR length(surname) <= 200),
  prefix TEXT CHECK(prefix IS NULL OR length(prefix) <= 100),
  suffix TEXT CHECK(suffix IS NULL OR length(suffix) <= 100),
  preferred INTEGER NOT NULL DEFAULT 0,
  language_tag TEXT CHECK(language_tag IS NULL OR length(language_tag) <= 35)
);

CREATE INDEX IF NOT EXISTS idx_names_person ON person_names(person_id);

CREATE TABLE IF NOT EXISTS facts (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('birth', 'death', 'burial', 'marriage', 'divorce', 'residence', 'occupation', 'education', 'nationality', 'religion', 'custom')),
  custom_type TEXT CHECK(custom_type IS NULL OR length(custom_type) <= 100),
  value TEXT CHECK(value IS NULL OR length(value) <= 2000),
  date_kind TEXT CHECK(date_kind IS NULL OR date_kind IN ('exact', 'approximate', 'before', 'after', 'between', 'period', 'text', 'unknown')),
  date_original_text TEXT CHECK(date_original_text IS NULL OR length(date_original_text) <= 500),
  date_start TEXT,
  date_end TEXT,
  date_calendar TEXT CHECK(date_calendar IS NULL OR length(date_calendar) <= 100),
  place TEXT CHECK(place IS NULL OR length(place) <= 500),
  confidence TEXT NOT NULL DEFAULT 'unknown' CHECK(confidence IN ('unknown', 'low', 'medium', 'high', 'disputed')),
  privacy TEXT NOT NULL DEFAULT 'members' CHECK(privacy IN ('members', 'editors', 'administrators'))
);

CREATE INDEX IF NOT EXISTS idx_facts_person ON facts(person_id);
