import Link from "next/link";
import { ThumbsUp, MessageSquare } from "lucide-react";
import { publicApi } from "@/lib/api/public";
import { Badge } from "@/components/ui/badge";

const STATUS_BADGE: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  planned: "bg-purple-100 text-purple-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

const TYPE_ICON: Record<string, string> = {
  bug_report: "🐛",
  feature_request: "✨",
  feedback: "💬",
};

export default async function PortalBoardPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const decoded = decodeURIComponent(tenant);
  const data = await publicApi.getBoard(decoded);
  const posts = data?.posts ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1c0a0c]">Feedback Board</h1>
        <p className="text-sm text-[#1c0a0c]/60">
          Vote on ideas and help shape the roadmap
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-black/5 bg-white p-12 text-center text-[#1c0a0c]/60">
          No feedback has been posted yet.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/portal/${decoded}/post/${post.id}`}
              className="block rounded-xl border border-black/5 bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-black/5 bg-[#fdf8f9]">
                  <ThumbsUp className="h-4 w-4 text-[#1c0a0c]/60" />
                  <span className="text-sm font-semibold text-[#1c0a0c]">
                    {post.vote_count}
                  </span>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{TYPE_ICON[post.post_type] ?? "💬"}</span>
                        <h3 className="font-semibold text-[#1c0a0c]">
                          {post.title}
                        </h3>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-[#1c0a0c]/70">
                        {post.description}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[post.status]}`}
                    >
                      {post.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#1c0a0c]/60">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {post.comment_count} comments
                    </span>
                    {post.tags?.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        style={
                          tag.color_hex
                            ? { color: tag.color_hex, borderColor: tag.color_hex }
                            : undefined
                        }
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
