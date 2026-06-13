import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-[#e399a3]/50 bg-white px-3 py-1 text-base text-[#1c0a0c] shadow-sm transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#1c0a0c] placeholder:text-[#1c0a0c]/40 hover:border-[#e399a3] focus-visible:border-[#c74959] focus-visible:ring-2 focus-visible:ring-[#c74959]/25 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#fdf8f9] disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
