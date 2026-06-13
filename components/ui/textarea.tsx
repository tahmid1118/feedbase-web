import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-[#e399a3]/50 bg-white px-3 py-2 text-base text-[#1c0a0c] shadow-sm transition-[color,box-shadow,border-color] outline-none placeholder:text-[#1c0a0c]/40 hover:border-[#e399a3] focus-visible:border-[#c74959] focus-visible:ring-2 focus-visible:ring-[#c74959]/25 disabled:cursor-not-allowed disabled:bg-[#fdf8f9] disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
