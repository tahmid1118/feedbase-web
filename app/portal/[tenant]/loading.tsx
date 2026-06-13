export default function PortalLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded-lg bg-[#e399a3]/25" />
        <div className="h-4 w-72 animate-pulse rounded bg-[#e399a3]/15" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-black/5 bg-white"
          />
        ))}
      </div>
    </div>
  );
}
