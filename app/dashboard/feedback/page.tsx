import { FeedbackList } from "@/components/feedback/feedback-list";
import { getTranslation } from "@/lib/i18n/server";

export default async function FeedbackPage() {
  const { t } = await getTranslation();
  return (
    <div className="space-y-3 sm:space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1c0a0c] sm:text-2xl">
          {t("page.feedback.title")}
        </h2>
        {/* Hidden on a phone: it wraps to two lines and repeats what the tabs
            and the list below already show. Those ~48px are better spent on
            actual feedback. */}
        <p className="hidden text-sm text-[#1c0a0c]/60 sm:block">
          {t("page.feedback.subtitle")}
        </p>
      </div>

      <FeedbackList />
    </div>
  );
}
