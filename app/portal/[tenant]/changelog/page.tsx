import Link from "next/link";
import { Calendar } from "lucide-react";
import { publicApi } from "@/lib/api/public";
import { Card } from "@/components/ui/card";
import { getTranslation } from "@/lib/i18n/server";

export default async function PortalChangelogPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const decoded = decodeURIComponent(tenant);
  const { t, lng } = await getTranslation();
  const data = await publicApi.getChangelogList(decoded);
  const changelogs = data?.changelogs ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1c0a0c]">
          {t("nav.changelog")}
        </h1>
        <p className="text-sm text-[#1c0a0c]/60">
          {t("portal.changelogSubtitle")}
        </p>
      </div>

      {changelogs.length === 0 ? (
        <div className="rounded-xl border border-black/5 bg-white p-12 text-center text-[#1c0a0c]/60">
          {t("portal.noUpdates")}
        </div>
      ) : (
        <div className="space-y-4">
          {changelogs.map((entry) => (
            <Card key={entry.id} className="p-6">
              <Link
                href={`/portal/${decoded}/changelog/${entry.id}`}
                className="text-xl font-semibold text-[#1c0a0c] hover:underline"
              >
                {entry.title}
              </Link>
              {entry.summary && (
                <p className="mt-2 text-sm text-[#1c0a0c]/70">{entry.summary}</p>
              )}
              <div className="mt-4 flex items-center gap-2 text-xs text-[#1c0a0c]/60">
                <Calendar className="h-3 w-3" />
                {entry.created_at
                  ? new Date(entry.created_at).toLocaleDateString(lng)
                  : t("portal.recently")}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
