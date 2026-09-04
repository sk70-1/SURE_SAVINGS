/**
 * Canonical formatting utilities for Sure-Savings web client.
 * Standardizes currency, number, and date presentation across all dashboard and calendar views.
 */

export function formatCurrency(amount: number | null | undefined, currency: string = "INR"): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "₹0";
  }

  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString("en-IN");
  
  if (currency === "INR" || !currency) {
    return `₹${formatted}`;
  }

  return `${currency} ${formatted}`;
}

export function formatNumber(amount: number | null | undefined, maximumFractionDigits: number = 2): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "0";
  }

  return amount.toLocaleString("en-IN", { maximumFractionDigits });
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}
