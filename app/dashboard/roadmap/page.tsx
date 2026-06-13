import { RoadmapBoard } from "@/components/roadmap/roadmap-board";

export default function RoadmapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1c0a0c]">Product Roadmap</h2>
        <p className="text-sm text-[#1c0a0c]/60">
          Organize feedback into stages and track feature development
        </p>
      </div>

      <RoadmapBoard />
    </div>
  );
}
