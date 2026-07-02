import { getDb, getSettings, listKidSummaries, nowIso, recalculateKidBalances, type TransactionRow } from "@/lib/db";

type InterestTransaction = {
  kidId: string;
  kidName: string;
  date: string;
  description: string;
  amountCents: number;
  interestForMonth: string;
  createdAt: string;
};

export type InterestResult = {
  appliedCount: number;
  totalCents: number;
  summaries: Array<{
    kidId: string;
    kidName: string;
    count: number;
    totalCents: number;
  }>;
};

function signedAmount(transaction: Pick<TransactionRow, "type" | "amount_cents">): number {
  return transaction.type === "spend" ? -transaction.amount_cents : transaction.amount_cents;
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function addMonths(key: string, amount: number): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + amount, 1));
  return monthKey(date);
}

function compareMonthKeys(a: string, b: string): number {
  return a.localeCompare(b);
}

function lastDayOfMonth(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month, 0));
  return date.toISOString().slice(0, 10);
}

function firstDayOfNextMonth(key: string): string {
  return `${addMonths(key, 1)}-01`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function sortTransactions<T extends { date: string; created_at?: string; createdAt?: string; id?: string }>(transactions: T[]): T[] {
  return [...transactions].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    const createdCompare = (a.created_at ?? a.createdAt ?? "").localeCompare(b.created_at ?? b.createdAt ?? "");
    if (createdCompare !== 0) return createdCompare;
    return (a.id ?? "").localeCompare(b.id ?? "");
  });
}

function balanceAtEndOfMonth(transactions: TransactionRow[], pending: InterestTransaction[], key: string): number {
  const endDate = lastDayOfMonth(key);
  const combined = sortTransactions([
    ...transactions,
    ...pending.map((transaction) => ({
      id: transaction.interestForMonth,
      kid_id: transaction.kidId,
      type: "interest" as const,
      date: transaction.date,
      description: transaction.description,
      amount_cents: transaction.amountCents,
      balance_after_cents: 0,
      interest_for_month: transaction.interestForMonth,
      created_at: transaction.createdAt
    }))
  ]);

  return combined.reduce((balance, transaction) => {
    if (transaction.date > endDate) return balance;
    return balance + signedAmount(transaction);
  }, 0);
}

async function listKidTransactions(kidId: string, db = getDb()): Promise<TransactionRow[]> {
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

export async function applyMonthlyInterest(today = new Date(), db = getDb()): Promise<InterestResult> {
  const settings = await getSettings(db);
  const rate = settings?.monthly_interest_rate ?? 0.01;
  const kids = await listKidSummaries(db);
  const lastCompletedMonth = addMonths(monthKey(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))), -1);
  const summaries = new Map<string, { kidId: string; kidName: string; count: number; totalCents: number }>();
  let appliedCount = 0;
  let totalCents = 0;

  for (const kid of kids) {
    const transactions = await listKidTransactions(kid.id, db);
    if (transactions.length === 0) continue;

    const existingInterestMonths = new Set(
      transactions
        .filter((transaction) => transaction.type === "interest" && transaction.interest_for_month)
        .map((transaction) => transaction.interest_for_month as string)
    );
    const pending: InterestTransaction[] = [];
    let cursor = transactions[0].date.slice(0, 7);

    while (compareMonthKeys(cursor, lastCompletedMonth) <= 0) {
      if (!existingInterestMonths.has(cursor)) {
        const endingBalance = balanceAtEndOfMonth(transactions, pending, cursor);
        const interestCents = Math.round(endingBalance * rate);

        if (endingBalance > 0 && interestCents > 0) {
          pending.push({
            kidId: kid.id,
            kidName: kid.name,
            date: firstDayOfNextMonth(cursor),
            description: `Monthly interest for ${monthLabel(cursor)}`,
            amountCents: interestCents,
            interestForMonth: cursor,
            createdAt: nowIso()
          });
        }
      }

      cursor = addMonths(cursor, 1);
    }

    if (pending.length === 0) continue;

    for (const transaction of pending) {
      const result = await db
        .prepare(
          `INSERT OR IGNORE INTO transactions
            (id, kid_id, type, date, description, amount_cents, balance_after_cents, interest_for_month, created_at)
          VALUES (?, ?, 'interest', ?, ?, ?, 0, ?, ?)`
        )
        .bind(
          crypto.randomUUID(),
          transaction.kidId,
          transaction.date,
          transaction.description,
          transaction.amountCents,
          transaction.interestForMonth,
          transaction.createdAt
        )
        .run();

      if ((result.meta.changes ?? 0) > 0) {
        appliedCount += 1;
        totalCents += transaction.amountCents;
        const summary = summaries.get(transaction.kidId) ?? {
          kidId: transaction.kidId,
          kidName: transaction.kidName,
          count: 0,
          totalCents: 0
        };
        summary.count += 1;
        summary.totalCents += transaction.amountCents;
        summaries.set(transaction.kidId, summary);
      }
    }

    await recalculateKidBalances(kid.id, db);
  }

  return {
    appliedCount,
    totalCents,
    summaries: [...summaries.values()]
  };
}
