/**
 * Canonical formatting utilities for Sure-Savings web client.
 * Standardizes currency, number, and date presentation across all dashboard and calendar views with full i18n support.
 */

const LOCALE_MAP: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  ta: "ta-IN",
  bn: "bn-IN",
};

export function formatCurrency(
  amount: number | null | undefined,
  currency: string = "INR",
  locale: string = "en"
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "₹0";
  }

  const rounded = Math.round(amount);
  const targetLocale = LOCALE_MAP[locale] || "en-IN";
  const formatted = rounded.toLocaleString(targetLocale);

  if (currency === "INR" || !currency) {
    return `₹${formatted}`;
  }

  return `${currency} ${formatted}`;
}

export function formatNumber(
  amount: number | null | undefined,
  maximumFractionDigits: number = 2,
  locale: string = "en"
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "0";
  }

  const targetLocale = LOCALE_MAP[locale] || "en-IN";
  return amount.toLocaleString(targetLocale, { maximumFractionDigits });
}

export function formatDate(
  dateString: string | null | undefined,
  locale: string = "en"
): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const targetLocale = LOCALE_MAP[locale] || "en-IN";
    return d.toLocaleDateString(targetLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}
