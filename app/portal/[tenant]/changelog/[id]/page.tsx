import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import { publicApi } from "@/lib/api/public";
import { Card } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";

export default async function PortalChangelogDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant, id } = await params;
  const decoded = decodeURIComponent(tenant);
  const entry = await publicApi.getChangelog(decoded, id);

  if (!entry) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/portal/${decoded}/changelog`}
        className="inline-flex items-center gap-1 text-sm text-[#1c0a0c]/60 hover:text-[#1c0a0c]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to changelog
      </Link>

      <Card className="p-8">
        <h1 className="text-3xl font-bold text-[#1c0a0c]">{entry.title}</h1>
        {entry.summary && (
          <p className="mt-2 text-lg text-[#1c0a0c]/70">{entry.summary}</p>
        )}
        <div className="mt-4 flex items-center gap-2 border-b border-black/5 pb-6 text-sm text-[#1c0a0c]/60">
          <Calendar className="h-4 w-4" />
          {entry.created_at
            ? new Date(entry.created_at).toLocaleDateString()
            : "Recently"}
          {entry.created_by_name && <span>· by {entry.created_by_name}</span>}
        </div>
        <div className="mt-6">
          <Markdown content={entry.content || ""} />
        </div>
      </Card>
    </div>
  );
}
