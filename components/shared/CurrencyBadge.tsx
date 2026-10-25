import { Currency } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface CurrencyBadgeProps {
  amount: number;
  currency: Currency;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CurrencyBadge({ amount, currency, size = "md", className = "" }: CurrencyBadgeProps) {
  const isNio = currency === "NIO";

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5 font-bold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-lg font-mono tracking-tight ${
        isNio
          ? "bg-blue-50 text-blue-700 border border-blue-200/80"
          : "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
      } ${sizeClasses[size]} ${className}`}
    >
      <span>{formatCurrency(amount, currency)}</span>
      <span className="text-[10px] uppercase font-bold opacity-75">{currency}</span>
    </span>
  );
}
