export const currencies = ["EUR", "USD", "GBP"] as const;
export type Currency = typeof currencies[number];
export type Terms = { amount: number; equity: number };
export type Pitch = Terms & {
  startup: string;
  pitch: string;
  currency: Currency;
};

export function validTerms(value: unknown): value is Terms {
  if (typeof value !== "object" || value === null) return false;
  const { amount, equity } = value as Partial<Terms>;
  return typeof amount === "number" && Number.isSafeInteger(amount) &&
    amount > 0 && amount <= 99_999_999_999 &&
    typeof equity === "number" && Number.isInteger(equity) &&
    equity > 0 && equity <= 10000;
}

export function validPitch(value: unknown): value is Pitch {
  if (!validTerms(value)) return false;
  const candidate = value as Partial<Pitch>;
  return typeof candidate.startup === "string" &&
    candidate.startup.trim().length >= 2 && candidate.startup.trim().length <= 80 &&
    typeof candidate.pitch === "string" &&
    candidate.pitch.trim().length >= 30 && candidate.pitch.trim().length <= 3000 &&
    currencies.some((currency) => currency === candidate.currency);
}

function parseHundredths(value: FormDataEntryValue | null, label: string, maximum: number, minimum = 1): number | string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) {
    return `${label}: use a plain decimal number, such as 0.50, without commas or exponent notation.`;
  }

  const [whole, fraction = ""] = text.split(".");
  if (fraction.length > 2) return `${label}: use at most two decimal places.`;

  // Parse the decimal components separately to preserve exact minor units.
  const units = Number(whole || "0") * 100 + Number(fraction.padEnd(2, "0"));
  if (text.startsWith("-") || !Number.isSafeInteger(units) || units < minimum || units > maximum) {
    const range = minimum === 0 ? "between 0 and 100" : `greater than zero and at most ${maximum / 100}`;
    return `${label}: enter a value ${range}.`;
  }
  return units;
}

export function readPitch(data: FormData): Pitch | string {
  const startup = String(data.get("startup") ?? "").trim();
  const pitch = String(data.get("pitch") ?? "").trim();
  const currency = currencies.find((option) => option === data.get("currency"));
  if (startup.length < 2 || startup.length > 80) return "Enter a startup name between 2 and 80 characters.";
  if (pitch.length < 30 || pitch.length > 3000) return "Write a pitch between 30 and 3,000 characters.";
  if (!currency) return "Select a supported currency.";

  const terms = readTerms(data);
  if (typeof terms === "string") return terms;
  return { startup, pitch, currency, ...terms };
}

export function readTerms(data: FormData): Terms | string {
  const amount = parseHundredths(data.get("amount"), "Investment", 99_999_999_999);
  if (typeof amount === "string") return amount;
  const equity = parseHundredths(data.get("equity"), "Equity", 10000);
  return typeof equity === "string" ? equity : { amount, equity };
}

export function readFounderOwnership(value: string, badInput: boolean): number | string {
  if (badInput) return "Founder ownership must be a plain decimal percentage.";
  return value === "" ? 10000 : parseHundredths(value, "Founder ownership", 10000, 0);
}

export function money(amount: number, currency: Currency): string {
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount / 100);
}
