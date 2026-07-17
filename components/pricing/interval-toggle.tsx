"use client";

import { cn } from "@/lib/utils";
import type { BillingInterval } from "@/lib/api";

/**
 * Monthly / Yearly segmented toggle. Yearly carries a "Save N%" badge. Shared by
 * the public pricing cards and the dashboard Billing tab. `showSave` hides that
 * badge — pass `false` when a promotional yearly offer is active, so the generic
 * "Save 20%" doesn't contradict the per-plan offer discount shown on the cards.
 */
export function IntervalToggle({
  value,
  onChange,
  savePercent = 20,
  showSave = true,
  className,
}: {
  value: BillingInterval;
  onChange: (next: BillingInterval) => void;
  savePercent?: number;
  showSave?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-[#e399a3]/50 bg-white p-1",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange("month")}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
          value === "month"
            ? "bg-[#c74959] text-white"
            : "text-[#1c0a0c]/70 hover:text-[#c74959]"
        )}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange("year")}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
          value === "year"
            ? "bg-[#c74959] text-white"
            : "text-[#1c0a0c]/70 hover:text-[#c74959]"
        )}
      >
        Yearly
        {showSave && (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              value === "year"
                ? "bg-white/20 text-white"
                : "bg-green-100 text-green-700"
            )}
          >
            Save {savePercent}%
          </span>
        )}
      </button>
    </div>
  );
}
