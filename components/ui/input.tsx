import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * `text-sm` at every width, which is a deliberate change from stock shadcn's
 * `text-base md:text-sm`. Stock renders 16px on a phone specifically because
 * iOS Safari zooms the page when a focused field is under 16px — but it left
 * every placeholder noticeably larger than the UI around it (measured: 15px
 * against 12-13px buttons and labels on the same screen).
 *
 * The trade is therefore explicit: fields now match their surroundings, and
 * iOS Safari will zoom in when one is focused (it zooms back out on blur).
 * The alternative — `maximum-scale=1` on the viewport — is not on the table,
 * since it disables pinch-zoom for everyone (WCAG 1.4.4). Restore
 * `text-base md:text-sm` here and in textarea.tsx to undo.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-[#e399a3]/50 bg-white px-3 py-1 text-sm text-[#1c0a0c] shadow-sm transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#1c0a0c] placeholder:text-[#1c0a0c]/40 hover:border-[#e399a3] focus-visible:border-[#c74959] focus-visible:ring-2 focus-visible:ring-[#c74959]/25 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#fdf8f9] disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
