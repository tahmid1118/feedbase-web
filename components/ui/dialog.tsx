"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "@/components/icons"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-[#1c0a0c]/30 duration-100 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * Keeps an open dialog inside the VISUAL viewport — the part of the screen not
 * covered by the on-screen keyboard.
 *
 * The dialog is `position: fixed` and sized against the LAYOUT viewport
 * (`max-h-[calc(100%-2rem)]`, centred with `top-1/2`). On iOS the keyboard
 * shrinks only the visual viewport, never the layout one, so the dialog kept
 * its full height and its lower half sat behind the keys. It could scroll, but
 * its own bottom edge was under the keyboard, so the last fields (name, email
 * on the portal submit form) could never be brought above it. Pinning `top`
 * and `max-height` to `visualViewport` re-fits it to the visible area as the
 * keyboard opens and closes.
 *
 * Inline styles rather than Tailwind `calc(var(--x) …)` arbitrary values: they
 * override the classes cleanly and there is no arbitrary-value parsing to get
 * wrong. The classes remain the fallback for SSR's first paint and for any
 * browser without `visualViewport`.
 */
function attachVisualViewportFit(node: HTMLDivElement): () => void {
  const vv = window.visualViewport
  if (!vv) return () => {}

  const fit = () => {
    node.style.top = `${vv.offsetTop + vv.height / 2}px`
    node.style.maxHeight = `${Math.max(vv.height - 32, 0)}px`
  }

  // Autoscroll: bring the focused field into the dialog's own scroll area.
  // `nearest` is a no-op when it's already visible, so calling this on every
  // viewport change is cheap and never yanks a field that's in view.
  const reveal = () => {
    const f = document.activeElement
    if (
      f instanceof HTMLElement &&
      node.contains(f) &&
      f.matches("input, textarea, select, [contenteditable='true']")
    ) {
      f.scrollIntoView({ block: "nearest" })
    }
  }

  // The keyboard animates in AFTER focus, and the viewport resize that follows
  // is what actually makes room — so reveal on resize too, not just on focus.
  // The timeout covers moving between fields while the keyboard is already
  // open, when no resize fires.
  let timer: ReturnType<typeof setTimeout> | undefined
  const onViewportChange = () => {
    fit()
    reveal()
  }
  const onFocusIn = () => {
    reveal()
    clearTimeout(timer)
    timer = setTimeout(reveal, 350)
  }

  fit()
  vv.addEventListener("resize", onViewportChange)
  vv.addEventListener("scroll", onViewportChange)
  node.addEventListener("focusin", onFocusIn)
  return () => {
    clearTimeout(timer)
    vv.removeEventListener("resize", onViewportChange)
    vv.removeEventListener("scroll", onViewportChange)
    node.removeEventListener("focusin", onFocusIn)
  }
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ref,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  // Attached from a callback ref that returns its cleanup (React 19), not from
  // an effect. Radix mounts the content only while the dialog is OPEN, so a
  // mount-time effect would see null and never run; a callback ref fires each
  // time it actually opens, and React runs the cleanup when it closes. Keeping
  // the DOM writes in a plain module function also keeps them out of compiled
  // code, where mutating a hook argument fails react-hooks/immutability. Any
  // ref passed in by a caller is still honoured.
  const setRefs = React.useCallback(
    (n: HTMLDivElement | null) => {
      if (typeof ref === "function") ref(n)
      else if (ref) ref.current = n
      if (!n) return
      const detach = attachVisualViewportFit(n)
      return () => {
        detach()
        if (typeof ref === "function") ref(null)
        else if (ref) ref.current = null
      }
    },
    [ref]
  )

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={setRefs}
        data-slot="dialog-content"
        className={cn(
          // max-h + overflow-y-auto: this is `position: fixed` and centered by
          // transform, not top-anchored, so a form taller than the viewport
          // (e.g. the portal feedback dialog with attachments + name/email)
          // had its top edge pushed off-screen with no way to scroll to it —
          // `overflow-hidden` clips rather than scrolls. Capped to the same
          // 2rem margin the width already uses, so it never touches the
          // viewport edge.
          "fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100%-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-2xl border border-white/70 bg-gradient-to-b from-white to-[#fdf8f9] p-4 text-sm text-[#1c0a0c] shadow-[0_30px_80px_-24px_rgba(28,10,12,0.5)] ring-1 ring-[#e399a3]/30 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-2 right-2"
              size="icon-sm"
            >
              <XIcon
              />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-2xl border-t border-[#e399a3]/20 bg-white/50 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
