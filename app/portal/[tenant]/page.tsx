import { publicApi, normalizeBoardSort, normalizeBoardStatus } from "@/lib/api/public";
import type { PostStatus } from "@/lib/api/types";
import { FeedbackSubmit } from "@/components/portal/feedback-submit";
import { BoardList } from "@/components/portal/board-list";
import { BoardSort } from "@/components/portal/board-sort";
import { BoardTabs } from "@/components/portal/board-tabs";
import { SharePost } from "@/components/portal/share-post";
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
    <div className="space-y-3 sm:space-y-6">
      {/* One row on a phone too. "Give Feedback" is a floating button on mobile
          (see FeedbackSubmit), so this row only carries Share there — stacking
          it cost a full row of height for a single small button. */}
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#1c0a0c] sm:text-2xl">
            {t("portal.boardTitle")}
          </h1>
          {/* Hidden on a phone: it wraps to two lines and the board below it
              is self-explanatory — those ~40px are better spent on posts. */}
          <p className="hidden text-sm text-[#1c0a0c]/60 sm:block">
            {t("portal.boardSubtitle")}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <SharePost
            title={info?.name || t("portal.boardTitle")}
            brand={brand}
            heading={t("share.titleBoard")}
          />
          <FeedbackSubmit
            tenant={decoded}
            brand={brand}
            attachmentsEnabled={Boolean(info?.attachments_enabled)}
            requireSignIn={Boolean(info?.require_signin_to_post)}
          />
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
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
