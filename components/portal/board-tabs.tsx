"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PUBLIC_BOARD_STATUSES,
  type PublicBoardStatus,
} from "@/lib/api/public";

const TRIGGER_CLASS =
  "rounded-lg text-[#1c0a0c]/70 transition-colors data-[state=active]:bg-[#c74959] data-[state=active]:text-white data-[state=inactive]:hover:bg-[#c74959]/10 data-[state=inactive]:hover:text-[#c74959]";

/**
 * Status filter tabs for the public board (All / Open / Planned / In Progress /
 * Completed / Rejected). Writes `?status=` so the Server Component re-renders
 * with the filtered board.
 */
export function BoardTabs({ value }: { value: PublicBoardStatus }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("status");
    else params.set("status", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <Tabs
      value={value}
      onValueChange={onChange}
      className="min-w-0 flex-1 sm:flex-initial"
    >
      {/* Scrolls on a phone rather than wrapping: wrapped pills inside a single
          bordered pill container read as a broken control. Matches the dashboard
          board and the Settings tab rail.
          No negative-margin bleed to the screen edges — the rail now shares its
          row with the sort control, so bleeding right would slide the pills
          underneath it. Instead the right edge fades, which reads as "scrolls
          for more"; without it the rail ends in a hard vertical cut mid-pill
          that looks like a rendering bug rather than an affordance. */}
      <div className="overflow-x-auto pb-1 [mask-image:linear-gradient(to_right,#000_calc(100%-24px),transparent)] sm:overflow-visible sm:pb-0 sm:[mask-image:none]">
        <TabsList className="min-w-max border border-[#e399a3]/30 bg-white">
          {PUBLIC_BOARD_STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} className={TRIGGER_CLASS}>
              {t(`status.${s}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </Tabs>
  );
}
