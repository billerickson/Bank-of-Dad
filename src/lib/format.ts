export function formatMoney(cents: number, options: { signed?: boolean; type?: "save" | "spend" | "interest" } = {}): string {
  const sign = options.signed ? (options.type === "spend" ? "-" : "+") : "";
  const dollars = Math.abs(cents) / 100;
  return `${sign}${new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(dollars)}`;
}

export function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseMoneyToCents(value: string): number | null {
  const cleaned = value.trim().replace(/[$,]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [dollars, cents = ""] = cleaned.split(".");
  const amount = Number.parseInt(dollars, 10) * 100 + Number.parseInt(cents.padEnd(2, "0"), 10);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
