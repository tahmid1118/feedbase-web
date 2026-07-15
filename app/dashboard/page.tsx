import Link from "next/link";
import {
  BarChart3,
  GitBranch,
  MessageSquare,
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
      label: "Total Votes",
      value: totals?.totalVotes ?? 0,
      icon: ThumbsUp,
      tint: "bg-[#c74959]/10 text-[#c74959]",
    },
    {
      label: "Team Members",
      value: totals?.totalUsers ?? 0,
      icon: Users,
      tint: "bg-[#da6a78]/10 text-[#da6a78]",
    },
  ];

  const maxTrend = Math.max(1, ...(overview?.trends ?? []).map((t) => t.count));

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
            {(Object.keys(STATUS_LABELS) as PostStatus[]).map((status) => {
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

      {/* 30-day trend */}
      {overview?.trends && overview.trends.length > 0 && (
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#c74959]" />
            <h3 className="text-lg font-semibold text-[#1c0a0c]">
              New Feedback (last 30 days)
            </h3>
          </div>
          <div className="flex h-32 items-end gap-1">
            {overview.trends.map((point) => (
              <div
                key={point.date}
                className="group relative flex-1"
                title={`${point.date}: ${point.count}`}
              >
                <div
                  className="w-full rounded-t bg-[#c74959]/70 transition-colors group-hover:bg-[#c74959]"
                  style={{ height: `${(point.count / maxTrend) * 100}%` }}
                />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
