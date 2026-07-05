"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  // Light-only app — keep toasts on the light theme regardless of OS setting.
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-emerald-600" />
        ),
        info: (
          <InfoIcon className="size-4 text-[#c74959]" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-amber-600" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-red-600" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          // Solid, well-separated card so it reads clearly over the page.
          toast:
            "cn-toast group !bg-white !border !border-[#e399a3]/50 !shadow-xl !shadow-[#1c0a0c]/10 !text-[#1c0a0c]",
          title: "!text-[#1c0a0c] !font-semibold",
          description: "!text-[#1c0a0c]/75",
          actionButton:
            "!bg-[#c74959] !text-white hover:!bg-[#b03f4d] !font-medium",
          cancelButton: "!bg-transparent !text-[#1c0a0c]/60",
          closeButton: "!text-[#1c0a0c] !border-[#e399a3]/50",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
