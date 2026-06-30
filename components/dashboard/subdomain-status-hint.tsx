import { Check, Loader2, X } from "lucide-react";
import type { SubdomainStatus } from "@/lib/hooks/use-subdomain-availability";

/** Inline availability feedback under a workspace subdomain input. */
export function SubdomainStatusHint({ status }: { status: SubdomainStatus }) {
  if (status === "idle") return null;
  if (status === "checking") {
    return (
      <p className="flex items-center gap-1 text-xs text-[#1c0a0c]/50">
        <Loader2 className="h-3 w-3 animate-spin" /> Checking availability…
      </p>
    );
  }
  if (status === "available") {
    return (
      <p className="flex items-center gap-1 text-xs text-green-600">
        <Check className="h-3 w-3" /> Available
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1 text-xs text-red-600">
      <X className="h-3 w-3" />
      {status === "taken"
        ? "That subdomain is already taken"
        : "Use 3–40 letters, numbers, or hyphens"}
    </p>
  );
}
