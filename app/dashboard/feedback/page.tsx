import { FeedbackList } from "@/components/feedback/feedback-list";

export default function FeedbackPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1c0a0c]">Feedback Board</h2>
        <p className="text-sm text-[#1c0a0c]/60">
          Review, triage, and manage feedback submitted by your users
        </p>
      </div>

      <FeedbackList />
    </div>
  );
}
