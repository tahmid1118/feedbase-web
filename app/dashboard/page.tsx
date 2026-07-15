import Link from "next/link";
import {
  BarChart3,
  GitBranch,
  MessageSquare,
  CheckCircle2,
  ThumbsUp,
  ArrowRight,
  Users,
} from "lucide-react";
import { auth } from "@/auth";
import {
  analyticsApi,
  postsApi,
  extractRows,
  type AnalyticsOverview,
  type Post,
  type PostStatus,
} from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<PostStatus, string> = {
  open: "Open",
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  closed: "Closed",
  rejected: "Rejected",
};

const STATUS_BADGE: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  planned: "bg-purple-100 text-purple-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

async function loadData(token?: string) {
  const [overviewRes, recentRes] = await Promise.allSettled([
    analyticsApi.overview(token),
    postsApi.list(
      { itemsPerPage: 5, currentPageNumber: 0, sortOrder: "desc", filterBy: "" },
      undefined,
      token
    ),
  ]);

  const overview: AnalyticsOverview | null =
    overviewRes.status === "fulfilled" ? overviewRes.value.data ?? null : null;

  const recent: Post[] =
    recentRes.status === "fulfilled"
      ? extractRows<Post>(recentRes.value.data, "posts")
      : [];

  return { overview, recent, available: overview != null };
}

