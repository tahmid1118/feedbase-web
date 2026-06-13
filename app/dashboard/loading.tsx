export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-[#e399a3]/25" />
        <div className="h-4 w-80 animate-pulse rounded bg-[#e399a3]/15" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-[#e399a3]/20 bg-white"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-[#e399a3]/20 bg-white" />
    </div>
  );
}
