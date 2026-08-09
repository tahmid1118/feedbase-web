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

/** Sort control for the public board — writes `?sort=` so the server re-renders. */
export function BoardSort({ value }: { value: BoardSortValue }) {
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
      {/* Narrower on a phone so the status tabs keep usable room beside it —
          the selected label line-clamps rather than overflowing. */}
      <SelectTrigger className="h-9 w-[140px] shrink-0 gap-2 sm:w-[168px]">
        <ArrowUpDown className="h-4 w-4 text-[#1c0a0c]/50" />
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
