import { FeedbackList } from "@/components/feedback/feedback-list";
import { getTranslation } from "@/lib/i18n/server";

export default async function FeedbackPage() {
  const { t } = await getTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1c0a0c]">{t("page.feedback.title")}</h2>
        <p className="text-sm text-[#1c0a0c]/60">{t("page.feedback.subtitle")}</p>
      </div>

      <FeedbackList />
    </div>
  );
}
