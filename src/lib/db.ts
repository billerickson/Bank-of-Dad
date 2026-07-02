import { env } from "cloudflare:workers";

export type AppSettings = {
  id: "default";
  initialized: number;
  password_hash: string;
  monthly_interest_rate: number;
  created_at: string;
  updated_at: string;
};

export type KidRow = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  archived_at: string | null;
};

export type KidSummary = KidRow & {
  balance_cents: number;
  last_description: string | null;
  last_transaction_date: string | null;
};

export type TransactionType = "save" | "spend" | "interest";

export type TransactionRow = {
  id: string;
  kid_id: string;
  type: TransactionType;
  date: string;
  description: string;
  amount_cents: number;
  balance_after_cents: number;
  interest_for_month: string | null;
  created_at: string;
};

type AppEnv = Env & {
  SESSION_SECRET?: string;
};

export function getDb(): D1Database {
  return (env as AppEnv).DB;
}

export function getSecret(): string | undefined {
  return (env as AppEnv).SESSION_SECRET;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export async function getSettings(db = getDb()): Promise<AppSettings | null> {
  return db.prepare("SELECT * FROM app_settings WHERE id = 'default'").first<AppSettings>();
}

export async function createInitialApp(input: { passwordHash: string; kidNames: string[] }, db = getDb()): Promise<void> {
  const timestamp = nowIso();
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        "INSERT INTO app_settings (id, initialized, password_hash, monthly_interest_rate, created_at, updated_at) VALUES ('default', 1, ?, 0.01, ?, ?)"
      )
      .bind(input.passwordHash, timestamp, timestamp)
  ];

  input.kidNames.forEach((name, index) => {
    statements.push(
      db
        .prepare("INSERT INTO kids (id, name, sort_order, created_at, archived_at) VALUES (?, ?, ?, ?, NULL)")
        .bind(crypto.randomUUID(), name, index, timestamp)
    );
  });

  await db.batch(statements);
}

export async function listKidSummaries(db = getDb()): Promise<KidSummary[]> {
  const result = await db
    .prepare(
      `SELECT
        k.*,
        COALESCE(
          (
            SELECT t.balance_after_cents
            FROM transactions t
            WHERE t.kid_id = k.id
            ORDER BY t.date DESC, t.created_at DESC, t.id DESC
            LIMIT 1
          ),
          0
        ) AS balance_cents,
        (
          SELECT t.description
          FROM transactions t
          WHERE t.kid_id = k.id
          ORDER BY t.date DESC, t.created_at DESC, t.id DESC
          LIMIT 1
        ) AS last_description,
        (
          SELECT t.date
          FROM transactions t
          WHERE t.kid_id = k.id
          ORDER BY t.date DESC, t.created_at DESC, t.id DESC
          LIMIT 1
        ) AS last_transaction_date
      FROM kids k
      WHERE k.archived_at IS NULL
      ORDER BY k.sort_order ASC, k.created_at ASC`
    )
    .all<KidSummary>();

  return result.results ?? [];
}

export async function getKidSummary(kidId: string, db = getDb()): Promise<KidSummary | null> {
  return db
    .prepare(
      `SELECT
        k.*,
        COALESCE(
          (
            SELECT t.balance_after_cents
            FROM transactions t
            WHERE t.kid_id = k.id
            ORDER BY t.date DESC, t.created_at DESC, t.id DESC
            LIMIT 1
          ),
          0
        ) AS balance_cents,
        (
          SELECT t.description
          FROM transactions t
          WHERE t.kid_id = k.id
          ORDER BY t.date DESC, t.created_at DESC, t.id DESC
          LIMIT 1
        ) AS last_description,
        (
          SELECT t.date
          FROM transactions t
          WHERE t.kid_id = k.id
          ORDER BY t.date DESC, t.created_at DESC, t.id DESC
          LIMIT 1
        ) AS last_transaction_date
      FROM kids k
      WHERE k.id = ? AND k.archived_at IS NULL`
    )
    .bind(kidId)
    .first<KidSummary>();
}

export async function listTransactions(kidId: string, db = getDb()): Promise<TransactionRow[]> {
  const result = await db
    .prepare(
      `SELECT *
      FROM transactions
      WHERE kid_id = ?
      ORDER BY date DESC, created_at DESC, id DESC`
    )
    .bind(kidId)
    .all<TransactionRow>();

  return result.results ?? [];
}

async function listTransactionsAscending(kidId: string, db = getDb()): Promise<TransactionRow[]> {
  const result = await db
    .prepare(
      `SELECT *
      FROM transactions
      WHERE kid_id = ?
      ORDER BY date ASC, created_at ASC, id ASC`
    )
    .bind(kidId)
    .all<TransactionRow>();

  return result.results ?? [];
}

export async function recalculateKidBalances(kidId: string, db = getDb()): Promise<void> {
  const transactions = await listTransactionsAscending(kidId, db);
  let balance = 0;
  const statements: D1PreparedStatement[] = [];

  for (const transaction of transactions) {
    balance += transaction.type === "spend" ? -transaction.amount_cents : transaction.amount_cents;
    statements.push(db.prepare("UPDATE transactions SET balance_after_cents = ? WHERE id = ?").bind(balance, transaction.id));
  }

  if (statements.length > 0) {
    await db.batch(statements);
  }
}

export async function addTransaction(
  input: {
    kidId: string;
    type: Extract<TransactionType, "save" | "spend">;
    date: string;
    description: string;
    amountCents: number;
  },
  db = getDb()
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO transactions
        (id, kid_id, type, date, description, amount_cents, balance_after_cents, interest_for_month, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, NULL, ?)`
    )
    .bind(
      crypto.randomUUID(),
      input.kidId,
      input.type,
      input.date,
      input.description,
      input.amountCents,
      nowIso()
    )
    .run();

  await recalculateKidBalances(input.kidId, db);
}
