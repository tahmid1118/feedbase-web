import { getTranslation } from "@/lib/i18n/server";

export default async function PortalNotFound() {
  const { t } = await getTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fdf8f9] px-6 text-center">
      <h1 className="text-3xl font-bold text-[#1c0a0c]">
        {t("portal.workspaceNotFound")}
      </h1>
      <p className="mt-2 max-w-md text-[#1c0a0c]/60">
        {t("portal.notFoundDesc")}
      </p>
    </div>
  );
}
