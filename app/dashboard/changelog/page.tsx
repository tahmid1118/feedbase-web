import { ChangelogManager } from "@/components/changelog/changelog-manager";
import { getTranslation } from "@/lib/i18n/server";

export default async function ChangelogPage() {
  const { t } = await getTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1c0a0c]">{t("nav.changelog")}</h2>
        <p className="text-sm text-[#1c0a0c]/60">{t("page.changelog.subtitle")}</p>
      </div>

      <ChangelogManager />
    </div>
  );
}
