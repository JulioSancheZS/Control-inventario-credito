import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Currency } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea importes según estándar de Nicaragua:
 * NIO: C$ 1,250.00
 * USD: $ 125.00
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const formattedNumber = new Intl.NumberFormat("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (currency === "NIO") {
    return `C$ ${formattedNumber}`;
  }
  return `$ ${formattedNumber}`;
}

/**
 * Formatea fechas a formato legible en español
 * Ej: 24 de oct, 2026 o 24/10/2026
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString.includes("T") ? dateString : `${dateString}T12:00:00`);
  return new Intl.DateTimeFormat("es-NI", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateShort(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString.includes("T") ? dateString : `${dateString}T12:00:00`);
  return new Intl.DateTimeFormat("es-NI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
