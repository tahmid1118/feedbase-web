"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FileText, Calendar } from "lucide-react";
import { changelogApi, type Changelog } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ChangelogPage() {
  const { data: session } = useSession();
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChangelogs();
  }, []);

  const loadChangelogs = async () => {
    try {
      setLoading(true);
      const response = await changelogApi.list(
        {
          itemsPerPage: 50,
          currentPageNumber: 0,
          sortOrder: "desc",
          filterBy: "",
        },
        session?.user?.accessToken
      );

      if (response.data?.changelogs) {
        setChangelogs(response.data.changelogs);
      }
    } catch (error) {
      console.error("Failed to load changelogs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#1c0a0c]/60">Loading changelogs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1c0a0c]">Changelog</h2>
        <p className="text-sm text-[#1c0a0c]/60">
          Product updates and release notes
        </p>
      </div>

      {changelogs.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-[#1c0a0c]/30" />
          <p className="mt-4 text-[#1c0a0c]/60">
            No changelogs published yet.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {changelogs.map((changelog) => (
            <Card key={changelog.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-[#1c0a0c]">
                      {changelog.title}
                    </h3>
                    {changelog.is_published === 1 && (
                      <Badge className="bg-green-100 text-green-700">Published</Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-[#1c0a0c]/70">
                    {changelog.summary}
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-[#1c0a0c]/60">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {changelog.created_at
                        ? new Date(changelog.created_at).toLocaleDateString()
                        : "Recently"}
                    </span>
                    <span>by {changelog.created_by_name}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
