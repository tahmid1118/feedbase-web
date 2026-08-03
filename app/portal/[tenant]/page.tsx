import { publicApi, normalizeBoardSort, normalizeBoardStatus } from "@/lib/api/public";
import type { PostStatus } from "@/lib/api/types";
import { FeedbackSubmit } from "@/components/portal/feedback-submit";
import { BoardList } from "@/components/portal/board-list";
import { BoardSort } from "@/components/portal/board-sort";
import { BoardTabs } from "@/components/portal/board-tabs";
import { getTranslation } from "@/lib/i18n/server";

const DEFAULT_BRAND = "#c74959";

// Posts fetched per page — the server-rendered first page, and every
// client-side "load more" tick after it (components/portal/board-list.tsx).
const PAGE_SIZE = 20;

export default async function PortalBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ sort?: string; status?: string }>;
}) {
  const { tenant } = await params;
  const decoded = decodeURIComponent(tenant);
  const { t } = await getTranslation();
  const sp = await searchParams;
  const sort = normalizeBoardSort(sp?.sort);
  const status = normalizeBoardStatus(sp?.status);
  const filters =
    status === "all" ? undefined : { status: status as PostStatus };
  // getTenant is React-cached, so this shares the layout's tenant lookup.
  const [data, info] = await Promise.all([
    publicApi.getBoard(decoded, filters, PAGE_SIZE, sort),
    publicApi.getTenant(decoded),
  ]);
  const posts = data?.posts ?? [];
  const total = data?.total ?? posts.length;
  const brand = info?.branding_primary_color || DEFAULT_BRAND;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1c0a0c]">
            {t("portal.boardTitle")}
          </h1>
          <p className="text-sm text-[#1c0a0c]/60">
            {t("portal.boardSubtitle")}
          </p>
        </div>
        <FeedbackSubmit
          tenant={decoded}
          brand={brand}
          attachmentsEnabled={Boolean(info?.attachments_enabled)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <BoardTabs value={status} />
          <BoardSort value={sort} />
        </div>

        {/* Keyed on status+sort: switching tabs/sort should start a fresh
            accumulated list from the new first page, not try to reconcile
            client state built for a different filter. */}
        <BoardList
          key={`${status}-${sort}`}
          tenant={decoded}
          initialPosts={posts}
          initialTotal={total}
          status={status}
          sort={sort}
          brand={brand}
        />
      </div>
    </div>
  );
}
