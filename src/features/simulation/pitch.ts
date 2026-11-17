export const currencies = ["EUR", "USD", "GBP"] as const;
export type Currency = typeof currencies[number];
export type Pitch = {
  startup: string;
  pitch: string;
  currency: Currency;
  amount: number;
  equity: number;
};

function parseHundredths(value: FormDataEntryValue | null): number {
  const match = typeof value === "string" ? /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(value.trim()) : null;
  return match ? Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0")) : 0;
}

export function readPitch(data: FormData): Pitch | string {
  const startup = String(data.get("startup") ?? "").trim();
  const pitch = String(data.get("pitch") ?? "").trim();
  const currency = currencies.find((option) => option === data.get("currency"));
  const amount = parseHundredths(data.get("amount"));
  const equity = parseHundredths(data.get("equity"));

  if (startup.length < 2 || startup.length > 80) return "Enter a startup name between 2 and 80 characters.";
  if (pitch.length < 30 || pitch.length > 3000) return "Write a pitch between 30 and 3,000 characters.";
  if (!currency) return "Select a supported currency.";
  if (amount <= 0) return "Enter an investment above zero with up to two decimal places.";
  if (equity <= 0 || equity > 10000) return "Enter equity greater than 0% and at most 100%.";
  return { startup, pitch, currency, amount, equity };
}

export function money(amount: number, currency: Currency): string {
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount / 100);
}
