CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  initialized INTEGER NOT NULL DEFAULT 0,
  password_hash TEXT NOT NULL,
  monthly_interest_rate REAL NOT NULL DEFAULT 0.01,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kids (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  archived_at TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  kid_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('save', 'spend', 'interest')),
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  balance_after_cents INTEGER NOT NULL DEFAULT 0,
  interest_for_month TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (kid_id) REFERENCES kids(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_kids_sort_order
  ON kids(sort_order, created_at);

CREATE INDEX IF NOT EXISTS idx_transactions_kid_order
  ON transactions(kid_id, date DESC, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_interest_unique
  ON transactions(kid_id, interest_for_month)
  WHERE type = 'interest' AND interest_for_month IS NOT NULL;
