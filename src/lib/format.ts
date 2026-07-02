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
