"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { roadmapApi, type RoadmapColumn, type RoadmapItem } from "@/lib/api";
import { Card } from "@/components/ui/card";

export default function RoadmapPage() {
  const { data: session } = useSession();
  const [columns, setColumns] = useState<RoadmapColumn[]>([]);
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoadmap();
  }, []);

  const loadRoadmap = async () => {
    try {
      setLoading(true);
      const [columnsRes, itemsRes] = await Promise.all([
        roadmapApi.getColumns(session?.user?.accessToken),
        roadmapApi.getItems(session?.user?.accessToken),
      ]);

      if (columnsRes.data) setColumns(columnsRes.data);
      if (itemsRes.data) setItems(itemsRes.data);
    } catch (error) {
      console.error("Failed to load roadmap:", error);
    } finally {
      setLoading(false);
    }
  };

  const getItemsByColumn = (columnId: number) => {
    return items.filter((item) => item.roadmap_column_id === columnId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#1c0a0c]/60">Loading roadmap...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1c0a0c]">Product Roadmap</h2>
        <p className="text-sm text-[#1c0a0c]/60">
          Track feature development progress
        </p>
      </div>

      {columns.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-[#1c0a0c]/60">
            No roadmap columns configured yet.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {columns
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((column) => (
              <div key={column.id} className="space-y-3">
                <div className="rounded-lg bg-[#c74959]/10 p-3">
                  <h3 className="font-semibold text-[#1c0a0c]">{column.name}</h3>
                  <p className="text-xs text-[#1c0a0c]/60">
                    {getItemsByColumn(column.id).length} items
                  </p>
                </div>

                <div className="space-y-2">
                  {getItemsByColumn(column.id).map((item) => (
                    <Card key={item.id} className="p-3">
                      <p className="text-sm font-medium text-[#1c0a0c]">
                        {item.title || `Post #${item.post_id}`}
                      </p>
                      {item.target_release_date && (
                        <p className="mt-1 text-xs text-[#1c0a0c]/60">
                          Target: {new Date(item.target_release_date).toLocaleDateString()}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
