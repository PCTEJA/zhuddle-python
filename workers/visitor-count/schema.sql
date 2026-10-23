CREATE TABLE IF NOT EXISTS daily_visits (
  day TEXT PRIMARY KEY,
  visits INTEGER NOT NULL CHECK (visits >= 0),
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sync_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  through_time TEXT NOT NULL
);
