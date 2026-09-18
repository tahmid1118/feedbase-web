"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "@/components/icons";
import type { BoardSort as BoardSortValue } from "@/lib/api/public";
import { useTranslation } from "@/lib/i18n/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OPTIONS: { value: BoardSortValue; key: string }[] = [
  { value: "newest", key: "sort.newest" },
  { value: "oldest", key: "sort.oldest" },
  { value: "most_voted", key: "sort.mostUpvoted" },
  { value: "least_voted", key: "sort.leastUpvoted" },
];

/**
 * Sort control for the public board — writes `?sort=` so the server re-renders.
 *
 * `compact` is the phone variant: it rides in the page header row beside Share
 * (see app/portal/[tenant]/page.tsx) rather than taking a row of its own, so it
 * matches that row's `size="sm"` buttons and sizes to its label instead of the
 * fixed 168px the desktop control uses to stop the tabs row shifting.
 */
export function BoardSort({
  value,
  compact = false,
}: {
  value: BoardSortValue;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "newest") params.delete("sort");
    else params.set("sort", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <Select value={value} onValueChange={onChange}>
      {/* `size="sm"` is what actually sets the height: the primitive's own
          `data-[size=default]:h-10` out-ranks a plain `h-*` class here.
          Compact also drops the leading icon and caps its width: sharing the
          row with the page title means a long label ("Most upvoted", and more
          so its translations) would otherwise push the title onto two lines.
          The chevron still marks it as a dropdown. */}
      <SelectTrigger
        size={compact ? "sm" : "default"}
        className={
          compact
            ? "w-auto max-w-[42vw] gap-1 px-2.5 text-xs"
            : "h-9 w-[168px] gap-2"
        }
      >
        {!compact && <ArrowUpDown className="h-4 w-4 text-[#1c0a0c]/50" />}
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {t(o.key)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
