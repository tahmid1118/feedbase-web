"use client";

import { useTranslation } from "@/lib/i18n/client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { changelogApi, type Changelog } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/ui/markdown";

export default function ChangelogDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [changelog, setChangelog] = useState<Changelog | null>(null);
  const [loading, setLoading] = useState(true);

  const changelogId = parseInt(params.id as string);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await changelogApi.getById(changelogId, token);
      if (res.data) setChangelog(res.data);
    } catch (error) {
      console.error("Failed to load changelog:", error);
    } finally {
      setLoading(false);
    }
  }, [changelogId, token]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-[#1c0a0c]/60">
        {t("changelog.loadingOne")}
      </div>
    );
  }

  if (!changelog) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/changelog">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4" />
            {t("changelog.backTo")}
          </Button>
        </Link>
        <Card className="p-12 text-center">
          <p className="text-[#1c0a0c]/60">{t("changelog.notFound")}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/changelog">
        <Button variant="ghost">
          <ArrowLeft className="h-4 w-4" />
          {t("changelog.backTo")}
        </Button>
      </Link>

      <Card className="p-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-[#1c0a0c]">
            {changelog.title}
          </h1>
          {changelog.is_published === 1 ? (
            <Badge className="bg-green-100 text-green-700">{t("changelog.published")}</Badge>
          ) : (
            <Badge variant="outline" className="text-[#1c0a0c]/60">
              {t("changelog.draft")}
            </Badge>
          )}
        </div>

        {changelog.summary && (
          <p className="mt-2 text-lg text-[#1c0a0c]/70">{changelog.summary}</p>
        )}

        <div className="mt-4 flex items-center gap-4 border-b border-[#e399a3]/20 pb-6 text-sm text-[#1c0a0c]/60">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {changelog.created_at
              ? new Date(changelog.created_at).toLocaleDateString()
              : "Recently"}
          </span>
          {changelog.created_by_name && (
            <span>by {changelog.created_by_name}</span>
          )}
        </div>

        <div className="mt-6">
          <Markdown content={changelog.content || ""} />
        </div>
      </Card>
    </div>
  );
}
