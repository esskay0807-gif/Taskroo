"use client";

import { cn } from "@/lib/utils";

/** Read-only star display for a rating value (supports halves visually via rounding). */
export function Stars({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const rounded = Math.round(value);
  return (
    <span className={cn("text-amber-500", className)} aria-label={`${value} stars`}>
      {"★".repeat(rounded)}
      <span className="text-muted-foreground">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}

/** Interactive 1–5 star selector. */
export function StarSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          aria-checked={value === n}
          role="radio"
          onClick={() => onChange(n)}
          className={cn(
            "text-2xl leading-none transition-colors",
            n <= value ? "text-amber-500" : "text-muted-foreground",
          )}
        >
          ★
        </button>
      ))}
    </div>
  );
}
