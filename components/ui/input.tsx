import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * `text-sm` at every width, a deliberate change from stock shadcn's
 * `text-base md:text-sm`, so placeholders match the UI around them (stock
 * measured 15px against 12-13px buttons on the same screen).
 *
 * EXCEPT on iOS, which gets 16px from an unlayered
 * `@supports (-webkit-touch-callout: none)` rule in app/globals.css. iOS
 * Safari zooms the page on focus of any field under 16px, and that was not a
 * cosmetic cost: inside a dialog it pushed the form off the right edge while
 * the keyboard covered the bottom. So the smaller size applies to Android and
 * desktop only. `maximum-scale=1` is still not an option — it disables
 * pinch-zoom for everyone (WCAG 1.4.4).
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