export default async function DashboardPage() {
  const session = await auth();
  const { overview, recent, available } = await loadData(
    session?.user?.accessToken
  );

  const totals = overview?.totals;
  const statusCounts = overview?.statusCounts ?? {};
  const totalPosts = totals?.totalPosts ?? 0;

  const statCards = [
    {
      label: "Total Feedback",
      value: totalPosts,
      icon: MessageSquare,
      tint: "bg-[#c74959]/10 text-[#c74959]",
    },
    {
      label: "In Progress",
      value: statusCounts.in_progress ?? 0,
      icon: GitBranch,
      tint: "bg-[#da6a78]/10 text-[#da6a78]",
    },
    {
      label: "Completed",
      value: statusCounts.completed ?? 0,
      icon: CheckCircle2,
      tint: "bg-[#c74959]/10 text-[#c74959]",
    },
    {
      label: "Team Members",
      value: totals?.totalUsers ?? 0,
      icon: Users,
      tint: "bg-[#da6a78]/10 text-[#da6a78]",
    },
  ];

  // Build a robust 30-day series on the client, independent of what the API
  // returns — it may send only the days that had posts, and dates as either
  // 'YYYY-MM-DD' or a full ISO timestamp. We normalize each to a LOCAL calendar
  // day and zero-fill the gaps, so the chart is always 30 valid daily bars.
  const pad = (n: number) => String(n).padStart(2, "0");
  const toKey = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseDay = (input: string): string | null => {
    const s = String(input ?? "");
    // A plain 'YYYY-MM-DD' must be read as a LOCAL date (not UTC) so it doesn't
    // shift a day; a full ISO timestamp is parsed as-is and localized.
    const plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    const dt = plain
      ? new Date(Number(plain[1]), Number(plain[2]) - 1, Number(plain[3]))
      : new Date(s);
    return Number.isNaN(dt.getTime()) ? null : toKey(dt);
  };

  const countByDay = new Map<string, number>();
  for (const t of overview?.trends ?? []) {
    const key = parseDay(t.date);
    if (key) countByDay.set(key, (countByDay.get(key) ?? 0) + Number(t.count) || 0);
  }
  const trends = (() => {
    const out: { date: string; count: number }[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = toKey(d);
      out.push({ date: key, count: countByDay.get(key) ?? 0 });
    }
    return out;
  })();
  const maxTrend = Math.max(1, ...trends.map((t) => t.count));
  const trendTotal = trends.reduce((sum, t) => sum + t.count, 0);
  // "Jul 3" from a clean 'YYYY-MM-DD' key, parsed as a LOCAL date.
  const dayLabel = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1c0a0c]">Dashboard Overview</h2>
        <p className="text-sm text-[#1c0a0c]/60">
          Track your feedback, roadmap, and engagement metrics
        </p>
      </div>

      {!available && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to reach the backend API on port 4560. Showing empty metrics.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[#e399a3]/20 bg-white p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#1c0a0c]/60">{card.label}</p>
                <p className="mt-2 text-3xl font-bold text-[#1c0a0c]">
                  {card.value}
                </p>
              </div>
              <div className={`rounded-full p-3 ${card.tint}`}>
                <card.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Status breakdown */}
        <Card className="p-6 lg:col-span-1">
          <h3 className="mb-4 text-lg font-semibold text-[#1c0a0c]">
            Feedback by Status
          </h3>
          <div className="space-y-3">
            {(Object.keys(STATUS_LABELS) as PostStatus[])
              // 'closed' is a legacy status not offered in the UI — don't show it.
              .filter((status) => status !== "closed")
              .map((status) => {
              const count = statusCounts[status] ?? 0;
              const pct = totalPosts > 0 ? (count / totalPosts) * 100 : 0;
              return (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-[#1c0a0c]/70">
                      {STATUS_LABELS[status]}
                    </span>
                    <span className="font-medium text-[#1c0a0c]">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#e399a3]/20">
                    <div
                      className="h-full rounded-full bg-[#c74959]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent activity */}
        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#1c0a0c]">
              Recent Feedback
            </h3>
            <Link
              href="/dashboard/feedback"
              className="flex items-center gap-1 text-sm text-[#c74959] hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-[#1c0a0c]/60">
              <p>No feedback yet. Create your first post to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((post) => (
                <Link
                  key={post.id}
                  href={`/dashboard/feedback/${post.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-[#e399a3]/20 p-3 transition-colors hover:border-[#c74959]/40 hover:bg-[#fdf8f9]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm text-[#1c0a0c]/60">
                      <ThumbsUp className="h-3.5 w-3.5 text-[#c74959]" />
                      {post.vote_count}
                    </div>
                    <span className="line-clamp-1 font-medium text-[#1c0a0c]">
                      {post.title}
                    </span>
                  </div>
                  <Badge className={STATUS_BADGE[post.status]}>
                    {post.status.replace("_", " ")}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 30-day new-feedback trend */}
      {overview && (
        <Card className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#c74959]" />
              <h3 className="text-lg font-semibold text-[#1c0a0c]">
                New feedback
              </h3>
              <span className="text-sm text-[#1c0a0c]/50">· last 30 days</span>
            </div>
            <div className="text-sm text-[#1c0a0c]/60">
              <span className="font-semibold text-[#1c0a0c]">{trendTotal}</span>{" "}
              {trendTotal === 1 ? "new post" : "new posts"}
              {maxTrend > 1 && (
                <span className="text-[#1c0a0c]/40"> · peak {maxTrend}/day</span>
              )}
            </div>
          </div>

          {trendTotal === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-lg bg-[#fdf8f9] text-sm text-[#1c0a0c]/50">
              No new feedback in the last 30 days.
            </div>
          ) : (
            <>
              <div className="flex h-32 items-end gap-[3px]">
                {trends.map((point) => (
                  <div
                    key={point.date}
                    // Full-height column with the bar pinned to the bottom, so the
                    // bar's % height resolves against a definite height (a % height
                    // inside a shrink-to-content flex item computes to 0).
                    className="group relative flex h-full flex-1 flex-col justify-end"
                  >
                    <div
                      className="w-full rounded-t bg-[#c74959]/70 transition-colors group-hover:bg-[#c74959]"
                      style={{
                        height: `${(point.count / maxTrend) * 100}%`,
                        minHeight: point.count > 0 ? "3px" : undefined,
                      }}
                    />
                    {/* Hover tooltip: date + exact count. */}
                    <div className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1c0a0c] px-2 py-1 text-xs text-white group-hover:block">
                      <span className="font-semibold">{point.count}</span> ·{" "}
                      {dayLabel(point.date)}
                    </div>
                  </div>
                ))}
              </div>
              {/* X-axis: first / middle / last day. */}
              <div className="mt-2 flex justify-between text-xs text-[#1c0a0c]/40">
                <span>{dayLabel(trends[0].date)}</span>
                <span>{dayLabel(trends[Math.floor(trends.length / 2)].date)}</span>
                <span>{dayLabel(trends[trends.length - 1].date)}</span>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
