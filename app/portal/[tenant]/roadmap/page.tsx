import { ThumbsUp, Calendar } from "lucide-react";
import { publicApi } from "@/lib/api/public";
import { Card } from "@/components/ui/card";

export default async function PortalRoadmapPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const data = await publicApi.getRoadmap(decodeURIComponent(tenant));
  const columns = (data?.columns ?? []).sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const items = data?.items ?? [];

  const itemsFor = (columnId: number) =>
    items
      .filter((i) => i.roadmap_column_id === columnId)
      .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1c0a0c]">Roadmap</h1>
        <p className="text-sm text-[#1c0a0c]/60">
          See what&apos;s planned and in progress
        </p>
      </div>

      {columns.length === 0 ? (
        <div className="rounded-xl border border-black/5 bg-white p-12 text-center text-[#1c0a0c]/60">
          The roadmap hasn&apos;t been set up yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {columns.map((column) => {
            const columnItems = itemsFor(column.id);
            return (
              <div key={column.id} className="space-y-3">
                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <h3 className="font-semibold text-[#1c0a0c]">{column.name}</h3>
                  <p className="text-xs text-[#1c0a0c]/60">
                    {columnItems.length} items
                  </p>
                </div>
                <div className="space-y-2">
                  {columnItems.map((item) => (
                    <Card key={item.id} className="p-3">
                      <p className="text-sm font-medium text-[#1c0a0c]">
                        {item.title || `Post #${item.post_id}`}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-[#1c0a0c]/60">
                        {typeof item.vote_count === "number" && (
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {item.vote_count}
                          </span>
                        )}
                        {item.target_release_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(
                              item.target_release_date
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </Card>
                  ))}
                  {columnItems.length === 0 && (
                    <p className="rounded-lg border border-dashed border-black/10 py-4 text-center text-xs text-[#1c0a0c]/40">
                      Nothing here yet
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
