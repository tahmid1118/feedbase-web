import { BarChart3, GitBranch, MessageSquare, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1c0a0c]">Dashboard Overview</h2>
        <p className="text-sm text-[#1c0a0c]/60">
          Track your feedback, roadmap, and engagement metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#e399a3]/20 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#1c0a0c]/60">Total Feedback</p>
              <p className="mt-2 text-3xl font-bold text-[#1c0a0c]">0</p>
            </div>
            <div className="rounded-full bg-[#c74959]/10 p-3">
              <MessageSquare className="h-6 w-6 text-[#c74959]" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e399a3]/20 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#1c0a0c]/60">In Progress</p>
              <p className="mt-2 text-3xl font-bold text-[#1c0a0c]">0</p>
            </div>
            <div className="rounded-full bg-[#da6a78]/10 p-3">
              <GitBranch className="h-6 w-6 text-[#da6a78]" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e399a3]/20 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#1c0a0c]/60">Total Votes</p>
              <p className="mt-2 text-3xl font-bold text-[#1c0a0c]">0</p>
            </div>
            <div className="rounded-full bg-[#c74959]/10 p-3">
              <TrendingUp className="h-6 w-6 text-[#c74959]" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e399a3]/20 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#1c0a0c]/60">Engagement</p>
              <p className="mt-2 text-3xl font-bold text-[#1c0a0c]">0%</p>
            </div>
            <div className="rounded-full bg-[#da6a78]/10 p-3">
              <BarChart3 className="h-6 w-6 text-[#da6a78]" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-[#e399a3]/20 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-[#1c0a0c]">Recent Activity</h3>
        <div className="flex items-center justify-center py-12 text-[#1c0a0c]/60">
          <p>No recent activity yet. Start by creating your first feedback post!</p>
        </div>
      </div>
    </div>
  );
}
